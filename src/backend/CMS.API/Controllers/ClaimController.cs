using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/v1/claims")]
public sealed class ClaimsController : ControllerBase
{
    private readonly IClaimService _claimService;
    private readonly IClaimRepository _claimRepository;
    private readonly IFileStorageService _fileStorageService;

    public ClaimsController(
        IClaimService claimService,
        IClaimRepository claimRepository,
        IFileStorageService fileStorageService)
    {
        _claimService = claimService;
        _claimRepository = claimRepository;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyClaims()
    {
        var memberId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var claims = await _claimRepository
            .GetByMemberIdAsync(memberId, HttpContext.RequestAborted);

        return Ok(claims.Select(c => new ClaimResponse
        {
            ClaimId = c.ClaimId,
            ClaimDate = c.ClaimDate.ToDateTime(TimeOnly.MinValue),
            Amount = c.ClaimAmount.Amount,
            Status = c.Status.ToString(),
            Description = c.Description,
            AiConfidenceScore = c.AiConfidenceScore,
            AiDecision = c.AiDecision,
            AiReasoning = c.AiReasoning,
            HasMedicalReport = !string.IsNullOrEmpty(c.MedicalReportPath),
            MedicalReportFileName = c.MedicalReportFileName,
            MedicalReportContentType = c.MedicalReportContentType
        }));
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SubmitClaim(
    [FromForm] SubmitClaimRequest request,
    CancellationToken cancellationToken)
    {
        try
        {
            var memberId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var claimId = await _claimService.SubmitClaimAsync(
                memberId,
                request,
                cancellationToken);

            return Ok(new { claimId });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
    [HttpGet("{claimId}/medical-report")]
    [Authorize]
    public async Task<IActionResult> GetMedicalReport(Guid claimId)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Get claim using repository
        var claim = await _claimRepository.GetByIdAsync(claimId, HttpContext.RequestAborted);

        if (claim == null)
            return NotFound(new { error = "Claim not found" });

        // Check if user has access (member owns the claim OR is admin)
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("ClaimsProcessor");
        if (!isAdmin && claim.MemberId != memberId)
            return Forbid();

        if (string.IsNullOrEmpty(claim.MedicalReportPath))
            return NotFound(new { error = "No medical report attached to this claim" });

        // Get file bytes using the stored path
        var fileBytes = _fileStorageService.GetFileBytes(claim.MedicalReportPath);

        if (fileBytes == null)
            return NotFound(new { error = "Medical report file not found on server" });

        // Return the file with proper content type
        return File(
            fileBytes,
            claim.MedicalReportContentType ?? "application/octet-stream",
            claim.MedicalReportFileName ?? "medical_report"
        );
    }


}