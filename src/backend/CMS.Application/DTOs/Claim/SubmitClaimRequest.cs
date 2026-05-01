namespace CMS.Application.DTOs.Claim;

public sealed class SubmitClaimRequest
{
    public Guid MemberId { get; init; }
    public DateTime ClaimDate { get; init; }
    public decimal Amount { get; init; }
}