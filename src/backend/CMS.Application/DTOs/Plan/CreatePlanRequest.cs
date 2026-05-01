namespace CMS.Application.DTOs.Plan;

public sealed class CreatePlanRequest
{
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public decimal InsuredAmount { get; init; }
}