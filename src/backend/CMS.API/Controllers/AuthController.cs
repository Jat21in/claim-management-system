using CMS.Application.DTOs.Auth;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        await _authService.RegisterAsync(request, HttpContext.RequestAborted);
        return Ok(new { message = "Registration successful. Please verify your email." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request, HttpContext.RequestAborted);
        return Ok(result);
    }

    // ✅ NEW: Forgot Password - Request OTP
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request, HttpContext.RequestAborted);
        return Ok(new { message = "If an account exists, an OTP has been sent to your email." });
    }

    // ✅ NEW: Verify Reset Token
    [HttpPost("verify-reset-token")]
    public async Task<IActionResult> VerifyResetToken([FromBody] VerifyResetTokenRequest request)
    {
        var isValid = await _authService.VerifyResetTokenAsync(request, HttpContext.RequestAborted);
        return Ok(new { isValid });
    }

    // ✅ NEW: Reset Password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        await _authService.ResetPasswordAsync(request, HttpContext.RequestAborted);
        return Ok(new { message = "Password reset successfully. Please login with your new password." });
    }
}