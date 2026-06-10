namespace CMS.Application.DTOs.Member;

public sealed class MemberDashboardResponse
{
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public ActivePlanDto? ActivePlan { get; init; }

    // ✅ ADD THESE - The actual Policy ID from Policies table
    public Guid? ActivePolicyId { get; init; }
    public string? ActivePolicyNumber { get; init; }
}

public sealed class ActivePlanDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public decimal InsuredAmount { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
}