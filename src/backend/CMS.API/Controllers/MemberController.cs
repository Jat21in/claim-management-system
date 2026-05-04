using CMS.Application.DTOs.Member;
using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        UpdateMemberProfileRequest request)
    {
        var memberId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _memberService.UpdateProfileAsync(
            memberId,
            request,
            HttpContext.RequestAborted);

        return Ok(new { message = "Profile updated successfully" });
    }
}