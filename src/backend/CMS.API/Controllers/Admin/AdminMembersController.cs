using Microsoft.AspNetCore.Mvc;
using CMS.API.Attributes;
using CMS.Application.Interfaces.Repositories;

namespace CMS.API.Controllers.Admin;

[AuthorizeAdmin]
[ApiController]
[Route("api/admin/members")]
public class AdminMembersController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;

    public AdminMembersController(IMemberRepository memberRepository)
    {
        _memberRepository = memberRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllMembers()
    {
        var members = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);

        var result = members.Select(m => new
        {
            m.MemberId,
            m.FullName,
            m.Email,
            m.Role,
            m.DateOfBirth,
            m.ContactNumber,
            m.CreatedAt,
            ActivePlan = m.ActivePlan == null ? null : new
            {
                m.ActivePlan.PlanId,
                m.ActivePlan.Name,
                m.ActivePlan.InsuredAmount
            },
            ClaimsCount = m.Claims.Count
        });

        return Ok(result);
    }
}
