namespace CMS.Application.DTOs.Policy;

public sealed class AddDependentRequest
{
    public string FullName { get; init; } = null!;
    public string Relationship { get; init; } = null!;
    public DateTime DateOfBirth { get; init; }
}