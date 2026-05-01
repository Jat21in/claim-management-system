using System;
using System.Collections.Generic;
using System.Text;

namespace CMS.Domain.Entities;

using CMS.Domain.Enums;
using CMS.Domain.ValueObjects;
using CMS.Domain.Common;

public sealed class Claim : IAuditable
{
    // Identity
    public Guid ClaimId { get; private set; }

    // Associations (by identity, not navigation)
    public Guid MemberId { get; private set; }
    public Guid PlanId { get; private set; }

    // Core attributes
    public DateOnly ClaimDate { get; private set; }
    public Money ClaimAmount { get; private set; }
    public ClaimStatus Status { get; private set; }

    // Audit
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Private constructor for controlled creation
    private Claim() { }

    // Factory method (intention-revealing)
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

    // Domain behaviors (NOT approvals)
    public void MarkUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }

    // -------- Domain Guards --------
    private static void ValidateCreation(DateOnly claimDate, Money claimAmount)
    {
        if (claimAmount == null)
            throw new ArgumentNullException(nameof(claimAmount));

        if (claimDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("Claim date cannot be in the future.");
    }
}
