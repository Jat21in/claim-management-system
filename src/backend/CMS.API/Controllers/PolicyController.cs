using CMS.Application.DTOs.Policy;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CMS.Application.Interfaces.Repositories;

namespace CMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/policies")]
public sealed class PolicyController : ControllerBase
{
    private readonly IPolicyService _policyService;
    private readonly IPolicyRepository _policyRepository;
    private readonly IGracePeriodService _gracePeriodService;

    public PolicyController(
    IPolicyService policyService,
    IPolicyRepository policyRepository,
    IGracePeriodService gracePeriodService)
    {
        _policyService = policyService;
        _policyRepository = policyRepository;
        _gracePeriodService = gracePeriodService;
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
    // Add to existing PolicyController.cs

    /// <summary>
    /// Reinstate a lapsed policy
    /// </summary>
    [HttpPost("{policyId:guid}/reinstate")]
    public async Task<IActionResult> ReinstatePolicy(
    Guid policyId,
    [FromBody] ReinstatePolicyRequest request,
    CancellationToken cancellationToken)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var policy = await _policyRepository.GetByIdAsync(policyId, cancellationToken);
        if (policy == null)
            return NotFound(new { error = "Policy not found" });

        if (policy.MemberId != memberId)
            return Unauthorized(new { error = "Unauthorized" });

        if (policy.Status != PolicyStatus.Lapsed)
            return BadRequest(new { error = "Only lapsed policies can be reinstated" });

        var result = await _gracePeriodService.ReinstatePolicyAsync(policyId, request.WithMedicalUnderwriting, cancellationToken);

        return Ok(result);
    }

    public class ReinstatePolicyRequest
    {
        public bool WithMedicalUnderwriting { get; set; } = false;
        public string PaymentMethod { get; set; } = "CARD";
    }

}
