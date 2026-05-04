using CMS.Application.DTOs.Plan;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services;

public sealed class PlanService : IPlanService
{
    private readonly IPlanRepository _planRepository;

    public PlanService(IPlanRepository planRepository)
    {
        _planRepository = planRepository;
    }

    public async Task<Guid> CreatePlanAsync(
        CreatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var plan = new Plan(
            request.StartDate,
            request.EndDate,
            new Money(request.InsuredAmount));

        await _planRepository.AddAsync(plan, cancellationToken);
        return plan.PlanId;
    }

    public async Task<PlanResponse> GetPlanByIdAsync(
        Guid planId,
        CancellationToken cancellationToken)
    {
        var plan = await _planRepository.GetByIdAsync(planId, cancellationToken)
            ?? throw new InvalidOperationException("Plan not found.");

        return new PlanResponse
        {
            PlanId = plan.PlanId,
            StartDate = plan.StartDate,
            EndDate = plan.EndDate,
            InsuredAmount = plan.InsuredAmount.Amount
        };
    }

    
}