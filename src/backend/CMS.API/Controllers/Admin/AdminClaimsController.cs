using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CMS.API.Attributes;
using CMS.Domain.Enums;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/claims")]
public class AdminClaimsController : ControllerBase
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
        var allClaims = await _claimRepository.GetAllAsync(HttpContext.RequestAborted);
        var pending = allClaims.Where(c => c.Status == ClaimStatus.Submitted);

        var result = new List<object>();

        foreach (var claim in pending)
        {
            string memberName = "Unknown";

            // Try to get member name from navigation property
            if (claim.Member != null)
            {
                memberName = claim.Member.FullName;
            }
            else
            {
                // Fallback: fetch member directly from repository
                var member = await _memberRepository.GetByIdAsync(claim.MemberId, HttpContext.RequestAborted);
                memberName = member?.FullName ?? "Unknown";
            }

            result.Add(new
            {
                claimId = claim.ClaimId,
                amount = claim.ClaimAmount.Amount,
                claimDate = claim.ClaimDate,
                status = claim.Status.ToString(),
                description = claim.Description ?? "No description",
                memberName = memberName,
                memberId = claim.MemberId
            });
        }

        return Ok(result);
    }


    [HttpPost("{claimId}/approve")]
    public async Task<IActionResult> ApproveClaim(Guid claimId, [FromBody] ApprovalRequest request)
    {
        var claim = await _claimRepository.GetByIdAsync(claimId, CancellationToken.None);
        if (claim == null) return NotFound();

        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        claim.Approve(adminId, request.Comments);

        await _claimRepository.UpdateAsync(claim, CancellationToken.None);

        return Ok(new { message = "Claim approved" });
    }

    [HttpPost("{claimId}/reject")]
    public async Task<IActionResult> RejectClaim(Guid claimId, [FromBody] RejectionRequest request)
    {
        var claim = await _claimRepository.GetByIdAsync(claimId, CancellationToken.None);
        if (claim == null) return NotFound();

        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        claim.Reject(adminId, request.Reason);

        await _claimRepository.UpdateAsync(claim, CancellationToken.None);

        return Ok(new { message = "Claim rejected" });
    }
}

public class ApprovalRequest
{
    public string Comments { get; set; } = "";
}

public class RejectionRequest
{
    public string Reason { get; set; } = "";
}