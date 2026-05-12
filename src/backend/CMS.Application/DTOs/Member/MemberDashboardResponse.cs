namespace CMS.Application.DTOs.Member;

public sealed class MemberDashboardResponse
{
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;

    public ActivePlanDto ActivePlan { get; init; } = null!;
}

public sealed class ActivePlanDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public decimal InsuredAmount { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
}