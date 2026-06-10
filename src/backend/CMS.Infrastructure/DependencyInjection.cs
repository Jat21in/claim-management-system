using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Security;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Repositories;
using CMS.Infrastructure.Security;
using CMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 🔥 FIX: Add connection resilience and command timeout
        services.AddDbContext<CmsDbContext>(options =>
    options.UseSqlServer(
        configuration.GetConnectionString("CmsDatabase"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);

            sqlOptions.CommandTimeout(120);

            // ✅ ADD THIS
            sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        })
    .EnableSensitiveDataLogging(false)
    .EnableDetailedErrors(false)
);

        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<IClaimRepository, ClaimRepository>();

        // NEW REPOSITORIES FOR PHASE 1
        services.AddScoped<IPolicyRepository, PolicyRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IKycRepository, KycRepository>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // NEW SERVICES FOR PHASE 1
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IPdfGenerationService, PdfGenerationService>();
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}
