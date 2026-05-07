namespace CMS.Domain.Entities;

public sealed class Plan
{
    public Guid PlanId { get; private set; } = Guid.NewGuid();

    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;

    public decimal InsuredAmount { get; private set; }
    public int DurationInMonths { get; private set; }

    public string FeaturesJson { get; private set; } = null!;
    public bool IsFeatured { get; private set; }
    public bool IsActive { get; private set; } = true;

    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    private Plan() { }

    public Plan(
    string code,
    string name,
    string description,
    decimal insuredAmount,
    int durationInMonths,
    string featuresJson,
    bool isFeatured)
    {
        Code = code;
        Name = name;
        Description = description;
        InsuredAmount = insuredAmount;
        DurationInMonths = durationInMonths;
        FeaturesJson = featuresJson;
        IsFeatured = isFeatured;

        StartDate = DateTime.UtcNow;
        EndDate = StartDate.AddMonths(durationInMonths);
    }

    public bool IsWithinValidity(DateTime date)
    {
        return date >= StartDate && date <= EndDate;
    }

    public void UpdateValidityAndCoverage(
    DateTime newEndDate,
    decimal newInsuredAmount)
    {
        if (newEndDate <= EndDate)
            throw new InvalidOperationException("New end date must be after current end date.");

        if (newInsuredAmount <= 0)
            throw new ArgumentException("Insured amount must be greater than zero.");

        EndDate = newEndDate;
        InsuredAmount = newInsuredAmount;
    }
    public void Deactivate() => IsActive = false;
}