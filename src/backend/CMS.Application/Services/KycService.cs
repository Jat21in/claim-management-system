using CMS.Application.DTOs.KYC;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.Enums;

namespace CMS.Application.Services;

public sealed class KycService : IKycService
{
    private readonly IKycRepository _kycRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IEmailService _emailService;
    private readonly IDocumentVerificationService _documentVerificationService;

    public KycService(
        IKycRepository kycRepository,
        IMemberRepository memberRepository,
        IFileStorageService fileStorageService,
        IEmailService emailService,
        IDocumentVerificationService documentVerificationService)
    {
        _kycRepository = kycRepository;
        _memberRepository = memberRepository;
        _fileStorageService = fileStorageService;
        _emailService = emailService;
        _documentVerificationService = documentVerificationService;
    }

    public async Task SubmitKycDocumentsAsync(
    Guid memberId,
    SubmitKycRequest request,
    Stream fileStream,
    string fileName,
    CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
            throw new InvalidOperationException("Member not found");

        // ✅ Verify OTP first
        
        // ✅ Save phone number to member profile
        if (member.PhoneNumber != request.PhoneNumber)
        {
            // Update phone number
            var phoneProperty = member.GetType().GetProperty("PhoneNumber");
            phoneProperty?.SetValue(member, request.PhoneNumber);
            await _memberRepository.UpdateAsync(member, cancellationToken);
        }

        // Check if member was rejected - reset status for re-upload
        if (member.Status == MemberStatus.Rejected)
        {
            member.SubmitKyc();
            await _memberRepository.UpdateAsync(member, cancellationToken);
        }

        // Upload file
        var fileUrl = await _fileStorageService.UploadKycDocumentAsync(
            memberId,
            request.DocumentType,
            fileStream,
            fileName,
            cancellationToken);

        // Check if document already exists for this type
        var existingDocs = await _kycRepository.GetByMemberIdAsync(memberId, cancellationToken);
        var existingDoc = existingDocs.FirstOrDefault(d => d.DocumentType == request.DocumentType);

        KycDocument document;

        if (existingDoc != null)
        {
            await _fileStorageService.DeleteFileAsync(existingDoc.FileUrl, cancellationToken);

            existingDoc.GetType().GetProperty("DocumentNumber")?.SetValue(existingDoc, request.DocumentNumber);
            existingDoc.GetType().GetProperty("FileUrl")?.SetValue(existingDoc, fileUrl);
            existingDoc.GetType().GetProperty("FileName")?.SetValue(existingDoc, fileName);
            existingDoc.GetType().GetProperty("FileSize")?.SetValue(existingDoc, fileStream.Length);
            existingDoc.GetType().GetProperty("IsVerified")?.SetValue(existingDoc, false);
            existingDoc.GetType().GetProperty("RejectionReason")?.SetValue(existingDoc, null);
            existingDoc.GetType().GetProperty("VerifiedByAdminId")?.SetValue(existingDoc, null);
            existingDoc.GetType().GetProperty("VerifiedAt")?.SetValue(existingDoc, null);

            await _kycRepository.UpdateAsync(existingDoc, cancellationToken);
        }
        else
        {
            document = new KycDocument(
                memberId: memberId,
                documentType: request.DocumentType,
                documentNumber: request.DocumentNumber,
                fileUrl: fileUrl,
                fileName: fileName,
                fileSize: fileStream.Length,
                contentType: GetContentType(fileName)
            );
            await _kycRepository.AddAsync(document, cancellationToken);
        }

        // Update member status
        if (member.Status == MemberStatus.Pending || member.Status == MemberStatus.Rejected)
        {
            member.SubmitKyc();
            await _memberRepository.UpdateAsync(member, cancellationToken);
        }

        // Send email notification to admin
        await _emailService.SendKycSubmittedEmailToAdminAsync(
            member.FullName,
            member.Email,
            cancellationToken);
    }


    public async Task<KycStatusResponse> GetKycStatusAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
            if (member == null)
            {
                // Return a default response instead of throwing
                return new KycStatusResponse
                {
                    Status = MemberStatus.Pending,
                    HasSubmittedDocuments = false,
                    SubmittedAt = null,
                    VerifiedAt = null,
                    RejectionReason = null,
                    Documents = new List<KycDocumentResponse>()
                };
            }

            var documents = await _kycRepository.GetByMemberIdAsync(memberId, cancellationToken);

            return new KycStatusResponse
            {
                Status = member.Status,
                HasSubmittedDocuments = documents.Any(),
                SubmittedAt = member.KycSubmittedAt,
                VerifiedAt = member.KycVerifiedAt,
                RejectionReason = member.RejectionReason,
                Documents = documents.Select(d => new KycDocumentResponse
                {
                    DocumentId = d.DocumentId,
                    DocumentType = d.DocumentType.ToString(),
                    DocumentNumber = d.DocumentNumber,
                    IsVerified = d.IsVerified,
                    RejectionReason = d.RejectionReason,
                    UploadedAt = d.UploadedAt,
                    FileUrl = d.FileUrl
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetKycStatusAsync: {ex.Message}");
            return new KycStatusResponse
            {
                Status = MemberStatus.Pending,
                HasSubmittedDocuments = false,
                Documents = new List<KycDocumentResponse>()
            };
        }
    }

    public async Task<List<PendingKycResponse>> GetPendingKycRequestsAsync(CancellationToken cancellationToken)
    {
        var documents = await _kycRepository.GetPendingKycAsync(cancellationToken);
        var groupedByMember = documents.GroupBy(d => d.MemberId);

        var result = new List<PendingKycResponse>();

        foreach (var group in groupedByMember)
        {
            var member = group.First().Member;
            if (member != null)
            {
                result.Add(new PendingKycResponse
                {
                    MemberId = member.MemberId,
                    FullName = member.FullName,
                    Email = member.Email,
                    SubmittedAt = member.KycSubmittedAt ?? DateTime.UtcNow,
                    Documents = group.Select(d => new KycDocumentSummary
                    {
                        DocumentId = d.DocumentId,
                        DocumentType = d.DocumentType.ToString(),
                        DocumentNumber = d.DocumentNumber,
                        FileUrl = d.FileUrl,
                        FileName = d.FileName
                    }).ToList()
                });
            }
        }

        return result;
    }

    public async Task ApproveKycAsync(Guid adminId, Guid memberId, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
            throw new InvalidOperationException("Member not found");

        member.ApproveKyc(adminId);
        await _memberRepository.UpdateAsync(member, cancellationToken);

        // Mark all documents as verified
        var documents = await _kycRepository.GetByMemberIdAsync(memberId, cancellationToken);
        foreach (var doc in documents)
        {
            doc.Verify(adminId);
            await _kycRepository.UpdateAsync(doc, cancellationToken);
        }

        // Send approval email
        await _emailService.SendKycApprovedEmailAsync(member.Email, member.FullName, cancellationToken);
    }

    public async Task RejectKycAsync(Guid adminId, Guid memberId, string reason, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
            throw new InvalidOperationException("Member not found");

        member.RejectKyc(adminId, reason);
        await _memberRepository.UpdateAsync(member, cancellationToken);

        // Mark documents as rejected
        var documents = await _kycRepository.GetByMemberIdAsync(memberId, cancellationToken);
        foreach (var doc in documents)
        {
            doc.Reject(adminId, reason);
            await _kycRepository.UpdateAsync(doc, cancellationToken);
        }

        // Send rejection email
        await _emailService.SendKycRejectedEmailAsync(member.Email, member.FullName, reason, cancellationToken);
    }

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream"
        };
    }
}
