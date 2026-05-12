using CMS.Application.DTOs.Member;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/members")]
public sealed class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;

    public MembersController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    ///  Dashboard endpoint
    /// Used by: Dashboard, Profile (read), Claims eligibility

    [HttpGet("me")]
    public async Task<ActionResult<MemberDashboardResponse>> GetMyDetails()
    {
        var memberId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await _memberService.GetMyDashboardAsync(
            memberId,
            HttpContext.RequestAborted);

        return Ok(result);
    }

    ///  Update member profile
    /// Used by: Profile page (address, contact, DOB later)
    
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateMemberProfileRequest request)
    {
        var memberId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _memberService.UpdateProfileAsync(
            memberId,
            request,
            HttpContext.RequestAborted);

        return Ok(new
        {
            message = "Profile updated successfully"
        });
    }
}