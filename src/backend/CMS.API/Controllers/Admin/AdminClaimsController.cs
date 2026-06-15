using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;
using CMS.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[Authorize(Roles = "Admin,ClaimsProcessor")]
[ApiController]
[Route("api/admin/claims")]
public sealed class AdminClaimsController : ControllerBase
{
    private readonly IClaimRepository _claimRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IEmailService _emailService;

    public AdminClaimsController(
        IClaimRepository claimRepository,
        IMemberRepository memberRepository,
        IEmailService emailService)
    {
        _claimRepository = claimRepository;
        _memberRepository = memberRepository;
        _emailService = emailService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingClaims()
    {
        var claims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);

        var pendingClaims = claims
            .Where(c => c.Status == ClaimStatus.PendingAI
                     || c.Status == ClaimStatus.Submitted)
            .Select(c => new
            {
                claimId = c.ClaimId,
                memberName = c.Member != null ? c.Member.FullName : "Unknown",
                claimDate = c.ClaimDate,
                claimAmount = c.ClaimAmount,
                description = c.Description,
                status = c.Status.ToString(),
                aiConfidenceScore = c.AiConfidenceScore
            })
            .OrderByDescending(c => c.claimDate)
            .ToList();

        return Ok(pendingClaims);
    }

    [HttpPost("{claimId}/approve")]
    public async Task<IActionResult> ApproveClaim(Guid claimId)
    {
        var claim = await _claimRepository.GetByIdAsync(claimId, HttpContext.RequestAborted);
        if (claim == null)
            return NotFound(new { error = "Claim not found" });

        claim.ManualApprove();
        await _claimRepository.UpdateAsync(claim, HttpContext.RequestAborted);

        // Send email notification
        await SendClaimStatusEmail(claim, "Approved", "Claim approved by administrator.", HttpContext.RequestAborted);

        return Ok(new { message = "Claim approved successfully" });
    }

    [HttpPost("{claimId}/reject")]
    public async Task<IActionResult> RejectClaim(Guid claimId)
    {
        var claim = await _claimRepository.GetByIdAsync(claimId, HttpContext.RequestAborted);
        if (claim == null)
            return NotFound(new { error = "Claim not found" });

        claim.ManualReject();
        await _claimRepository.UpdateAsync(claim, HttpContext.RequestAborted);

        // Send email notification
        await SendClaimStatusEmail(claim, "Rejected", "Claim rejected by administrator.", HttpContext.RequestAborted);

        return Ok(new { message = "Claim rejected successfully" });
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllClaims()
    {
        try
        {
            var allClaims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);
            var members = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);
            var memberDict = members.ToDictionary(m => m.MemberId, m => new { m.FullName, m.Email });

            var result = allClaims.Select(c => new
            {
                claimId = c.ClaimId,
                memberId = c.MemberId,
                memberName = memberDict.ContainsKey(c.MemberId) ? memberDict[c.MemberId].FullName : "Unknown",
                memberEmail = memberDict.ContainsKey(c.MemberId) ? memberDict[c.MemberId].Email : "",
                claimDate = c.ClaimDate.ToDateTime(TimeOnly.MinValue),
                amount = c.ClaimAmount.Amount,
                description = c.Description,
                status = c.Status.ToString(),
                aiConfidenceScore = c.AiConfidenceScore,
                aiDecision = c.AiDecision,
                aiReasoning = c.AiReasoning,
                // Medical Report Fields
                medicalReportFileName = c.MedicalReportFileName,
                medicalReportPath = c.MedicalReportPath,
                medicalReportSize = c.MedicalReportSize,
                medicalReportContentType = c.MedicalReportContentType,
                hasMedicalReport = !string.IsNullOrEmpty(c.MedicalReportPath),
                // Pre-Authorization Fields
                isPreAuthorization = c.IsPreAuthorization,
                hospitalName = c.HospitalName,
                admissionDate = c.AdmissionDate,
                doctorName = c.DoctorName,
                diagnosis = c.Diagnosis,
                estimatedAmount = c.IsPreAuthorization ? c.ClaimAmount.Amount : (decimal?)null,
                // Payment Fields
                paymentMode = c.PaymentMode,
                paymentReferenceNumber = c.PaymentReferenceNumber,
                treatmentType = c.TreatmentType,
                paymentDate = c.PaymentDate,
                // Audit Fields
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #region Private Helper Methods

    private async Task SendClaimStatusEmail(
        Claim claim,
        string status,
        string defaultReasoning,
        CancellationToken cancellationToken)
    {
        try
        {
            var member = await _memberRepository.GetByIdAsync(claim.MemberId, cancellationToken);
            if (member != null && !string.IsNullOrEmpty(member.Email))
            {
                // Convert DateOnly to DateTime for email
                var claimDateForEmail = claim.ClaimDate.ToDateTime(TimeOnly.MinValue);

                await _emailService.SendClaimStatusUpdateEmailAsync(
                    member.Email,
                    member.FullName,
                    claim.ClaimId.ToString(),
                    claim.ClaimAmount.Amount,
                    claimDateForEmail,
                    claim.Description ?? string.Empty,
                    status,
                    claim.AiConfidenceScore,
                    claim.AiDecision ?? status,
                    claim.AiReasoning ?? defaultReasoning,
                    cancellationToken);
            }
        }
        catch (Exception ex)
        {
            // Log error but don't throw to prevent breaking the API response
            Console.WriteLine($"[ERROR] Failed to send claim status email for ClaimId {claim.ClaimId}: {ex.Message}");
        }
    }

    #endregion
}