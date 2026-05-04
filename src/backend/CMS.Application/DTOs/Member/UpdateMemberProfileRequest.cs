namespace CMS.Application.DTOs.Member;

public sealed class UpdateMemberProfileRequest
{
    public string Street { get; init; } = null!;
    public string City { get; init; } = null!;
    public string State { get; init; } = null!;
    public string Country { get; init; } = null!;
    public string PostalCode { get; init; } = null!;
    public string ContactNumber { get; init; } = null!;
}