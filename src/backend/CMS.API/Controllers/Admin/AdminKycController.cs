using CMS.API.Attributes;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/kyc")]
public sealed class AdminKycController : ControllerBase
{
    private readonly IKycService _kycService;

    public AdminKycController(IKycService kycService)
    {
        _kycService = kycService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingKycRequests()
    {
        var pending = await _kycService.GetPendingKycRequestsAsync(HttpContext.RequestAborted);
        return Ok(pending);
    }

    [HttpPost("{memberId:guid}/approve")]
    public async Task<IActionResult> ApproveKyc(Guid memberId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

        await _kycService.ApproveKycAsync(adminId, memberId, HttpContext.RequestAborted);

        return Ok(new { message = "KYC approved successfully" });
    }

    [HttpPost("{memberId:guid}/reject")]
    public async Task<IActionResult> RejectKyc(Guid memberId, [FromBody] RejectionRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

        await _kycService.RejectKycAsync(adminId, memberId, request.Reason, HttpContext.RequestAborted);

        return Ok(new { message = "KYC rejected" });
    }
}

public class RejectionRequest
{
    public string Reason { get; set; } = string.Empty;
}
