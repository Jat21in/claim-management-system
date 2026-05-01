using System;
using CMS.Domain.Enums;
using CMS.Domain.ValueObjects;
using CMS.Domain.Common;

namespace CMS.Domain.Entities;

public sealed class Claim : IAuditable
{
    // Identity
    public Guid ClaimId { get; private set; }

    // Associations (by identity only)
    public Guid MemberId { get; private set; }
    public Guid PlanId { get; private set; }

    // Core Attributes
    public DateOnly ClaimDate { get; private set; }
    public Money ClaimAmount { get; private set; } = null!;
    public ClaimStatus Status { get; private set; }

    // Auditing
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

<<<<<<< HEAD
    // EF Core
    private Claim() { }
=======
    // Private constructor for controlled creation
    private Claim() {

        ClaimAmount = null!;
        Status = default!;
    }
>>>>>>> 774a445 (updated claim)

    // Factory Method (Intention-Revealing)
    public static Claim Create(
        Guid claimId,
        Guid memberId,
        Guid planId,
        DateOnly claimDate,
        Money claimAmount)
    {
        ValidateCreation(claimDate, claimAmount);

        return new Claim
        {
            ClaimId = claimId,
            MemberId = memberId,
            PlanId = planId,
            ClaimDate = claimDate,
            ClaimAmount = claimAmount,
            Status = ClaimStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };
    }

    // DOMAIN BEHAVIOR 

    public void MarkUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }

    // DOMAIN GUARDS 

    private static void ValidateCreation(DateOnly claimDate, Money claimAmount)
    {
        if (claimAmount is null)
            throw new ArgumentNullException(nameof(claimAmount));

        if (claimDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("Claim date cannot be in the future.");
    }
}