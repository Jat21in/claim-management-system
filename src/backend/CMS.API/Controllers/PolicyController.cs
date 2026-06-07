using CMS.Application.DTOs.Policy;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/policies")]
public sealed class PolicyController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public PolicyController(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    [HttpPost("create-from-plan/{planId:guid}")]
    public async Task<IActionResult> CreatePolicyFromPlan(Guid planId)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var policy = await _policyService.CreatePolicyFromPlanAsync(memberId, planId, HttpContext.RequestAborted);

        return Ok(new { message = "Policy created successfully", policy });
    }

    [HttpGet("my-policy")]
    public async Task<IActionResult> GetMyPolicy()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var policy = await _policyService.GetMemberPolicyAsync(memberId, HttpContext.RequestAborted);

        return Ok(policy);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetPolicySummary()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var summary = await _policyService.GetPolicySummaryAsync(memberId, HttpContext.RequestAborted);

        return Ok(summary);
    }

    [HttpPost("dependents")]
    public async Task<IActionResult> AddDependent([FromBody] AddDependentRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _policyService.AddDependentAsync(memberId, request, HttpContext.RequestAborted);

        return Ok(new { message = "Dependent added successfully" });
    }

    [HttpGet("dependents")]
    public async Task<IActionResult> GetDependents()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var dependents = await _policyService.GetDependentsAsync(memberId, HttpContext.RequestAborted);

        return Ok(dependents);
    }

    [HttpPost("nominees")]
    public async Task<IActionResult> AddNominee([FromBody] AddNomineeRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _policyService.AddNomineeAsync(memberId, request, HttpContext.RequestAborted);

        return Ok(new { message = "Nominee added successfully" });
    }

    [HttpGet("nominees")]
    public async Task<IActionResult> GetNominees()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var nominees = await _policyService.GetNomineesAsync(memberId, HttpContext.RequestAborted);

        return Ok(nominees);
    }

    [HttpPost("setup-with-payment")]
    public async Task<IActionResult> SetupPolicyWithPayment([FromBody] PolicySetupRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await _policyService.SetupPolicyWithPaymentAsync(
            memberId,
            request,
            HttpContext.RequestAborted);

        return Ok(result);
    }
}
