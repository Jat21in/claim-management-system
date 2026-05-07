namespace CMS.Application.DTOs.Plan;

public sealed class PublicPlanResponse
{
    public Guid PlanId { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public decimal InsuredAmount { get; init; }

    public int DurationInMonths { get; init; }

    public string[] Features { get; init; } = Array.Empty<string>();

    public bool IsFeatured { get; init; }
}