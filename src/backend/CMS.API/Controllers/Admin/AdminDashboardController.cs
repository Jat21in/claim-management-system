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
        var allMembers = await _memberRepository.GetAllAsync(CancellationToken.None);
        var allClaims = await _claimRepository.GetAllAsync(CancellationToken.None);

        var stats = new
        {
            TotalMembers = allMembers.Count(),
            PendingClaims = allClaims.Count(c => c.Status == ClaimStatus.Submitted),
            ApprovedClaims = allClaims.Count(c => c.Status == ClaimStatus.Approved),
            RejectedClaims = allClaims.Count(c => c.Status == ClaimStatus.Rejected)
        };

        return Ok(stats);
    }
}