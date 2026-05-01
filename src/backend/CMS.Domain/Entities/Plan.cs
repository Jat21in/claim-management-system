using System;
using CMS.Domain.ValueObjects;

namespace CMS.Domain.Entities;

public sealed class Plan
{
    public Guid PlanId { get; private set; }
    public DateTime ValidFrom { get; private set; }
    public DateTime ValidTo { get; private set; }
    public Money InsuredAmount { get; private set; } = null!;

    // EF Core
    private Plan() { }

    public Plan(
        DateTime validFrom,
        DateTime validTo,
        Money insuredAmount)
    {
        if (validFrom >= validTo)
            throw new ArgumentException("Invalid plan validity period.");

        InsuredAmount = insuredAmount
            ?? throw new ArgumentNullException(nameof(insuredAmount));

        PlanId = Guid.NewGuid();
        ValidFrom = validFrom;
        ValidTo = validTo;
    }

    public bool IsWithinValidity(DateTime date)
        => date >= ValidFrom && date <= ValidTo;
}