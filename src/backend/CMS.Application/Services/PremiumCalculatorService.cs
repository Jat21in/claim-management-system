using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;

namespace CMS.Application.Services;

public sealed class PremiumCalculatorService : IPremiumCalculatorService
{
    private const decimal GST_RATE = 0.18m;

    private readonly Dictionary<string, decimal> _frequencyDiscounts = new()
    {
        { "MONTHLY", 0m },
        { "QUARTERLY", 0.03m }, // 3% discount
        { "HALF_YEARLY", 0.08m }, // 8% discount
        { "YEARLY", 0.12m } // 12% discount
    };

    public PremiumBreakdown CalculatePremium(
        Plan plan,
        int dependentCount,
        string frequency,
        string? couponCode = null)
    {
        if (dependentCount > plan.MaxDependentsAllowed)
        {
            throw new InvalidOperationException($"Maximum {plan.MaxDependentsAllowed} dependents allowed");
        }

        var breakdown = new PremiumBreakdown
        {
            BasePremium = plan.BasePremiumAnnual,
            DependentLoading = CalculateDependentLoading(plan, dependentCount),
            SubTotal = plan.BasePremiumAnnual + CalculateDependentLoading(plan, dependentCount),
            FrequencyDiscount = ApplyFrequencyDiscount(plan.BasePremiumAnnual + CalculateDependentLoading(plan, dependentCount), frequency),
            SelectedFrequency = frequency,
            TotalDependents = dependentCount
        };

        breakdown.SubTotal -= breakdown.FrequencyDiscount;

        if (!string.IsNullOrEmpty(couponCode))
        {
            breakdown.CouponDiscount = ApplyCouponDiscount(breakdown.SubTotal, couponCode);
            breakdown.SubTotal -= breakdown.CouponDiscount;
        }

        breakdown.TaxAmount = breakdown.SubTotal * GST_RATE;
        breakdown.GrandTotal = breakdown.SubTotal + breakdown.TaxAmount;

        // Populate available frequencies with their discounted amounts
        foreach (var freq in _frequencyDiscounts)
        {
            var amount = plan.BasePremiumAnnual + CalculateDependentLoading(plan, dependentCount);
            var discount = amount * freq.Value;
            breakdown.AvailableFrequencies[freq.Key] = amount - discount;
        }

        return breakdown;
    }

    public decimal CalculateDependentLoading(Plan plan, int dependentCount)
    {
        if (dependentCount == 0) return 0;
        return plan.BasePremiumAnnual * (plan.DependentLoadingPercentage / 100) * dependentCount;
    }

    public decimal ApplyFrequencyDiscount(decimal amount, string frequency)
    {
        if (!_frequencyDiscounts.ContainsKey(frequency)) return 0;
        return amount * _frequencyDiscounts[frequency];
    }

    public decimal ApplyCouponDiscount(decimal amount, string couponCode)
    {
        // Mock coupon logic - in production, fetch from database
        return couponCode switch
        {
            "WELCOME20" => amount * 0.20m,
            "FIRST10" => amount * 0.10m,
            _ => 0
        };
    }
}
