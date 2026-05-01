using CMS.Application.DTOs.Member;

namespace CMS.Application.Interfaces.Services;

public interface IMemberService
{
    Task<Guid> RegisterMemberAsync(
        RegisterMemberRequest request,
        CancellationToken cancellationToken);

    Task AssignPlanAsync(
        Guid memberId,
        AssignPlanRequest request,
        CancellationToken cancellationToken);
}