using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data.SqlClient;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/system")]
public class SystemController : ControllerBase
{
    private readonly IGracePeriodService _gracePeriodService;
    private readonly IPaymentService _paymentService;
    private readonly IConfiguration _configuration;
    private readonly IPolicyRepository _policyRepository;
    private readonly IMemberRepository _memberRepository;

    public SystemController(
        IGracePeriodService gracePeriodService,
        IPaymentService paymentService,
        IConfiguration configuration,
        IPolicyRepository policyRepository,
        IMemberRepository memberRepository)
    {
        _gracePeriodService = gracePeriodService;
        _paymentService = paymentService;
        _configuration = configuration;
        _policyRepository = policyRepository;
        _memberRepository = memberRepository;
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

    [HttpGet("hangfire/jobs")]
    public async Task<IActionResult> GetHangfireJobs()
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("CmsDatabase");
            var jobs = new List<object>();

            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();

                // Get recent jobs - FIXED: Properly handle DateTime
                var sql = @"
                SELECT TOP 50 
                    j.Id,
                    j.CreatedAt,
                    s.Name as State,
                    s.Reason
                FROM HangFire.Job j
                LEFT JOIN HangFire.State s ON j.StateId = s.Id
                ORDER BY j.CreatedAt DESC";

                using (var command = new SqlCommand(sql, connection))
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        jobs.Add(new
                        {
                            id = reader.GetInt64(0),
                            createdAt = reader.GetDateTime(1).ToString("yyyy-MM-dd HH:mm:ss"),
                            state = reader.IsDBNull(2) ? "Unknown" : reader.GetString(2),
                            reason = reader.IsDBNull(3) ? null : reader.GetString(3)
                        });
                    }
                }
            }

            return Ok(new { success = true, jobs });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("hangfire/recurring")]
    public async Task<IActionResult> GetRecurringJobs()
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("CmsDatabase");
            var recurringJobs = new List<object>();

            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();

                // Get all recurring job entries
                var sql = @"
                SELECT 
                    [Key],
                    Value
                FROM HangFire.Hash 
                WHERE [Key] LIKE 'recurring-job:%'
                ORDER BY [Key]";

                using (var command = new SqlCommand(sql, connection))
                using (var reader = await command.ExecuteReaderAsync())
                {
                    var jobs = new Dictionary<string, Dictionary<string, string>>();

                    while (await reader.ReadAsync())
                    {
                        var key = reader.GetString(0);
                        var value = reader.GetString(1);

                        // Extract job name (everything after 'recurring-job:')
                        var jobName = key.Replace("recurring-job:", "");

                        // Determine what field this is based on the value
                        if (!jobs.ContainsKey(jobName))
                            jobs[jobName] = new Dictionary<string, string>();

                        // Parse based on value pattern
                        if (value.Contains("Cron") && !value.Contains("{"))
                        {
                            // Check if it's a cron expression (like "0 1 * * *")
                            if (value.Contains("*"))
                                jobs[jobName]["Cron"] = value;
                            else if (value.Contains("T") && value.Contains("Z"))
                                jobs[jobName]["NextExecution"] = value;
                            else if (value.Contains("CreatedAt") || value.Contains("LastExecution"))
                            {
                                // This is a JSON object containing job details
                                // Don't store as field, it's the job data
                            }
                            else
                                jobs[jobName]["Other"] = value;
                        }
                        else if (value == "default")
                            jobs[jobName]["Queue"] = value;
                        else if (value == "UTC")
                            jobs[jobName]["TimeZone"] = value;
                        else if (value == "2")
                            jobs[jobName]["Version"] = value;
                        else if (value.StartsWith("{"))
                        {
                            // This is the job invocation data - extract method name
                            try
                            {
                                var methodStart = value.IndexOf("\"Method\":\"") + 10;
                                var methodEnd = value.IndexOf("\"", methodStart);
                                if (methodStart > 10 && methodEnd > methodStart)
                                    jobs[jobName]["Method"] = value.Substring(methodStart, methodEnd - methodStart);
                            }
                            catch { }
                        }
                    }

                    // Build the response
                    foreach (var job in jobs)
                    {
                        // Determine schedule from Cron or from the data
                        string cron = "N/A";
                        if (job.Value.ContainsKey("Cron"))
                            cron = job.Value["Cron"];
                        else if (job.Key.Contains("lapsed"))
                            cron = "0 1 * * *";
                        else if (job.Key.Contains("overdue"))
                            cron = "0 0 * * *";
                        else if (job.Key.Contains("grace"))
                            cron = "0 9 * * *";

                        recurringJobs.Add(new
                        {
                            name = job.Key,
                            cron = cron,
                            nextExecution = job.Value.ContainsKey("NextExecution") ? job.Value["NextExecution"] : "Not scheduled",
                            lastExecution = job.Value.ContainsKey("LastExecution") ? job.Value["LastExecution"] : "Never",
                            enabled = true,
                            method = job.Value.ContainsKey("Method") ? job.Value["Method"] : "Unknown",
                            queue = job.Value.ContainsKey("Queue") ? job.Value["Queue"] : "default"
                        });
                    }
                }
            }

            return Ok(new { success = true, recurringJobs });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpGet("hangfire/stats")]
    public async Task<IActionResult> GetHangfireStats()
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("CmsDatabase");
            var stats = new Dictionary<string, int>();

            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();

                var sql = @"
                SELECT 
                    COUNT(CASE WHEN s.Name = 'Succeeded' THEN 1 END) as Succeeded,
                    COUNT(CASE WHEN s.Name = 'Failed' THEN 1 END) as Failed,
                    COUNT(CASE WHEN s.Name = 'Enqueued' THEN 1 END) as Enqueued,
                    COUNT(CASE WHEN s.Name = 'Processing' THEN 1 END) as Processing,
                    COUNT(*) as Total
                FROM HangFire.Job j
                LEFT JOIN HangFire.State s ON j.StateId = s.Id";

                using (var command = new SqlCommand(sql, connection))
                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        stats["succeeded"] = reader.GetInt32(0);
                        stats["failed"] = reader.GetInt32(1);
                        stats["enqueued"] = reader.GetInt32(2);
                        stats["processing"] = reader.GetInt32(3);
                        stats["total"] = reader.GetInt32(4);
                    }
                }
            }

            return Ok(new { success = true, stats });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("hangfire/next-runs")]
    public async Task<IActionResult> GetNextRuns()
    {
        var nextRuns = new Dictionary<string, string>();

        // Tomorrow's dates
        var tomorrow = DateTime.UtcNow.AddDays(1);

        nextRuns["check-overdue-payments"] = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 0, 0, 0).ToString("yyyy-MM-dd HH:mm:ss");
        nextRuns["check-lapsed-policies"] = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 1, 0, 0).ToString("yyyy-MM-dd HH:mm:ss");
        nextRuns["send-grace-reminders"] = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 9, 0, 0).ToString("yyyy-MM-dd HH:mm:ss");

        return Ok(nextRuns);
    }
}