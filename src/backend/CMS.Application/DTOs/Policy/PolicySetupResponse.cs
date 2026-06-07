namespace CMS.Application.DTOs.Policy;

public sealed class PolicySetupResponse
{
    public PolicySummaryResponse Policy { get; init; } = null!;
    public PremiumCalculationResponse PremiumCalculation { get; init; } = null!;
    public PaymentInitiationResponse Payment { get; init; } = null!;
}

public sealed class PremiumCalculationResponse
{
    public decimal BasePremium { get; init; }
    public decimal DependentLoading { get; init; }
    public decimal FrequencyDiscount { get; init; }
    public decimal CouponDiscount { get; init; }
    public decimal SubTotal { get; init; }
    public decimal TaxAmount { get; init; }
    public decimal GrandTotal { get; init; }
    public Dictionary<string, decimal> AvailableFrequencies { get; init; } = new();
}

public sealed class PaymentInitiationResponse
{
    public Guid PaymentId { get; init; }
    public string PaymentUrl { get; init; } = string.Empty;
    public string OrderId { get; init; } = string.Empty;
    public decimal Amount { get; init; }
}
