using CMS.Application.DTOs.Plan;

namespace CMS.Application.Interfaces.Services;

public interface IPlanService
{
    Task<Guid> CreatePlanAsync(
        CreatePlanRequest request,
        CancellationToken cancellationToken);

    Task<PlanResponse> GetPlanByIdAsync(
        Guid planId,
        CancellationToken cancellationToken);
}
