using CMS.Domain.Common;
using CMS.Domain.ValueObjects;

namespace CMS.Domain.Entities;

public sealed class Member : IAuditable
{
    // Identity
    public Guid MemberId { get; private set; }

    // Core Data
    public string FullName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public DateTime DateOfBirth { get; private set; }
    public Address Address { get; private set; } = null!;

    // Aggregate Relations
    public Plan? ActivePlan { get; private set; }

    private readonly List<Claim> _claims = new();
    public IReadOnlyCollection<Claim> Claims => _claims.AsReadOnly();

    // Auditing
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // EF Core
    private Member() { }

    public Member(
        string fullName,
        string email,
        DateTime dateOfBirth,
        Address address)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name is required.", nameof(fullName));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        MemberId = Guid.NewGuid();
        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        DateOfBirth = dateOfBirth;
        Address = address ?? throw new ArgumentNullException(nameof(address));

        CreatedAt = DateTime.UtcNow;
    }

    // DOMAIN BEHAVIOR 

    public void AssignPlan(Plan plan)
    {
        if (plan is null)
            throw new ArgumentNullException(nameof(plan));

        ActivePlan = plan;
        UpdatedAt = DateTime.UtcNow;
    }

    public Claim SubmitClaim(
        Money claimAmount,
        DateTime claimDate,
        string description)
    {
        if (ActivePlan is null)
            throw new InvalidOperationException("Member does not have an active plan.");

        if (!ActivePlan.IsWithinValidity(claimDate))
            throw new InvalidOperationException("Claim date is outside plan validity.");

        if (claimAmount.Amount > ActivePlan.InsuredAmount.Amount)
            throw new InvalidOperationException("Claim amount exceeds insured amount.");

        var claim = Claim.Create(
            memberId: MemberId,
            planId: ActivePlan.PlanId,
            claimDate: DateOnly.FromDateTime(claimDate),
            claimAmount: claimAmount
        );

        _claims.Add(claim);
        UpdatedAt = DateTime.UtcNow;

        return claim;
    }
}