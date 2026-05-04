using CMS.Domain.ValueObjects;

namespace CMS.Domain.Entities;

public sealed class Plan
{
    public Guid PlanId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public Money InsuredAmount { get; private set; } = null!;

    public void Update(DateTime newEndDate, Money newInsuredAmount)
    {
        if (newEndDate <= EndDate)
            throw new InvalidOperationException("Plan end date must be extended.");

        if (newInsuredAmount.Amount < InsuredAmount.Amount)
            throw new InvalidOperationException("Insured amount cannot be reduced.");

        EndDate = newEndDate;
        InsuredAmount = newInsuredAmount;
    }

    // EF Core
    private Plan() { }

    public Plan(
        DateTime startDate,
        DateTime endDate,
        Money insuredAmount)
    {
        if (startDate >= endDate)
            throw new ArgumentException("Plan start date must be before end date.");

        InsuredAmount = insuredAmount
            ?? throw new ArgumentNullException(nameof(insuredAmount));

        PlanId = Guid.NewGuid();
        StartDate = startDate;
        EndDate = endDate;
    }

    public bool IsWithinValidity(DateTime date)
        => date >= StartDate && date <= EndDate;

    public bool CanCover(Money claimAmount)
        => claimAmount.Amount <= InsuredAmount.Amount;
}