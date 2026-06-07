using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Services;

public interface IPremiumCalculatorService
{
    PremiumBreakdown CalculatePremium(
        Plan plan,
        int dependentCount,
        string frequency, // "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"
        string? couponCode = null);

    decimal CalculateDependentLoading(Plan plan, int dependentCount);
    decimal ApplyFrequencyDiscount(decimal amount, string frequency);
    decimal ApplyCouponDiscount(decimal amount, string couponCode);
}

public class PremiumBreakdown
{
    public decimal BasePremium { get; set; }
    public decimal DependentLoading { get; set; }
    public decimal SubTotal { get; set; }
    public decimal FrequencyDiscount { get; set; }
    public decimal CouponDiscount { get; set; }
    public decimal TaxAmount { get; set; } // 18% GST
    public decimal GrandTotal { get; set; }
    public string SelectedFrequency { get; set; } = string.Empty;
    public int TotalDependents { get; set; }
    public Dictionary<string, decimal> AvailableFrequencies { get; set; } = new();
}
