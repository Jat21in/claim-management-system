using CMS.Application.DTOs.Auth;

namespace CMS.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken);

    Task RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
}