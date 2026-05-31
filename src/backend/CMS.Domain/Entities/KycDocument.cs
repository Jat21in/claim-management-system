using CMS.Domain.Enums;

namespace CMS.Domain.Entities;

public sealed class KycDocument
{
    public Guid DocumentId { get; private set; }
    public Guid MemberId { get; private set; }
    public DocumentType DocumentType { get; private set; }
    public string DocumentNumber { get; private set; } = null!;
    public string FileUrl { get; private set; } = null!;
    public string FileName { get; private set; } = null!;
    public long FileSize { get; private set; }
    public string? ContentType { get; private set; }
    public bool IsVerified { get; private set; }
    public Guid? VerifiedByAdminId { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTime UploadedAt { get; private set; }

    // Navigation
    public Member? Member { get; private set; }

    private KycDocument() { }

    public KycDocument(
        Guid memberId,
        DocumentType documentType,
        string documentNumber,
        string fileUrl,
        string fileName,
        long fileSize,
        string? contentType = null)
    {
        DocumentId = Guid.NewGuid();
        MemberId = memberId;
        DocumentType = documentType;
        DocumentNumber = documentNumber;
        FileUrl = fileUrl;
        FileName = fileName;
        FileSize = fileSize;
        ContentType = contentType;
        IsVerified = false;
        UploadedAt = DateTime.UtcNow;
    }

    public void Verify(Guid adminId)
    {
        IsVerified = true;
        VerifiedByAdminId = adminId;
        VerifiedAt = DateTime.UtcNow;
        RejectionReason = null;
    }

    public void Reject(Guid adminId, string reason)
    {
        IsVerified = false;
        VerifiedByAdminId = adminId;
        VerifiedAt = DateTime.UtcNow;
        RejectionReason = reason;
    }
}
