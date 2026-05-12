using CMS.Application.DTOs.Member;
using CMS.Application.DTOs.Plan;

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

    Task UpdateProfileAsync(
        Guid memberId,
        UpdateMemberProfileRequest request,
        CancellationToken cancellationToken);

    Task UpdateActivePlanAsync(
        Guid memberId,
        UpdatePlanRequest request,
        CancellationToken cancellationToken);

    Task<MemberDashboardResponse> GetMyDashboardAsync(
        Guid memberId,
        CancellationToken cancellationToken);
}