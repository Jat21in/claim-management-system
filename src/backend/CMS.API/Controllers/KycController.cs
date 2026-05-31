using CMS.Application.DTOs.KYC;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/kyc")]
public sealed class KycController : ControllerBase
{
    private readonly IKycService _kycService;

    public KycController(IKycService kycService)
    {
        _kycService = kycService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadKycDocument([FromForm] SubmitKycRequest request, IFormFile file)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "File is required" });

        if (file.Length > 5 * 1024 * 1024) // 5MB limit
            return BadRequest(new { error = "File size cannot exceed 5MB" });

        using var stream = file.OpenReadStream();

        await _kycService.SubmitKycDocumentsAsync(memberId, request, stream, file.FileName, HttpContext.RequestAborted);

        return Ok(new { message = "KYC documents submitted successfully" });
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetKycStatus()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var status = await _kycService.GetKycStatusAsync(memberId, HttpContext.RequestAborted);

        return Ok(status);
    }
}
