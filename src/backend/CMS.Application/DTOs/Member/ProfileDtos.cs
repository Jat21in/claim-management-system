using Microsoft.AspNetCore.Http;

namespace CMS.Application.DTOs.Member;

public sealed class UpdateProfilePhotoRequest
{
    public IFormFile Photo { get; init; } = null!;
}

public sealed class ProfilePhotoResponse
{
    public string PhotoUrl { get; init; } = null!;
    public string Message { get; init; } = string.Empty;
}

public sealed class ProfileResponse
{
    public Guid MemberId { get; init; }
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public DateTime DateOfBirth { get; init; }
    public string? PhoneNumber { get; init; }
    public string? ProfilePhotoUrl { get; init; }
    public AddressDto Address { get; init; } = null!;
}

public sealed class AddressDto
{
    public string Street { get; init; } = null!;
    public string City { get; init; } = null!;
    public string State { get; init; } = null!;
    public string Country { get; init; } = null!;
    public string PostalCode { get; init; } = null!;
}

public sealed class UpdateProfileRequest
{
    public string FullName { get; init; } = null!;
    public DateTime DateOfBirth { get; init; }
    public string? PhoneNumber { get; init; }
    public AddressDto Address { get; init; } = null!;
}