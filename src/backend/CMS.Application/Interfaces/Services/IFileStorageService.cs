using CMS.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace CMS.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> UploadKycDocumentAsync(Guid memberId, DocumentType documentType, Stream fileStream, string fileName, CancellationToken cancellationToken);
    Task<string> UploadClaimDocumentAsync(Guid claimId, Stream fileStream, string fileName, CancellationToken cancellationToken);
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken);

    // ✅ NEW: Profile Photo Methods
    Task<string> UploadProfilePhotoAsync(Guid memberId, Stream fileStream, string fileName, CancellationToken cancellationToken);
    Task<bool> DeleteProfilePhotoAsync(string photoUrl, CancellationToken cancellationToken);
    byte[]? GetFileBytes(string filePath);
}