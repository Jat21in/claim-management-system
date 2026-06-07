namespace CMS.Application.DTOs.Policy;

public sealed class PolicySummaryResponse
{
    public bool HasActivePolicy { get; init; }
    public string? PolicyNumber { get; init; }
    public string? PlanName { get; init; }
    public decimal? SumInsured { get; init; }
    public decimal? UtilizedAmount { get; init; }
    public DateTime? NextPremiumDueDate { get; init; }
    public decimal? NextPremiumAmount { get; init; }
    public int? DependentsCount { get; init; }
    public int? NomineesCount { get; init; }

    // ✅ NEW FIELDS
    public bool IsPremiumPaidForCurrentMonth { get; init; }
    public DateTime? LastPaymentDate { get; init; }
    public decimal? LastPaymentAmount { get; init; }
}