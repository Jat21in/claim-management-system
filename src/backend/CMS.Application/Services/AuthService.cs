
using CMS.Application.DTOs.Auth;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Security;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services
{
    public sealed class AuthService : IAuthService
    {
        private readonly IMemberRepository _memberRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenGenerator _jwtGenerator;

        public AuthService(
            IMemberRepository memberRepository,
            IPasswordHasher passwordHasher,
            IJwtTokenGenerator jwtGenerator)
        {
            _memberRepository = memberRepository;
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
            var existingMember =
                await _memberRepository.GetByEmailAsync(request.Email, cancellationToken);

            if (existingMember != null)
                throw new InvalidOperationException("Email already registered.");

            var passwordHash = _passwordHasher.Hash(request.Password);

            // ✅ Address is NOT part of registration requirement
            // Use a safe placeholder or domain-supported default
            var member = new Member(
                request.FullName,
                request.Email,
                request.DateOfBirth,
                Address.Empty() // ✅ see note below
            );

            member.SetPasswordHash(passwordHash);

            await _memberRepository.AddAsync(member, cancellationToken);
        }
    }
}
