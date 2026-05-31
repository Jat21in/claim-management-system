using CMS.Domain.Enums;

namespace CMS.Application.DTOs.KYC;

public sealed class KycStatusResponse
{
    public MemberStatus Status { get; init; }
    public bool HasSubmittedDocuments { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public DateTime? VerifiedAt { get; init; }
    public string? RejectionReason { get; init; }
    public List<KycDocumentResponse> Documents { get; init; } = new();
}

public sealed class KycDocumentResponse
{
    public Guid DocumentId { get; init; }
    public string DocumentType { get; init; } = null!;
    public string DocumentNumber { get; init; } = null!;
    public bool IsVerified { get; init; }
    public string? RejectionReason { get; init; }
    public DateTime UploadedAt { get; init; }
    public string FileUrl { get; init; } = null!;
}
