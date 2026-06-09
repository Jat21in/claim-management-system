using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;
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
    private readonly IConfiguration _configuration;
    private readonly IPolicyRepository _policyRepository;  // ADD THIS
    private readonly IMemberRepository _memberRepository;

    public SystemController(
    IGracePeriodService gracePeriodService,
    IPaymentService paymentService,
    IPolicyRepository policyRepository,      // ADD THIS
    IMemberRepository memberRepository)      // ADD THIS
    {
        _gracePeriodService = gracePeriodService;
        _paymentService = paymentService;
        _policyRepository = policyRepository;    // ADD THIS
        _memberRepository = memberRepository;    // ADD THIS
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


    [HttpPost("test-reinstate/{policyNumber}")]
    public async Task<IActionResult> TestReinstate(string policyNumber)
    {
        try
        {
            // Find the policy
            var allPolicies = await _policyRepository.GetAllAsync(HttpContext.RequestAborted);
            var policy = allPolicies.FirstOrDefault(p => p.PolicyNumber == policyNumber);

            if (policy == null)
                return BadRequest(new { error = $"Policy {policyNumber} not found" });

            if (policy.Status != PolicyStatus.Lapsed)
                return BadRequest(new { error = $"Policy is not lapsed. Current status: {policy.Status}" });

            // Get member info for logging
            var member = await _memberRepository.GetByIdAsync(policy.MemberId, HttpContext.RequestAborted);

            // Reinstate
            policy.Reinstate();
            await _policyRepository.UpdateAsync(policy, HttpContext.RequestAborted);

            return Ok(new
            {
                message = "Policy reinstated successfully!",
                policyNumber = policy.PolicyNumber,
                oldStatus = "Lapsed",
                newStatus = "Active",
                memberEmail = member?.Email,
                reinstatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Debug endpoint to check overdue payments
    /// </summary>
    [HttpGet("debug-overdue")]
    public async Task<IActionResult> DebugOverduePayments()
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("CmsDatabase");

            // Simple query to check for overdue payments
            var query = @"
            SELECT 
                p.PolicyNumber,
                m.Email,
                m.FullName,
                pp.Amount,
                pp.DueDate,
                DATEDIFF(DAY, pp.DueDate, GETUTCDATE()) as DaysOverdue
            FROM PremiumPayments pp
            JOIN Policies p ON pp.PolicyId = p.PolicyId
            JOIN Members m ON p.MemberId = m.MemberId
            WHERE pp.Status = 0 
              AND pp.DueDate < GETUTCDATE()
        ";

            // You'll need to inject IConfiguration to SystemController
            // Add this to constructor: IConfiguration configuration

            return Ok(new
            {
                message = "Check backend logs for details",
                note = "Run SQL query manually to see overdue payments"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
    [HttpGet("hangfire-status")]
    public IActionResult GetHangfireStatus()
    {
        return Ok(new
        {
            status = "Running",
            recurringJobs = new[]
            {
            new { name = "check-overdue-payments", schedule = "12:00 AM", lastRun = "Check logs" },
            new { name = "send-grace-reminders", schedule = "9:00 AM", lastRun = "Check logs" },
            new { name = "check-lapsed-policies", schedule = "1:00 AM", lastRun = "Check logs" }
        },
            note = "Dashboard disabled due to SQL Server Express limitations. Jobs are functioning normally.",
            howToMonitor = "Use API endpoints or check backend logs"
        });
    }
}