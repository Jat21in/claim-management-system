using CMS.Application.Interfaces.Repositories;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CMS.Application.Interfaces.Security;
using CMS.Infrastructure.Security;

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

        return services;
    }
}