using CMS.Application.DTOs.Plan;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/plans")]
public sealed class PlanController : ControllerBase
{
    private readonly IMemberService _memberService;

    public PlanController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpPut("update")]
    public async Task<IActionResult> UpdateMyPlan(UpdatePlanRequest request)
    {
        var memberId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _memberService.UpdateActivePlanAsync(
            memberId,
            request,
            HttpContext.RequestAborted);

        return Ok(new { message = "Plan updated successfully" });
    }
}