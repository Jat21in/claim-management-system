namespace CMS.Application.DTOs.Auth;

public sealed class LoginResponse
{
    public string Token { get; init; } = null!;
    public DateTime ExpiresAt { get; init; }
}