namespace CMS.Application.DTOs.Member;

public sealed class AssignPlanRequest
{
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public decimal InsuredAmount { get; init; }
}