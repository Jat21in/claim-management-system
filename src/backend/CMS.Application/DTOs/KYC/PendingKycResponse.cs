namespace CMS.Application.DTOs.KYC;

public sealed class PendingKycResponse
{
    public Guid MemberId { get; init; }
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public DateTime SubmittedAt { get; init; }
    public List<KycDocumentSummary> Documents { get; init; } = new();
}

public sealed class KycDocumentSummary
{
    public Guid DocumentId { get; init; }
    public string DocumentType { get; init; } = null!;
    public string DocumentNumber { get; init; } = null!;
    public string FileUrl { get; init; } = null!;
    public string FileName { get; init; } = null!;
}
