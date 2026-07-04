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

    private Guid GetMemberId()
    {
        return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    [HttpGet("me")]
    public async Task<ActionResult<MemberDashboardResponse>> GetMyDetails()
    {
        var memberId = GetMemberId();
        var result = await _memberService.GetMyDashboardAsync(memberId, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpGet("profile")]
    public async Task<ActionResult<ProfileResponse>> GetProfile()
    {
        var memberId = GetMemberId();
        var result = await _memberService.GetProfileAsync(memberId, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateMemberProfileRequest request)
    {
        var memberId = GetMemberId();
        await _memberService.UpdateProfileAsync(memberId, request, HttpContext.RequestAborted);
        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpPost("profile-photo")]
    public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile file)
    {
        var memberId = GetMemberId();

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "File is required" });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { error = "File size cannot exceed 5MB" });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { error = "Invalid file format. Allowed: JPG, PNG, GIF, WEBP" });

        using var stream = file.OpenReadStream();
        var photoUrl = await _memberService.UploadProfilePhotoAsync(
            memberId,
            stream,
            file.FileName,
            HttpContext.RequestAborted);

        return Ok(new
        {
            photoUrl,
            message = "Profile photo updated successfully"
        });
    }

    [HttpDelete("profile-photo")]
    public async Task<IActionResult> RemoveProfilePhoto()
    {
        var memberId = GetMemberId();
        await _memberService.RemoveProfilePhotoAsync(memberId, HttpContext.RequestAborted);
        return Ok(new { message = "Profile photo removed successfully" });
    }
}