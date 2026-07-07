using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Application Services - Business Logic Layer
        services.AddScoped<IMemberService, MemberService>();
        services.AddScoped<IClaimService, ClaimService>();
        services.AddScoped<IPlanService, PlanService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPolicyService, PolicyService>();
        services.AddScoped<IKycService, KycService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IDocumentVerificationService, DocumentVerificationService>();
        services.AddScoped<IPremiumCalculatorService, PremiumCalculatorService>();
        services.AddScoped<IGracePeriodService, GracePeriodService>();
        services.AddScoped<IPdfGenerationService, PdfGenerationService>();
        services.AddScoped<EmailLinkService>(); // ✅ NEW: Email link service for dynamic URLs

        // Note: IFileStorageService is registered in Infrastructure layer
        // to maintain proper separation of concerns

        return services;
    }
}