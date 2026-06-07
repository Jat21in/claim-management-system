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

    // ✅ NEW: Premium Rating Configuration
    private readonly List<RatingFactor> _ratingFactors = new();

    public IReadOnlyCollection<RatingFactor> RatingFactors
        => _ratingFactors.AsReadOnly();

    public decimal AgeLoadingPercentage { get; private set; } // 0-50%
    public decimal SmokerLoadingPercentage { get; private set; } // 0-30%
    public decimal PreExistingConditionLoading { get; private set; } // 0-40%
    public decimal LocationRiskMultiplier { get; private set; } // 0.5 - 2.0
    public bool IsFamilyFloater { get; private set; }
    public decimal CorporateDiscountPercentage { get; private set; }

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

        // ✅ Default premium configuration
        AgeLoadingPercentage = 10m;
        SmokerLoadingPercentage = 15m;
        PreExistingConditionLoading = 20m;
        LocationRiskMultiplier = 1.0m;
        IsFamilyFloater = false;
        CorporateDiscountPercentage = 0m;

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
            throw new InvalidOperationException(
                "New end date must be after current end date."
            );

        if (newInsuredAmount <= 0)
            throw new ArgumentException(
                "Insured amount must be greater than zero."
            );

        EndDate = newEndDate;
        InsuredAmount = newInsuredAmount;
    }

    // ✅ NEW: Premium Loading Calculator
    public decimal CalculateTotalLoading(
        int age,
        bool isSmoker,
        bool hasPreExistingCondition,
        string pinCode)
    {
        decimal total = 0;

        // Age loading
        if (age >= 40 && age < 50)
        {
            total += AgeLoadingPercentage * 0.5m;
        }
        else if (age >= 50 && age < 60)
        {
            total += AgeLoadingPercentage;
        }
        else if (age >= 60)
        {
            total += AgeLoadingPercentage * 1.5m;
        }

        // Smoker loading
        if (isSmoker)
        {
            total += SmokerLoadingPercentage;
        }

        // Pre-existing disease loading
        if (hasPreExistingCondition)
        {
            total += PreExistingConditionLoading;
        }

        return total;
    }

    // ✅ OPTIONAL: Update premium configuration
    public void ConfigurePremiumFactors(
        decimal ageLoadingPercentage,
        decimal smokerLoadingPercentage,
        decimal preExistingConditionLoading,
        decimal locationRiskMultiplier,
        bool isFamilyFloater,
        decimal corporateDiscountPercentage)
    {
        AgeLoadingPercentage = ageLoadingPercentage;
        SmokerLoadingPercentage = smokerLoadingPercentage;
        PreExistingConditionLoading = preExistingConditionLoading;
        LocationRiskMultiplier = locationRiskMultiplier;
        IsFamilyFloater = isFamilyFloater;
        CorporateDiscountPercentage = corporateDiscountPercentage;
    }

    public void Deactivate() => IsActive = false;
}