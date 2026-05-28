using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Security;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Repositories;
using CMS.Infrastructure.Security;
//using CMS.Infrastructure.Services;
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
        services.AddDbContext<CmsDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("CmsDatabase")));

        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<IClaimRepository, ClaimRepository>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        services.AddScoped<IFileStorageService, FileStorageService>();

        // Register AI Service
        services.AddHttpClient<IAiVerificationService, GrokAiVerificationService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}
