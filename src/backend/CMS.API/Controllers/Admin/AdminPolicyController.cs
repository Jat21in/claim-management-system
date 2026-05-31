using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/policies")]
public sealed class AdminPolicyController : ControllerBase
{
    private readonly IPolicyRepository _policyRepository;

    public AdminPolicyController(IPolicyRepository policyRepository)
    {
        _policyRepository = policyRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPolicies()
    {
        var policies = await _policyRepository.GetAllAsync(HttpContext.RequestAborted);

        var result = policies.Select(p => new
        {
            p.PolicyId,
            p.PolicyNumber,
            p.Status,
            p.StartDate,
            p.EndDate,
            p.MonthlyPremium,
            p.SumInsured,
            p.UtilizedAmount,
            MemberName = p.Member?.FullName,
            MemberEmail = p.Member?.Email,
            PlanName = p.Plan?.Name,
            DependentsCount = p.Dependents.Count,
            NomineesCount = p.Nominees.Count,
            PaymentsCount = p.Payments.Count
        });

        return Ok(result);
    }

    [HttpGet("{policyId:guid}")]
    public async Task<IActionResult> GetPolicyDetails(Guid policyId)
    {
        var policy = await _policyRepository.GetByIdAsync(policyId, HttpContext.RequestAborted);
        if (policy == null)
            return NotFound();

        return Ok(new
        {
            policy.PolicyId,
            policy.PolicyNumber,
            policy.Status,
            policy.StartDate,
            policy.EndDate,
            policy.MonthlyPremium,
            policy.AnnualPremium,
            policy.SumInsured,
            policy.UtilizedAmount,
            Member = new
            {
                policy.Member?.MemberId,
                policy.Member?.FullName,
                policy.Member?.Email,
                policy.Member?.ContactNumber
            },
            Plan = new
            {
                policy.Plan?.PlanId,
                policy.Plan?.Name,
                policy.Plan?.Description
            },
            Dependents = policy.Dependents.Select(d => new
            {
                d.DependentId,
                d.FullName,
                d.Relationship,
                d.DateOfBirth,
                d.IsActive
            }),
            Nominees = policy.Nominees.Select(n => new
            {
                n.NomineeId,
                n.FullName,
                n.Relationship,
                n.PercentageAllocation,
                n.GuardianName,
                n.IsPrimary
            }),
            Payments = policy.Payments.Select(p => new
            {
                p.PaymentId,
                p.Amount,
                p.PaymentDate,
                p.DueDate,
                p.Status,
                p.PaymentMethod,
                p.TransactionId
            })
        });
    }
}
