using CMS.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace CMS.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> UploadKycDocumentAsync(Guid memberId, DocumentType documentType, Stream fileStream, string fileName, CancellationToken cancellationToken);
    Task<string> UploadClaimDocumentAsync(Guid claimId, Stream fileStream, string fileName, CancellationToken cancellationToken);
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken);

    //Task<(string fileName, string filePath, long fileSize, string contentType)> SaveFileAsync(
    //    IFormFile file,
    //    Guid claimId,
    //    CancellationToken cancellationToken);

    //void DeleteFile(string filePath);

    byte[]? GetFileBytes(string filePath);
}
