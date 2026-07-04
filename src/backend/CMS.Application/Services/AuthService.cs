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
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailService _emailService;

    public AuthService(
        IMemberRepository memberRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailService emailService)
    {
        _memberRepository = memberRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailService = emailService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Invalid email or password.");
        }

        if (!_passwordHasher.Verify(request.Password, member.PasswordHash))
        {
            throw new InvalidOperationException("Invalid email or password.");
        }

        var (token, expiresAt) = _jwtTokenGenerator.Generate(member);

        return new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt
        };
    }

    public async Task RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var exists = await _memberRepository.ExistsByEmailAsync(request.Email, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Email already registered.");
        }

        // ✅ FIX: Use Address.Empty() instead of empty strings
        var address = Address.Empty();

        var member = new Member(
            fullName: request.FullName,
            email: request.Email,
            dateOfBirth: request.DateOfBirth,
            address: address
        );

        member.SetPasswordHash(_passwordHasher.Hash(request.Password));

        await _memberRepository.AddAsync(member, cancellationToken);
    }

    // ✅ NEW: Forgot Password
    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (member == null)
        {
            // Don't reveal if email exists for security
            return;
        }

        // Generate 6-digit OTP
        var otp = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(15);

        member.SetResetToken(otp, expiresAt);
        await _memberRepository.UpdateAsync(member, cancellationToken);

        // Send email with OTP
        await _emailService.SendPasswordResetOtpAsync(
            member.Email,
            member.FullName,
            otp,
            cancellationToken);
    }

    // ✅ NEW: Verify Reset Token
    public async Task<bool> VerifyResetTokenAsync(VerifyResetTokenRequest request, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (member == null) return false;

        return member.IsResetTokenValid(request.Token);
    }

    // ✅ NEW: Reset Password
    // ✅ NEW: Reset Password
    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (member == null)
        {
            throw new InvalidOperationException("Invalid request.");
        }

        if (!member.IsResetTokenValid(request.Token))
        {
            throw new InvalidOperationException("Invalid or expired reset token.");
        }

        // ✅ Update password
        var newPasswordHash = _passwordHasher.Hash(request.NewPassword);

        // Make sure the member has the method to update password
        member.SetPasswordHash(newPasswordHash);
        member.ClearResetToken();

        await _memberRepository.UpdateAsync(member, cancellationToken);

        // ✅ Log success
        Console.WriteLine($"✅ Password reset successfully for: {request.Email}");
    }
}