namespace CMS.Application.DTOs.Auth;

public sealed class RegisterRequest
{
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string Password { get; init; } = null!;
    public DateTime DateOfBirth { get; init; }
}