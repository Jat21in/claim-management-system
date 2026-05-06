using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
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

    public ClaimsController(
        IClaimService claimService,
        IClaimRepository claimRepository)
    {
        _claimService = claimService;
        _claimRepository = claimRepository;
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
            Status = c.Status.ToString()
        }));
    }

    [HttpPost]
    public async Task<IActionResult> SubmitClaim(
SubmitClaimRequest request,
CancellationToken cancellationToken)
    {
        var memberId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var claimId = await _claimService.SubmitClaimAsync(
            memberId,
            request,
            cancellationToken);
        return Ok(new { claimId });
    }

}