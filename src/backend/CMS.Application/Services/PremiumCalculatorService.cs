using CMS.Application.DTOs.Premium;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;

namespace CMS.Application.Services;

public sealed class PremiumCalculatorService : IPremiumCalculatorService
{
    private const decimal GST_RATE = 0.18m;
    private const decimal MAX_NO_CLAIM_BONUS = 0.25m; // 25% max after 5 years

    private readonly Dictionary<string, decimal> _frequencyDiscounts = new()
    {
        { "MONTHLY", 0m },
        { "QUARTERLY", 0.03m },
        { "HALF_YEARLY", 0.08m },
        { "YEARLY", 0.12m }
    };

    private readonly Dictionary<string, decimal> _locationRiskZones = new()
    {
        // Tier 1 cities
        { "400001", 1.2m }, { "400002", 1.2m }, // Mumbai
        { "110001", 1.2m }, { "110002", 1.2m }, // Delhi
        { "560001", 1.15m }, { "560002", 1.15m }, // Bangalore
        { "600001", 1.15m }, // Chennai
        { "700001", 1.15m }, // Kolkata
        // Tier 2 cities
        { "411001", 1.0m }, // Pune
        { "302001", 1.0m }, // Jaipur
        { "226001", 1.0m }, // Lucknow
        { "380001", 1.0m }, // Ahmedabad
        // Default
        { "DEFAULT", 0.85m }
    };

    public async Task<PremiumCalculationResult> CalculatePremiumAsync(
        Plan plan,
        CalculatePremiumRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = new PremiumCalculationResult();

        // 1. Base premium calculation
        result.BasePremium = plan.BasePremiumAnnual;
        result.BreakdownItems.Add(new PremiumBreakdownItem
        {
            Name = "Base Premium",
            Amount = result.BasePremium,
            Type = "Base",
            Description = $"Annual base premium for {plan.Name}"
        });

        // 2. Age loading
        result.AgeLoading = plan.CalculateTotalLoading(
            request.MemberAge,
            request.IsSmoker,
            request.HasPreExistingCondition,
            request.PinCode);
        result.BreakdownItems.Add(new PremiumBreakdownItem
        {
            Name = "Age Loading",
            Amount = result.AgeLoading,
            Type = "Loading",
            Description = $"Loading for age {request.MemberAge} years"
        });

        // 3. Smoker loading
        if (request.IsSmoker)
        {
            result.SmokerLoading = plan.SmokerLoadingPercentage;
            result.BreakdownItems.Add(new PremiumBreakdownItem
            {
                Name = "Smoker Loading",
                Amount = result.SmokerLoading,
                Type = "Loading",
                Description = "Additional loading for tobacco users"
            });
        }

        // 4. Pre-existing condition loading
        if (request.HasPreExistingCondition)
        {
            result.PreExistingLoading = plan.PreExistingConditionLoading;
            result.BreakdownItems.Add(new PremiumBreakdownItem
            {
                Name = "Pre-existing Condition Loading",
                Amount = result.PreExistingLoading,
                Type = "Loading",
                Description = "Loading for disclosed medical conditions"
            });
        }

        // 5. Location risk multiplier
        result.LocationMultiplier = _locationRiskZones.GetValueOrDefault(
            request.PinCode,
            _locationRiskZones["DEFAULT"]);

        // 6. Dependent loading based on age groups
        result.DependentLoading = CalculateDependentLoadingAdvanced(
            plan,
            request.DependentCount,
            request.DependentAgeGroups);
        result.BreakdownItems.Add(new PremiumBreakdownItem
        {
            Name = "Dependent Loading",
            Amount = result.DependentLoading,
            Type = "Loading",
            Description = $"Loading for {request.DependentCount} dependents"
        });

        // Calculate subtotal with all loadings
        decimal subtotal = result.BasePremium
            + result.AgeLoading
            + result.SmokerLoading
            + result.PreExistingLoading
            + result.DependentLoading;

        subtotal *= result.LocationMultiplier;
        result.SubTotal = subtotal;

        // 7. No Claim Bonus discount (5% per year, max 25%)
        if (request.HasNoClaimBonus && request.NoClaimBonusYears > 0)
        {
            result.NoClaimBonusDiscount = Math.Min(
                result.SubTotal * (request.NoClaimBonusYears * 0.05m),
                result.SubTotal * MAX_NO_CLAIM_BONUS);
            result.BreakdownItems.Add(new PremiumBreakdownItem
            {
                Name = "No Claim Bonus",
                Amount = -result.NoClaimBonusDiscount,
                Type = "Discount",
                Description = $"{request.NoClaimBonusYears} years without claims"
            });
        }

        // 8. Frequency discount
        result.FrequencyDiscount = ApplyFrequencyDiscount(
            result.SubTotal - result.NoClaimBonusDiscount,
            request.PremiumFrequency);
        result.BreakdownItems.Add(new PremiumBreakdownItem
        {
            Name = $"{request.PremiumFrequency} Payment Discount",
            Amount = -result.FrequencyDiscount,
            Type = "Discount",
            Description = $"Save {_frequencyDiscounts[request.PremiumFrequency] * 100}% by paying {request.PremiumFrequency.ToLower()}"
        });

        // 9. Corporate discount
        if (!string.IsNullOrEmpty(request.CorporateCode))
        {
            result.CorporateDiscount = await GetCorporateDiscountAsync(request.CorporateCode);
            result.BreakdownItems.Add(new PremiumBreakdownItem
            {
                Name = "Corporate Discount",
                Amount = -result.CorporateDiscount,
                Type = "Discount",
                Description = "Special corporate partnership discount"
            });
        }

        // 10. Coupon discount
        if (!string.IsNullOrEmpty(request.CouponCode))
        {
            result.CouponDiscount = ApplyCouponDiscount(
                result.SubTotal - result.NoClaimBonusDiscount - result.FrequencyDiscount - result.CorporateDiscount,
                request.CouponCode);
            result.BreakdownItems.Add(new PremiumBreakdownItem
            {
                Name = "Coupon Discount",
                Amount = -result.CouponDiscount,
                Type = "Discount",
                Description = $"Applied coupon: {request.CouponCode}"
            });
        }

        // Calculate final amount
        decimal amountAfterDiscounts = result.SubTotal
            - result.NoClaimBonusDiscount
            - result.FrequencyDiscount
            - result.CorporateDiscount
            - result.CouponDiscount;

        // 11. GST Calculation
        result.TaxAmount = amountAfterDiscounts * GST_RATE;
        result.BreakdownItems.Add(new PremiumBreakdownItem
        {
            Name = "GST (18%)",
            Amount = result.TaxAmount,
            Type = "Tax",
            Description = "Goods and Services Tax"
        });

        result.GrandTotal = amountAfterDiscounts + result.TaxAmount;

        // 12. Calculate available frequencies
        foreach (var freq in _frequencyDiscounts)
        {
            var discount = ApplyFrequencyDiscount(result.SubTotal, freq.Key);
            var afterDiscount = result.SubTotal - discount;
            var afterCoupon = afterDiscount - result.CouponDiscount;
            result.AvailableFrequencies[freq.Key] = afterCoupon + (afterCoupon * GST_RATE);
        }

        return result;
    }

