namespace CMS.Domain.Entities;

public sealed class Nominee
{
    public Guid NomineeId { get; private set; }
    public Guid PolicyId { get; private set; }
    public string FullName { get; private set; } = null!;
    public string Relationship { get; private set; } = null!;
    public decimal PercentageAllocation { get; private set; }
    public string? GuardianName { get; private set; } // If nominee is minor
    public bool IsPrimary { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation
    public Policy? Policy { get; private set; }

    private Nominee() { }

    public Nominee(
        Guid policyId,
        string fullName,
        string relationship,
        decimal percentageAllocation,
        string? guardianName = null,
        bool isPrimary = false)
    {
        NomineeId = Guid.NewGuid();
        PolicyId = policyId;
        FullName = fullName;
        Relationship = relationship;
        PercentageAllocation = percentageAllocation;
        GuardianName = guardianName;
        IsPrimary = isPrimary;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdatePercentage(decimal newPercentage)
    {
        PercentageAllocation = newPercentage;
        UpdatedAt = DateTime.UtcNow;
    }
}
