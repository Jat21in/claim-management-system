namespace CMS.Domain.Entities;

public sealed class Dependent
{
    public Guid DependentId { get; private set; }
    public Guid PolicyId { get; private set; }
    public string FullName { get; private set; } = null!;
    public string Relationship { get; private set; } = null!; // Spouse, Child, Parent
    public DateTime DateOfBirth { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation
    public Policy? Policy { get; private set; }

    private Dependent() { }

    public Dependent(Guid policyId, string fullName, string relationship, DateTime dateOfBirth)
    {
        DependentId = Guid.NewGuid();
        PolicyId = policyId;
        FullName = fullName;
        Relationship = relationship;
        DateOfBirth = dateOfBirth;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
