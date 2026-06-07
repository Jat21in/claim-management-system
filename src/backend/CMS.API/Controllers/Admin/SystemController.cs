using CMS.API.Attributes;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/system")]
public class SystemController : ControllerBase
{
    private readonly IGracePeriodService _gracePeriodService;
    private readonly IPaymentService _paymentService;

    public SystemController(
        IGracePeriodService gracePeriodService,
        IPaymentService paymentService)
    {
        _gracePeriodService = gracePeriodService;
        _paymentService = paymentService;
    }

    /// <summary>
    /// Manually trigger overdue payment check (for testing)
    /// </summary>
    [HttpPost("check-overdue-payments")]
    public async Task<IActionResult> CheckOverduePayments()
    {
        await _gracePeriodService.CheckAndUpdateOverduePaymentsAsync(HttpContext.RequestAborted);

        return Ok(new
        {
            message = "Overdue payment check completed",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Manually trigger grace period reminders (for testing)
    /// </summary>
    [HttpPost("send-grace-reminders")]
    public async Task<IActionResult> SendGraceReminders()
    {
        await _gracePeriodService.SendGracePeriodRemindersAsync(HttpContext.RequestAborted);

        return Ok(new
        {
            message = "Grace period reminders sent",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Manually trigger policy lapse check (for testing)
    /// </summary>
    [HttpPost("check-lapsed-policies")]
    public async Task<IActionResult> CheckLapsedPolicies()
    {
        await _paymentService.CheckOverduePaymentsAndLapsePoliciesAsync(HttpContext.RequestAborted);

        return Ok(new
        {
            message = "Lapsed policy check completed",
            timestamp = DateTime.UtcNow
        });
    }
}