    private decimal CalculateDependentLoadingAdvanced(Plan plan, int count, Dictionary<string, int> ageGroups)
    {
        if (count == 0) return 0;

        decimal totalLoading = 0;

        // Spouse loading (15%)
        if (ageGroups.ContainsKey("Spouse"))
        {
            totalLoading += plan.BasePremiumAnnual * 0.15m;
        }

        // Child loading based on age (10% for under 18, 5% for 18-25)
        if (ageGroups.TryGetValue("Child", out int childCount))
        {
            totalLoading += plan.BasePremiumAnnual * 0.10m * childCount;
        }

        // Parent loading (30% each)
        if (ageGroups.TryGetValue("Parent", out int parentCount))
        {
            totalLoading += plan.BasePremiumAnnual * 0.30m * parentCount;
        }

        // Additional loading for senior citizen parents (65+)
        if (ageGroups.TryGetValue("SeniorParent", out int seniorCount))
        {
            totalLoading += plan.BasePremiumAnnual * 0.50m * seniorCount;
        }

        return totalLoading;
    }

    public decimal CalculateDependentLoading(Plan plan, int dependentCount)
    {
        return plan.BasePremiumAnnual * (plan.DependentLoadingPercentage / 100) * dependentCount;
    }

    public decimal ApplyFrequencyDiscount(decimal amount, string frequency)
    {
        if (!_frequencyDiscounts.ContainsKey(frequency)) return 0;
        return amount * _frequencyDiscounts[frequency];
    }

    public decimal ApplyCouponDiscount(decimal amount, string couponCode)
    {
        return couponCode?.ToUpper() switch
        {
            "WELCOME20" => amount * 0.20m,
            "FIRST10" => amount * 0.10m,
            "HEALTH15" => amount * 0.15m,
            "FAMILY25" => amount * 0.25m,
            "CORPORATE30" => amount * 0.30m,
            _ => 0
        };
    }

    private async Task<decimal> GetCorporateDiscountAsync(string corporateCode)
    {
        // In production, fetch from database
        return corporateCode?.ToUpper() switch
        {
            "GOOGLE10" => 0.10m,
            "MICROSOFT15" => 0.15m,
            "AMAZON12" => 0.12m,
            _ => 0
        };
    }
}
