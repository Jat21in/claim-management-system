using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Domain.Enums;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CMS.Domain.Entities;

[Authorize]
[ApiController]
[Route("api/v1/claims")]
public sealed class ClaimsController : ControllerBase
{
    private readonly IClaimService _claimService;
    private readonly IClaimRepository _claimRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IPolicyRepository _policyRepository;
    private readonly CmsDbContext _dbContext;

    public ClaimsController(
    IClaimService claimService,
    IClaimRepository claimRepository,
    IFileStorageService fileStorageService,
    IPolicyRepository policyRepository,
    CmsDbContext dbContext)
    {
        _claimService = claimService;
        _claimRepository = claimRepository;
        _fileStorageService = fileStorageService;
        _policyRepository = policyRepository;
        _dbContext = dbContext;
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
            MedicalReportContentType = c.MedicalReportContentType,
            // ✅ ADD THESE
            MedicalReportPath = c.MedicalReportPath,
            IsPreAuthorization = c.IsPreAuthorization,
            HospitalName = c.HospitalName,
            AdmissionDate = c.AdmissionDate,
            DoctorName = c.DoctorName,
            Diagnosis = c.Diagnosis,
            EstimatedAmount = c.ClaimAmount.Amount,
            PaymentMode = c.PaymentMode,
            PaymentReferenceNumber = c.PaymentReferenceNumber,
            TreatmentType = c.TreatmentType
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

    /// <summary>
    /// Create a pre-authorization request for hospitalization
    /// </summary>
    [HttpPost("pre-authorize")]
    public async Task<IActionResult> CreatePreAuthorization([FromBody] PreAuthorizationRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Check if member has active policy
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, HttpContext.RequestAborted);
        if (policy == null || policy.Status != PolicyStatus.Active)
            return BadRequest(new { error = "No active policy found" });

        // Check if hospital is in network
        var hospital = await _dbContext.NetworkHospitals
            .FirstOrDefaultAsync(h => h.HospitalId == request.HospitalId && h.IsActive);

        bool isCashless = hospital != null && hospital.CashlessLimit >= request.EstimatedAmount;

        // Create claim with pre-authorization
        var claim = CMS.Domain.Entities.Claim.Create(
            memberId,
            policy.PlanId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new CMS.Domain.ValueObjects.Money(request.EstimatedAmount),
            request.Description
        );

        claim.RequestPreAuthorization(
            request.AdmissionDate,
            request.HospitalId ?? Guid.Empty,
            request.HospitalName,
            request.DoctorName,
            request.Diagnosis);

        await _claimRepository.AddAsync(claim, HttpContext.RequestAborted);

        return Ok(new
        {
            claimId = claim.ClaimId,
            status = claim.Status.ToString(),
            message = isCashless
                ? "Pre-authorization request submitted. Cashless facility available up to ₹" + hospital!.CashlessLimit
                : "Pre-authorization request submitted. This is a reimbursement claim.",
            estimatedAmount = request.EstimatedAmount,
            cashlessEligible = isCashless,
            cashlessLimit = hospital?.CashlessLimit,
            hospitalName = request.HospitalName
        });
    }

    /// <summary>
    /// Submit final claim with bills after discharge
    /// </summary>
    [HttpPost("submit-with-bills")]
    public async Task<IActionResult> SubmitClaimWithBills([FromForm] SubmitClaimWithBillsRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var claim = await _claimRepository.GetByIdAsync(request.ClaimId, HttpContext.RequestAborted);
        if (claim == null)
            return NotFound(new { error = "Claim not found" });

        if (claim.MemberId != memberId)
            return Unauthorized(new { error = "Unauthorized" });

        // Update claim with final details
        claim.UpdateWithFinalBills(
            request.AdmissionDate,
            request.DischargeDate,
            request.FinalAmount,
            request.Diagnosis,
            request.TreatmentType);

        // Upload medical report if provided
        if (request.MedicalReport != null && request.MedicalReport.Length > 0)
        {
            // Save file logic here (using IFileStorageService)
            claim.AddMedicalReport(request.MedicalReport.FileName);
        }

        await _claimRepository.UpdateAsync(claim, HttpContext.RequestAborted);

        return Ok(new
        {
            claimId = claim.ClaimId,
            status = claim.Status.ToString(),
            message = "Claim submitted successfully. Awaiting verification.",
            finalAmount = request.FinalAmount,
            aiVerificationQueued = true
        });
    }

    /// <summary>
    /// Process claim payment (after approval)
    /// </summary>
    [HttpPost("{claimId:guid}/process-payment")]
    public async Task<IActionResult> ProcessClaimPayment(Guid claimId, [FromBody] ProcessClaimPaymentRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var claim = await _claimRepository.GetByIdAsync(claimId, HttpContext.RequestAborted);
        if (claim == null)
            return NotFound(new { error = "Claim not found" });

        if (claim.MemberId != memberId)
            return Unauthorized(new { error = "Unauthorized" });

        if (claim.Status != ClaimStatus.Approved)
            return BadRequest(new { error = "Claim must be approved before payment" });

        // Generate payment reference
        var paymentReference = GeneratePaymentReference(request.PaymentMode);

        claim.MarkAsPaid(paymentReference, request.PaymentMode);

        await _claimRepository.UpdateAsync(claim, HttpContext.RequestAborted);

        // Update policy utilized amount
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, HttpContext.RequestAborted);
        if (policy != null)
        {
            policy.UtilizeClaimAmount(claim.ClaimAmount.Amount);
            await _policyRepository.UpdateAsync(policy, HttpContext.RequestAborted);
        }

        return Ok(new
        {
            success = true,
            paymentReferenceNumber = paymentReference,
            paymentDate = DateTime.UtcNow,
            amount = claim.ClaimAmount.Amount,
            message = $"Claim payment of ₹{claim.ClaimAmount.Amount:N0} has been processed successfully. Amount will be credited within 2-3 business days."
        });
    }

    private string GeneratePaymentReference(string paymentMode)
    {
        var prefix = paymentMode switch
        {
            "NEFT" => "NEFT",
            "IMPS" => "IMPS",
            "CHEQUE" => "CHQ",
            _ => "PAY"
        };

        return $"{prefix}-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
    }
    // Request DTOs
    public class PreAuthorizationRequest
    {
        public DateTime AdmissionDate { get; set; }
        public Guid? HospitalId { get; set; }
        public string HospitalName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string TreatmentType { get; set; } = string.Empty;
        public decimal EstimatedAmount { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class SubmitClaimWithBillsRequest
    {
        public Guid ClaimId { get; set; }
        public DateTime AdmissionDate { get; set; }
        public DateTime DischargeDate { get; set; }
        public decimal FinalAmount { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public string TreatmentType { get; set; } = string.Empty;
        public IFormFile? MedicalReport { get; set; }
        public IFormFile? Bills { get; set; }
    }

}