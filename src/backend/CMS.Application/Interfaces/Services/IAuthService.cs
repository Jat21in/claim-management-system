using CMS.Application.DTOs.Auth;

namespace CMS.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    // ✅ NEW: Password Reset Methods
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken);
    Task<bool> VerifyResetTokenAsync(VerifyResetTokenRequest request, CancellationToken cancellationToken);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken);
}