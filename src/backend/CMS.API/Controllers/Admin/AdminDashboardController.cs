using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Enums;
using CMS.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;
    private readonly IClaimRepository _claimRepository;
    private readonly IKycRepository _kycRepository;

    public AdminDashboardController(
        IMemberRepository memberRepository,
        IKycRepository kycRepository,
        IClaimRepository claimRepository)
    {
        _memberRepository = memberRepository;
        _claimRepository = claimRepository;
        _kycRepository = kycRepository;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var allMembers = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);
            var allClaims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);

            var stats = new
            {
                totalMembers = allMembers.Count(),
                // ✅ Include all pending-related statuses
                pendingClaims = allClaims.Count(c => c.Status == ClaimStatus.Pending
                                                  || c.Status == ClaimStatus.Submitted
                                                  || c.Status == ClaimStatus.PendingAI),
                approvedClaims = allClaims.Count(c => c.Status == ClaimStatus.Approved),
                rejectedClaims = allClaims.Count(c => c.Status == ClaimStatus.Rejected),
                totalClaims = allClaims.Count(),
                totalClaimAmount = allClaims.Sum(c => c.ClaimAmount.Amount)
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetStats: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("recent-documents")]
    public async Task<IActionResult> GetRecentDocuments()
    {
        try
        {
            var recentDocuments = new List<object>();

            // Get recent KYC documents
            var kycDocs = await _kycRepository.GetUnverifiedDocumentsAsync(HttpContext.RequestAborted);
            var recentKyc = kycDocs
                .OrderByDescending(k => k.UploadedAt)
                .Take(5)
                .Select(k => new
                {
                    id = k.DocumentId.ToString(),
                    type = "KYC Document",
                    title = $"{k.DocumentType} Document",
                    fileName = k.FileName,
                    filePath = k.FileUrl,
                    uploadedAt = k.UploadedAt,
                    memberName = k.Member?.FullName ?? "Unknown"
                });

            recentDocuments.AddRange(recentKyc);

            // Get recent Claim documents
            var allClaims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);
            var claimsWithDocs = allClaims
                .Where(c => !string.IsNullOrEmpty(c.MedicalReportPath))
                .OrderByDescending(c => c.CreatedAt)
                .Take(5)
                .Select(c => new
                {
                    id = c.ClaimId.ToString(),
                    type = "Claim Document",
                    title = $"Claim #{c.ClaimId.ToString().Substring(0, 8)}",
                    fileName = c.MedicalReportFileName,
                    filePath = c.MedicalReportPath,
                    uploadedAt = c.CreatedAt,
                    memberName = c.Member?.FullName ?? "Unknown"
                });

            recentDocuments.AddRange(claimsWithDocs);

            // Sort all by date and take top 10
            var result = recentDocuments
                .OrderByDescending(d => d.GetType().GetProperty("uploadedAt")?.GetValue(d))
                .Take(10)
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetRecentDocuments: {ex.Message}");
            return Ok(new List<object>()); // Return empty list on error
        }
    }
}
