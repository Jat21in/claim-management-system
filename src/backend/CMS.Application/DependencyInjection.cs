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

        return services;
    }
}