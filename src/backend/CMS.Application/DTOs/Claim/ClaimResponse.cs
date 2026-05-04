namespace CMS.Application.DTOs.Claim;

public sealed class ClaimResponse
{
    public Guid ClaimId { get; init; }
    public DateTime ClaimDate { get; init; }
    public decimal Amount { get; init; }
    public string Status { get; init; } = null!;
}