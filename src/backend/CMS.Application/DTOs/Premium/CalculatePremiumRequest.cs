namespace CMS.Application.DTOs.Premium;

public sealed class CalculatePremiumRequest
{
    public Guid PlanId { get; init; }
    public int MemberAge { get; init; }
    public bool IsSmoker { get; init; }
    public bool HasPreExistingCondition { get; init; }
    public string PinCode { get; init; } = string.Empty;
    public int DependentCount { get; init; }
    public Dictionary<string, int> DependentAgeGroups { get; init; } = new();
    public string PremiumFrequency { get; init; } = "YEARLY";
    public string? CouponCode { get; init; }
    public bool HasNoClaimBonus { get; init; }
    public int NoClaimBonusYears { get; init; }
    public string? CorporateCode { get; init; }
}

public sealed class PremiumCalculationResult
{
    public decimal BasePremium { get; set; }
    public decimal AgeLoading { get; set; }
    public decimal SmokerLoading { get; set; }
    public decimal PreExistingLoading { get; set; }
    public decimal LocationMultiplier { get; set; }
    public decimal DependentLoading { get; set; }
    public decimal SubTotal { get; set; }
    public decimal NoClaimBonusDiscount { get; set; }
    public decimal FrequencyDiscount { get; set; }
    public decimal CorporateDiscount { get; set; }
    public decimal CouponDiscount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal GrandTotal { get; set; }
    public Dictionary<string, decimal> AvailableFrequencies { get; set; } = new();
    public List<PremiumBreakdownItem> BreakdownItems { get; set; } = new();
}

public sealed class PremiumBreakdownItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty; // Loading, Discount, Tax
    public string Description { get; set; } = string.Empty;
}
