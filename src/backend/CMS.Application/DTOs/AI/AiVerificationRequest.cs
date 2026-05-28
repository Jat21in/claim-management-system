namespace CMS.Application.DTOs.AI;

public sealed class AiVerificationRequest
{
    public Guid ClaimId { get; init; }
    public Guid MemberId { get; init; }
    public decimal ClaimAmount { get; init; }
    public DateTime ClaimDate { get; init; }
    public string Description { get; init; } = string.Empty;

    // Plan details for context
    public PlanContextDto PlanContext { get; init; } = null!;

    // Member history
    public MemberHistoryDto MemberHistory { get; init; } = null!;
}

public sealed class PlanContextDto
{
    public string PlanName { get; init; } = string.Empty;
    public decimal InsuredAmount { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public int DurationInMonths { get; init; }
    public string[] Features { get; init; } = Array.Empty<string>();
}

public sealed class MemberHistoryDto
{
    public int TotalClaimsSubmitted { get; init; }
    public int ApprovedClaims { get; init; }
    public int RejectedClaims { get; init; }
    public decimal TotalClaimedAmount { get; init; }
    public DateTime MemberSince { get; init; }
}