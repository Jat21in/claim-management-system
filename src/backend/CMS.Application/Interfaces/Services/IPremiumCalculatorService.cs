using CMS.Application.DTOs.Premium;
using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Services;

public interface IPremiumCalculatorService
{
    Task<PremiumCalculationResult> CalculatePremiumAsync(
        Plan plan,
        CalculatePremiumRequest request,
        CancellationToken cancellationToken = default);

    decimal CalculateDependentLoading(
        Plan plan,
        int dependentCount);

    decimal ApplyFrequencyDiscount(
        decimal amount,
        string frequency);

    decimal ApplyCouponDiscount(
        decimal amount,
        string couponCode);
}