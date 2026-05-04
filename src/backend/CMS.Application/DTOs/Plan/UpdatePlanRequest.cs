namespace CMS.Application.DTOs.Plan;

public sealed class UpdatePlanRequest
{
    public DateTime EndDate { get; init; }
    public decimal InsuredAmount { get; init; }
}