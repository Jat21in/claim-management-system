using CMS.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/v1/verification")]
public class VerificationController : ControllerBase
{
    private readonly IDocumentVerificationService _verificationService;

    public VerificationController(IDocumentVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    [HttpPost("send-otp")]
    [Authorize]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _verificationService.GenerateOtpAsync(request.PhoneNumber, memberId, HttpContext.RequestAborted);
        return Ok(new { success = result });
    }

    [HttpPost("verify-otp")]
    [Authorize]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isValid = await _verificationService.VerifyOtpAsync(request.PhoneNumber, request.Otp, memberId, HttpContext.RequestAborted);
        return Ok(new { isValid });
    }
}

public class SendOtpRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}
