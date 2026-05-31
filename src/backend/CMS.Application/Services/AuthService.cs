using CMS.Application.DTOs.Auth;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Security;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly IMemberRepository _memberRepository;
    private readonly IPlanRepository _planRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly IPolicyRepository _policyRepository;

    public AuthService(
        IMemberRepository memberRepository,
        IPlanRepository planRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtGenerator,
        IPolicyRepository policyRepository)
    {
        _memberRepository = memberRepository;
        _planRepository = planRepository;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
        _policyRepository = policyRepository;
    }

    public async Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository
            .GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid credentials");

        if (!_passwordHasher.Verify(request.Password, member.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        var token = _jwtGenerator.Generate(member);

        return new LoginResponse
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAt
        };
    }

    public async Task RegisterAsync(
    RegisterRequest request,
    CancellationToken cancellationToken)
    {
        // Fast existence check
        if (await _memberRepository.ExistsByEmailAsync(request.Email, cancellationToken))
            throw new InvalidOperationException("Email already exists");

        var member = new Member(
            request.FullName,
            request.Email,
            request.DateOfBirth,
            Address.Empty()
        );

        member.SetPasswordHash(
            _passwordHasher.Hash(request.Password)
        );

        // Save member first to get ID
        await _memberRepository.AddAsync(member, cancellationToken);

        // Optional plan selection during registration
        if (request.SelectedPlanId.HasValue)
        {
            var plan = await _planRepository.GetByIdAsync(
                request.SelectedPlanId.Value,
                cancellationToken
            );

            if (plan == null)
                throw new InvalidOperationException("Invalid plan selected");

            // ✅ Create Policy in the new Policies table
            var policy = new Policy(
                memberId: member.MemberId,
                planId: plan.PlanId,
                policyNumber: GeneratePolicyNumber(),
                monthlyPremium: CalculateMonthlyPremium(plan.InsuredAmount),
                annualPremium: CalculateAnnualPremium(plan.InsuredAmount),
                sumInsured: plan.InsuredAmount,
                startDate: DateTime.UtcNow,
                durationInMonths: plan.DurationInMonths
            );

            // Use dependency injection for PolicyRepository
            // You'll need to inject IPolicyRepository
            await _policyRepository.AddAsync(policy, cancellationToken);

            // Also set the old ActivePlan for backward compatibility
            member.AssignPlan(plan);
            await _memberRepository.UpdateAsync(member, cancellationToken);
        }
    }

    private string GeneratePolicyNumber()
    {
        return $"POL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
    }

    private decimal CalculateMonthlyPremium(decimal sumInsured)
    {
        return Math.Round((sumInsured * 0.005m) / 12, 2);
    }

    private decimal CalculateAnnualPremium(decimal sumInsured)
    {
        return Math.Round(sumInsured * 0.005m, 2);
    }

}