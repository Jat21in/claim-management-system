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

    public decimal BasePremiumAnnual { get; private set; }
    public decimal DependentLoadingPercentage { get; private set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public Dictionary<string, decimal> FrequencyDiscounts { get; private set; } = new();

    public int MaxDependentsAllowed { get; private set; }
    public int MaxNomineesAllowed { get; private set; }
    public string[] RequiredKycDocuments { get; private set; } = null!;

    public Plan(
    string code,
    string name,
    string description,
    decimal insuredAmount,
    int durationInMonths,
    string featuresJson,
    bool isFeatured,
    decimal basePremiumAnnual,
    decimal dependentLoadingPercentage,
    int maxDependentsAllowed,
    int maxNomineesAllowed,
    string[] requiredKycDocuments)
    {
        Code = code;
        Name = name;
        Description = description;
        InsuredAmount = insuredAmount;
        DurationInMonths = durationInMonths;
        FeaturesJson = featuresJson;
        IsFeatured = isFeatured;
        BasePremiumAnnual = basePremiumAnnual;
        DependentLoadingPercentage = dependentLoadingPercentage;
        MaxDependentsAllowed = maxDependentsAllowed;
        MaxNomineesAllowed = maxNomineesAllowed;
        RequiredKycDocuments = requiredKycDocuments;

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