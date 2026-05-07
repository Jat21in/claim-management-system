using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/v1/public/plans")]
public sealed class PublicPlansController : ControllerBase
{
    private readonly IPlanService _planService;

    public PublicPlansController(IPlanService planService)
    {
        _planService = planService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _planService.GetPublicPlansAsync();
        return Ok(plans);
    }

    [HttpGet("{planId:guid}")]
    public async Task<IActionResult> GetPlan(Guid planId)
    {
        var plan = await _planService.GetPublicPlanByIdAsync(planId);
        return Ok(plan);
    }
}