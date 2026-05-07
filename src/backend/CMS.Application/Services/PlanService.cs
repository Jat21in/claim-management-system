using CMS.Application.DTOs.Plan;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using System.Text.Json;

namespace CMS.Application.Services;

public sealed class PlanService : IPlanService
{
    private readonly IPlanRepository _planRepository;

    public PlanService(IPlanRepository planRepository)
    {
        _planRepository = planRepository;
    }

    public async Task<List<PublicPlanResponse>> GetPublicPlansAsync()
    {
        var plans = await _planRepository.GetActivePlansAsync(CancellationToken.None);

        return plans.Select(p => new PublicPlanResponse
        {
            PlanId = p.PlanId,
            Name = p.Name,
            Description = p.Description,
            InsuredAmount = p.InsuredAmount,
            DurationInMonths = p.DurationInMonths,
            Features = JsonSerializer.Deserialize<string[]>(p.FeaturesJson)
                       ?? Array.Empty<string>(),
            IsFeatured = p.IsFeatured
        }).ToList();
    }

    public async Task<PublicPlanResponse?> GetPublicPlanByIdAsync(Guid planId)
    {
        var p = await _planRepository.GetByIdAsync(planId, CancellationToken.None);

        if (p is null || !p.IsActive)
            return null;

        return new PublicPlanResponse
        {
            PlanId = p.PlanId,
            Name = p.Name,
            Description = p.Description,
            InsuredAmount = p.InsuredAmount,
            DurationInMonths = p.DurationInMonths,
            Features = JsonSerializer.Deserialize<string[]>(p.FeaturesJson)
                       ?? Array.Empty<string>(),
            IsFeatured = p.IsFeatured
        };
    }
}