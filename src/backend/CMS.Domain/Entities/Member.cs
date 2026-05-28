using CMS.Domain.Common;
using CMS.Domain.ValueObjects;

namespace CMS.Domain.Entities;

public sealed class Member : IAuditable
{
    // Identity
    public Guid MemberId { get; private set; }
    public Guid? ActivePlanId { get; private set; }  // 👈 NEW

    // Core Data
    public string FullName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public DateTime DateOfBirth { get; private set; }
    public Address Address { get; private set; } = null!;
    public string? ContactNumber { get; private set; }
    public string Role { get; private set; } = "Member";  // "Admin", "ClaimsProcessor", "Member"

    // Authentication
    public string PasswordHash { get; private set; } = null!;

    public void SetPasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(passwordHash));

        PasswordHash = passwordHash;
        UpdatedAt = DateTime.UtcNow;
    }


    // Aggregate Relations
    public Plan? ActivePlan { get; private set; }

    public ICollection<Claim> Claims { get; set; } = new List<Claim>();


    // Auditing
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // EF Core Constructor
    private Member() { }

    // Domain Constructor
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

    // Domain Behavior
    public void AssignPlan(Plan plan)
    {
        if (plan is null)
            throw new ArgumentNullException(nameof(plan));

        ActivePlan = plan;
        ActivePlanId = plan.PlanId;  // 👈 SET THE FK EXPLICITLY
        UpdatedAt = DateTime.UtcNow;
    }

    public Claim SubmitClaim(
    Money claimAmount,
    DateTime claimDate,
    string description)
    {
        if (ActivePlan is null)
            throw new InvalidOperationException("Member does not have an active plan.");

        var claim = Claim.Create(
            memberId: MemberId,
            planId: ActivePlan.PlanId,
            claimDate: DateOnly.FromDateTime(claimDate),
            claimAmount: claimAmount,
            description: description
        );

        Claims.Add(claim); // ✅ USE THIS NOW

        UpdatedAt = DateTime.UtcNow;

        return claim;
    }

    public void UpdateAddress(Address address, string contactNumber)
    {
        Address = address ?? throw new ArgumentNullException(nameof(address));

        ContactNumber = string.IsNullOrWhiteSpace(contactNumber)
            ? null
            : contactNumber.Trim();

        UpdatedAt = DateTime.UtcNow;
    }
}