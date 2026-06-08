using CMS.Application.Interfaces.Repositories;
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

    public AdminClaimsController(
        IClaimRepository claimRepository,
        IMemberRepository memberRepository)
    {
        _claimRepository = claimRepository;
        _memberRepository = memberRepository;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingClaims()
    {
        var claims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);

        var pendingClaims = claims
            .Where(c => c.Status == ClaimStatus.PendingAI
                     || c.Status == ClaimStatus.Submitted) // ✅ FIX
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
            .OrderByDescending(c => c.claimDate) // ✅ better UX
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

        return Ok(new { message = "Claim rejected successfully" });
    }
    // AdminClaimsController.cs - Add this method
    [HttpGet("all")]
    public async Task<IActionResult> GetAllClaims()
    {
        try
        {
            var allClaims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);
            var members = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);
            var memberDict = members.ToDictionary(m => m.MemberId, m => new { m.FullName, m.Email });

            Console.WriteLine($"Retrieved {allClaims.Count()} claims from database");

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
                // ✅ MEDICAL REPORT FIELDS - CRITICAL
                medicalReportFileName = c.MedicalReportFileName,
                medicalReportPath = c.MedicalReportPath,
                medicalReportSize = c.MedicalReportSize,
                medicalReportContentType = c.MedicalReportContentType,
                hasMedicalReport = !string.IsNullOrEmpty(c.MedicalReportPath),
                // ✅ PRE-AUTHORIZATION FIELDS
                isPreAuthorization = c.IsPreAuthorization,
                hospitalName = c.HospitalName,
                admissionDate = c.AdmissionDate,
                doctorName = c.DoctorName,
                diagnosis = c.Diagnosis,
                estimatedAmount = c.IsPreAuthorization ? c.ClaimAmount.Amount : (decimal?)null,
                // ✅ PAYMENT FIELDS
                paymentMode = c.PaymentMode,
                paymentReferenceNumber = c.PaymentReferenceNumber,
                treatmentType = c.TreatmentType,
                paymentDate = c.PaymentDate,
                // ✅ AUDIT FIELDS
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAllClaims: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

