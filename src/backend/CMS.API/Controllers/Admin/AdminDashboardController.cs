using Microsoft.AspNetCore.Mvc;
using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Enums;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;
    private readonly IClaimRepository _claimRepository;

    public AdminDashboardController(
        IMemberRepository memberRepository,
        IClaimRepository claimRepository)
    {
        _memberRepository = memberRepository;
        _claimRepository = claimRepository;
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
}
