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

    public AuthService(
        IMemberRepository memberRepository,
        IPlanRepository planRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtGenerator)
    {
        _memberRepository = memberRepository;
        _planRepository = planRepository;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
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
            Address.Empty() //  domain‑approved default
        );

        member.SetPasswordHash(
            _passwordHasher.Hash(request.Password)
        );

        //  Optional plan selection during registration
        if (request.SelectedPlanId.HasValue)
        {
            var plan = await _planRepository.GetByIdAsync(
                request.SelectedPlanId.Value,
                cancellationToken
            ) ?? throw new InvalidOperationException("Invalid plan selected");

            member.AssignPlan(plan);
        }

        await _memberRepository.AddAsync(member, cancellationToken);
    }
}