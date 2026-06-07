using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IMemberService, MemberService>();
        services.AddScoped<IClaimService, ClaimService>();
        services.AddScoped<IPlanService, PlanService>();
        services.AddScoped<IAuthService, AuthService>();

        // NEW SERVICES FOR PHASE 1
        services.AddScoped<IPolicyService, PolicyService>();
        services.AddScoped<IKycService, KycService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IDocumentVerificationService, DocumentVerificationService>();
        services.AddScoped<IPremiumCalculatorService, PremiumCalculatorService>();

        services.AddScoped<IGracePeriodService, GracePeriodService>();


        return services;
    }
}
