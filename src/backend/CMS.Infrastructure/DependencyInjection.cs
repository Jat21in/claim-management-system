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
        var connectionString = configuration.GetConnectionString("CmsDatabase");

        // Database Context with optimized settings
        services.AddDbContext<CmsDbContext>(options =>
            options.UseSqlServer(
                connectionString,
                sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);

                    sqlOptions.CommandTimeout(120);
                    sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                })
            .EnableSensitiveDataLogging(false)
            .EnableDetailedErrors(false)
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

        // Repositories
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<IClaimRepository, ClaimRepository>();
        services.AddScoped<IPolicyRepository, PolicyRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IKycRepository, KycRepository>();

        // Security
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // Infrastructure Services
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IPdfGenerationService, PdfGenerationService>();
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}