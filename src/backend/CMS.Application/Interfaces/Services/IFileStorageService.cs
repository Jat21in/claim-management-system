using Microsoft.AspNetCore.Http;

namespace CMS.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<(string fileName, string filePath, long fileSize, string contentType)> SaveFileAsync(
        IFormFile file,
        Guid claimId,
        CancellationToken cancellationToken);

    void DeleteFile(string filePath);

    byte[]? GetFileBytes(string filePath);
}
