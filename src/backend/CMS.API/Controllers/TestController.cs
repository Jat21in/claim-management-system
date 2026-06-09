using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/test")]
public class TestController : ControllerBase
{
    private readonly IEmailService _emailService;

    public TestController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    // ✅ FIXED: Use a method that ALWAYS sends email
    [HttpPost("send-test-email")]
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
    {
        try
        {
            // Use SendOtpEmailAsync - it has NO conditions, always sends!
            await _emailService.SendOtpEmailAsync(
                request.Email,
                request.FullName,
                "123456",  // Dummy OTP
                HttpContext.RequestAborted);

            return Ok(new { message = "Test email sent successfully! Check your inbox (and spam folder)" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }
}

public class TestEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}