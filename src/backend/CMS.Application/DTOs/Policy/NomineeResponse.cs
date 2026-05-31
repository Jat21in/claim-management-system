namespace CMS.Application.DTOs.Policy;

public sealed class NomineeResponse
{
    public Guid NomineeId { get; init; }
    public string FullName { get; init; } = null!;
    public string Relationship { get; init; } = null!;
    public decimal PercentageAllocation { get; init; }
    public string? GuardianName { get; init; }
    public bool IsPrimary { get; init; }
}