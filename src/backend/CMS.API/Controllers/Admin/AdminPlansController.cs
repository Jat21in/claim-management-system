using CMS.API.Attributes;
using CMS.Application.DTOs.Plan;
using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/plans")]
public sealed class AdminPlansController : ControllerBase
{
    private readonly IPlanRepository _planRepository;

    public AdminPlansController(IPlanRepository planRepository)
    {
        _planRepository = planRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPlans()
    {
        var plans = await _planRepository.GetActivePlansAsync(HttpContext.RequestAborted);
        var result = plans.Select(p => new
        {
            p.PlanId,
            p.Code,
            p.Name,
            p.Description,
            p.InsuredAmount,
            p.DurationInMonths,
            Features = JsonSerializer.Deserialize<string[]>(p.FeaturesJson) ?? Array.Empty<string>(),
            p.IsFeatured,
            p.IsActive,
            p.StartDate,
            p.EndDate,
            p.BasePremiumAnnual,
            p.DependentLoadingPercentage,
            p.MaxDependentsAllowed,
            p.MaxNomineesAllowed,
            RequiredKycDocuments = JsonSerializer.Deserialize<string[]>(p.RequiredKycDocumentsJson) ?? Array.Empty<string>(),
            p.AgeLoadingPercentage,
            p.CorporateDiscountPercentage,
            p.IsFamilyFloater,
            p.LocationRiskMultiplier,
            p.PreExistingConditionLoading,
            p.SmokerLoadingPercentage
        });
        return Ok(result);
    }

    [HttpGet("{planId:guid}")]
    public async Task<IActionResult> GetPlanById(Guid planId)
    {
        var plan = await _planRepository.GetByIdAsync(planId, HttpContext.RequestAborted);
        if (plan == null)
            return NotFound(new { error = "Plan not found" });

        return Ok(new
        {
            plan.PlanId,
            plan.Code,
            plan.Name,
            plan.Description,
            plan.InsuredAmount,
            plan.DurationInMonths,
            Features = JsonSerializer.Deserialize<string[]>(plan.FeaturesJson) ?? Array.Empty<string>(),
            plan.IsFeatured,
            plan.IsActive,
            plan.StartDate,
            plan.EndDate,
            plan.BasePremiumAnnual,
            plan.DependentLoadingPercentage,
            plan.MaxDependentsAllowed,
            plan.MaxNomineesAllowed,
            RequiredKycDocuments = JsonSerializer.Deserialize<string[]>(plan.RequiredKycDocumentsJson) ?? Array.Empty<string>(),
            plan.AgeLoadingPercentage,
            plan.CorporateDiscountPercentage,
            plan.IsFamilyFloater,
            plan.LocationRiskMultiplier,
            plan.PreExistingConditionLoading,
            plan.SmokerLoadingPercentage
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanAdminRequest request)
    {
        var plan = new Plan(
            code: request.Code,
            name: request.Name,
            description: request.Description,
            insuredAmount: request.InsuredAmount,
            durationInMonths: request.DurationInMonths,
            featuresJson: JsonSerializer.Serialize(request.Features),
            isFeatured: request.IsFeatured,
            basePremiumAnnual: request.BasePremiumAnnual,
            dependentLoadingPercentage: request.DependentLoadingPercentage,
            maxDependentsAllowed: request.MaxDependentsAllowed,
            maxNomineesAllowed: request.MaxNomineesAllowed,
            requiredKycDocumentsJson: JsonSerializer.Serialize(request.RequiredKycDocuments));

        await _planRepository.AddAsync(plan, HttpContext.RequestAborted);

        return Ok(new { message = "Plan created successfully", planId = plan.PlanId });
    }

    [HttpPut("{planId:guid}")]
    public async Task<IActionResult> UpdatePlan(Guid planId, [FromBody] UpdatePlanAdminRequest request)
    {
        var plan = await _planRepository.GetByIdAsync(planId, HttpContext.RequestAborted);
        if (plan == null)
            return NotFound(new { error = "Plan not found" });

        plan.UpdateDetails(
            name: request.Name,
            description: request.Description,
            insuredAmount: request.InsuredAmount,
            durationInMonths: request.DurationInMonths,
            featuresJson: JsonSerializer.Serialize(request.Features),
            isFeatured: request.IsFeatured,
            basePremiumAnnual: request.BasePremiumAnnual,
            dependentLoadingPercentage: request.DependentLoadingPercentage,
            maxDependentsAllowed: request.MaxDependentsAllowed,
            maxNomineesAllowed: request.MaxNomineesAllowed,
            requiredKycDocuments: request.RequiredKycDocuments,
            ageLoadingPercentage: request.AgeLoadingPercentage,
            corporateDiscountPercentage: request.CorporateDiscountPercentage,
            isFamilyFloater: request.IsFamilyFloater,
            locationRiskMultiplier: request.LocationRiskMultiplier,
            preExistingConditionLoading: request.PreExistingConditionLoading,
            smokerLoadingPercentage: request.SmokerLoadingPercentage);

        await _planRepository.UpdateAsync(plan, HttpContext.RequestAborted);

        return Ok(new { message = "Plan updated successfully" });
    }

    [HttpDelete("{planId:guid}")]
    public async Task<IActionResult> DeletePlan(Guid planId)
    {
        var plan = await _planRepository.GetByIdAsync(planId, HttpContext.RequestAborted);
        if (plan == null)
            return NotFound(new { error = "Plan not found" });

        plan.Deactivate();
        await _planRepository.UpdateAsync(plan, HttpContext.RequestAborted);

        return Ok(new { message = "Plan deactivated successfully" });
    }
}

public class CreatePlanAdminRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal InsuredAmount { get; set; }
    public int DurationInMonths { get; set; }
    public string[] Features { get; set; } = Array.Empty<string>();
    public bool IsFeatured { get; set; }
    public decimal BasePremiumAnnual { get; set; }
    public decimal DependentLoadingPercentage { get; set; }
    public int MaxDependentsAllowed { get; set; }
    public int MaxNomineesAllowed { get; set; }
    public string[] RequiredKycDocuments { get; set; } = Array.Empty<string>();
}

public class UpdatePlanAdminRequest : CreatePlanAdminRequest
{
    public decimal AgeLoadingPercentage { get; set; }
    public decimal CorporateDiscountPercentage { get; set; }
    public bool IsFamilyFloater { get; set; }
    public decimal LocationRiskMultiplier { get; set; }
    public decimal PreExistingConditionLoading { get; set; }
    public decimal SmokerLoadingPercentage { get; set; }
}