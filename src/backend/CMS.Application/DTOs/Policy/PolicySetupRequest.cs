namespace CMS.Application.DTOs.Policy;

public sealed class PolicySetupRequest
{
    public Guid PlanId { get; init; }
    public string PremiumFrequency { get; init; } = "YEARLY"; // MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY
    public string? CouponCode { get; init; }
    public List<DependentInput> Dependents { get; init; } = new();
    public List<NomineeInput> Nominees { get; init; } = new();
}

public sealed class DependentInput
{
    public string FullName { get; init; } = null!;
    public string Relationship { get; init; } = null!; // Spouse, Child, Parent
    public DateTime DateOfBirth { get; init; }
    public string Gender { get; init; } = "MALE";
}

public sealed class NomineeInput
{
    public string FullName { get; init; } = null!;
    public string Relationship { get; init; } = null!;
    public decimal PercentageAllocation { get; init; }
    public string? GuardianName { get; init; }
    public bool IsPrimary { get; init; }
}
