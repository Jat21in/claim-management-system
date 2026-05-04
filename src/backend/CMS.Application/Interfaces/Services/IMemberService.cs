using CMS.Application.DTOs.Member;
using CMS.Application.DTOs.Plan;

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

    // ✅ ADD THIS
    Task UpdateActivePlanAsync(
        Guid memberId,
        UpdatePlanRequest request,
        CancellationToken cancellationToken);
}