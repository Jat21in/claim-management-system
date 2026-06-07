using CMS.Application.DTOs.Premium;
using CMS.Application.Interfaces.Services;
using CMS.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/v1/premium")]
public sealed class PremiumController : ControllerBase
{
    private readonly IPremiumCalculatorService _premiumCalculator;
    private readonly IPlanRepository _planRepository;

    public PremiumController(
        IPremiumCalculatorService premiumCalculator,
        IPlanRepository planRepository)
    {
        _premiumCalculator = premiumCalculator;
        _planRepository = planRepository;
    }

    /// <summary>
    /// Calculate premium with all rating factors (No authentication required - for plan comparison)
    /// </summary>
    [HttpPost("calculate")]
    [AllowAnonymous]
    public async Task<IActionResult> CalculatePremium([FromBody] CalculatePremiumRequest request)
    {
        var plan = await _planRepository.GetByIdAsync(request.PlanId, HttpContext.RequestAborted);
        if (plan == null)
            return NotFound(new { error = "Plan not found" });

        var result = await _premiumCalculator.CalculatePremiumAsync(plan, request, HttpContext.RequestAborted);
        return Ok(result);
    }

    /// <summary>
    /// Get premium breakdown for authenticated user's selected plan
    /// </summary>
    [HttpPost("my-plan")]
    [Authorize]
    public async Task<IActionResult> CalculateMyPlanPremium([FromBody] CalculatePremiumRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var plan = await _planRepository.GetByIdAsync(request.PlanId, HttpContext.RequestAborted);

        if (plan == null)
            return NotFound(new { error = "Plan not found" });

        var result = await _premiumCalculator.CalculatePremiumAsync(plan, request, HttpContext.RequestAborted);
        return Ok(result);
    }
}
