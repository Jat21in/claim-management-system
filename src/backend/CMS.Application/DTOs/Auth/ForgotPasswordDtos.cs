namespace CMS.Application.DTOs.Auth;

public sealed class ForgotPasswordRequest
{
    public string Email { get; init; } = null!;
}

public sealed class VerifyResetTokenRequest
{
    public string Email { get; init; } = null!;
    public string Token { get; init; } = null!;
}

public sealed class ResetPasswordRequest
{
    public string Email { get; init; } = null!;
    public string Token { get; init; } = null!;
    public string NewPassword { get; init; } = null!;
}

public sealed class ForgotPasswordResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed class VerifyResetTokenResponse
{
    public bool IsValid { get; init; }
}