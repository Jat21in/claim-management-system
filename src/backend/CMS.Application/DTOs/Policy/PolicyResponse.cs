using CMS.Domain.Enums;

namespace CMS.Application.DTOs.Policy;

public sealed class PolicyResponse
{
    public Guid PolicyId { get; init; }
    public string PolicyNumber { get; init; } = null!;
    public PolicyStatus Status { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public decimal MonthlyPremium { get; init; }
    public decimal SumInsured { get; init; }
    public decimal UtilizedAmount { get; init; }
    public decimal RemainingAmount { get; init; }
    public string PlanName { get; init; } = null!;
    public List<DependentResponse> Dependents { get; init; } = new();
    public List<NomineeResponse> Nominees { get; init; } = new();
}