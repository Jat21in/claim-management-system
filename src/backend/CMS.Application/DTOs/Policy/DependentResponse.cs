namespace CMS.Application.DTOs.Policy;

public sealed class DependentResponse
{
    public Guid DependentId { get; init; }
    public string FullName { get; init; } = null!;
    public string Relationship { get; init; } = null!;
    public DateTime DateOfBirth { get; init; }
    public bool IsActive { get; init; }
}