using CMS.Application.DTOs.AI;
using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;
using CMS.Domain.ValueObjects;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

public sealed class ClaimService : IClaimService
{
    private readonly IClaimRepository _claimRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IPlanRepository _planRepository;
    private readonly IAiVerificationService _aiVerificationService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<ClaimService> _logger;

    public ClaimService(
        IMemberRepository memberRepository,
        IClaimRepository claimRepository,
        IPlanRepository planRepository,
        IAiVerificationService aiVerificationService,
        IFileStorageService fileStorageService,
        ILogger<ClaimService> logger)
    {
        _memberRepository = memberRepository;
        _claimRepository = claimRepository;
        _planRepository = planRepository;
        _aiVerificationService = aiVerificationService;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<Guid> SubmitClaimAsync(
        Guid memberId,
        SubmitClaimRequest request,
        CancellationToken ct)
    {
        var member = await _memberRepository
            .GetByIdWithActivePlanAsync(memberId, ct)
            ?? throw new InvalidOperationException("Member not found.");

        if (member.ActivePlan == null)
            throw new InvalidOperationException("Member does not have an active plan.");

        // Handle file upload if present
        if (request.MedicalReport != null && request.MedicalReport.Length > 0)
        {
            // Validate file size (max 10MB)
            if (request.MedicalReport.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException("File size cannot exceed 10MB");

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "application/pdf" };
            if (!allowedTypes.Contains(request.MedicalReport.ContentType))
                throw new InvalidOperationException("Only JPEG, PNG, and PDF files are allowed");

            // We'll save after claim is created to use ClaimId
        }

        // Create claim (initially without file)
        var claim = member.SubmitClaim(
            new Money(request.Amount),
            request.ClaimDate,
            request.Description);

        // Save claim first to get ClaimId
        await _claimRepository.AddAsync(claim, ct);

        // Now save the file with ClaimId
        if (request.MedicalReport != null && request.MedicalReport.Length > 0)
        {
            await using var stream = request.MedicalReport.OpenReadStream();

            var fileUrl = await _fileStorageService.UploadClaimDocumentAsync(
                claim.ClaimId,
                stream,
                request.MedicalReport.FileName,
                ct
            );

            // Store minimal metadata (since interface only returns URL)
            claim.UpdateMedicalReport(
                request.MedicalReport.FileName,
                fileUrl,
                request.MedicalReport.Length,
                request.MedicalReport.ContentType
            );

            await _claimRepository.UpdateAsync(claim, ct);
        }

        // Build AI verification request (enhance with file content if needed)
        var fileContent = await ExtractFileContentForAI(request.MedicalReport, ct);
        var enhancedDescription = CombineDescriptionWithFileContent(request.Description, fileContent);

        var history = await GetMemberClaimHistory(memberId, ct);

        var aiRequest = new AiVerificationRequest
        {
            ClaimId = claim.ClaimId,
            MemberId = memberId,
            ClaimAmount = request.Amount,
            ClaimDate = request.ClaimDate,
            Description = enhancedDescription, // Enhanced with file content
            PlanContext = new PlanContextDto
            {
                PlanName = member.ActivePlan.Name,
                InsuredAmount = member.ActivePlan.InsuredAmount,
                StartDate = member.ActivePlan.StartDate,
                EndDate = member.ActivePlan.EndDate,
                DurationInMonths = member.ActivePlan.DurationInMonths,
                Features = System.Text.Json.JsonSerializer.Deserialize<string[]>(
                    member.ActivePlan.FeaturesJson) ?? Array.Empty<string>()
            },
            MemberHistory = new MemberHistoryDto
            {
                TotalClaimsSubmitted = history.TotalClaims,
                ApprovedClaims = history.ApprovedClaims,
                RejectedClaims = history.RejectedClaims,
                TotalClaimedAmount = history.TotalAmount,
                MemberSince = member.CreatedAt
            }
        };

        // Run AI verification
        try
        {
            var aiResult = await _aiVerificationService.VerifyClaimAsync(aiRequest, ct);

            claim.UpdateAiVerification(
                aiResult.ConfidenceScore,
                aiResult.Decision,
                aiResult.Reasoning);

            await _claimRepository.UpdateAsync(claim, ct);

            _logger.LogInformation(
                "AI Verification for claim {ClaimId}: Score={Score}, Decision={Decision}",
                claim.ClaimId,
                aiResult.ConfidenceScore,
                aiResult.Decision);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI verification failed for claim {ClaimId}", claim.ClaimId);
        }

        return claim.ClaimId;
    }

    private async Task<string> ExtractFileContentForAI(IFormFile? file, CancellationToken ct)
    {
        if (file == null) return string.Empty;

        // For now, just return filename and type
        // In production, you would extract text from PDF/images using OCR
        return $"[Medical Report: {file.FileName} ({file.ContentType})]";
    }

    private string CombineDescriptionWithFileContent(string originalDescription, string fileContent)
    {
        if (string.IsNullOrEmpty(fileContent))
            return originalDescription;

        return $"{originalDescription}\n\n{fileContent}";
    }

    private async Task<(int TotalClaims, int ApprovedClaims, int RejectedClaims, decimal TotalAmount)>
        GetMemberClaimHistory(Guid memberId, CancellationToken ct)
    {
        var claims = await _claimRepository.GetByMemberIdAsync(memberId, ct);

        return (
            TotalClaims: claims.Count,
            ApprovedClaims: claims.Count(c => c.Status == ClaimStatus.Approved),
            RejectedClaims: claims.Count(c => c.Status == ClaimStatus.Rejected),
            TotalAmount: claims.Sum(c => c.ClaimAmount.Amount)
        );
    }
}