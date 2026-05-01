namespace CMS.Application.DTOs.Plan;

public sealed class PlanResponse
{
    public Guid PlanId { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public decimal InsuredAmount { get; init; }
}
