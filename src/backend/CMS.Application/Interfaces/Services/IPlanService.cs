using CMS.Application.DTOs.Plan;

namespace CMS.Application.Interfaces.Services;

public interface IPlanService
{
    Task<List<PublicPlanResponse>> GetPublicPlansAsync();

    Task<PublicPlanResponse?> GetPublicPlanByIdAsync(Guid planId);
}