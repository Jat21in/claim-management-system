namespace CMS.Domain.Common;

/// <summary>
/// Represents audit metadata for domain entities.
/// This interface defines what should be audited,
/// not how auditing is implemented.
/// </summary>
public interface IAuditable
{
    DateTime CreatedAt { get; }
    DateTime? UpdatedAt { get; }
}