namespace CMS.Application.DTOs.Member;

public sealed class RegisterMemberRequest
{
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public DateTime DateOfBirth { get; init; }

    public string Street { get; init; } = null!;
    public string City { get; init; } = null!;
    public string State { get; init; } = null!;
    public string Country { get; init; } = null!;
    public string PostalCode { get; init; } = null!;
}