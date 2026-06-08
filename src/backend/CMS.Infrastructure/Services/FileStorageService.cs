using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;

namespace CMS.Infrastructure.Services;

public sealed class FileStorageService : IFileStorageService
{
    private readonly string _uploadPath;
    private readonly string _uploadFolder;

    public FileStorageService()
    {
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(_uploadPath))
            Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> UploadKycDocumentAsync(Guid memberId, DocumentType documentType, Stream fileStream, string fileName, CancellationToken cancellationToken)
    {
        var memberFolder = Path.Combine(_uploadPath, "KycDocuments", memberId.ToString());
        if (!Directory.Exists(memberFolder))
            Directory.CreateDirectory(memberFolder);

        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var safeFileName = $"{timestamp}_{documentType}_{fileName}";
        var filePath = Path.Combine(memberFolder, safeFileName);

        using (var fileStreamOutput = new FileStream(filePath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(fileStreamOutput, cancellationToken);
        }

        // Return relative URL for web access
        return $"/uploads/KycDocuments/{memberId}/{safeFileName}";
    }

    public async Task<string> UploadClaimDocumentAsync(Guid claimId, Stream fileStream, string fileName, CancellationToken cancellationToken)
    {
        var claimFolder = Path.Combine(_uploadPath, "ClaimDocuments", claimId.ToString());
        if (!Directory.Exists(claimFolder))
            Directory.CreateDirectory(claimFolder);

        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var safeFileName = $"{timestamp}_{fileName}";
        var filePath = Path.Combine(claimFolder, safeFileName);

        using (var fileStreamOutput = new FileStream(filePath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(fileStreamOutput, cancellationToken);
        }

        // ✅ Return URL that frontend can use directly
        return $"/uploads/ClaimDocuments/{claimId}/{safeFileName}";
    }


    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken)
    {
        try
        {
            var relativePath = fileUrl.TrimStart('/');
            var fullPath = Path.Combine(_uploadPath, relativePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public byte[]? GetFileBytes(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return null;

        // Handle both relative and absolute paths
        string fullPath;

        if (filePath.StartsWith("/uploads/"))
        {
            // Remove leading /uploads/ and combine with _uploadPath
            var relativePath = filePath.Substring(9); // Remove "/uploads/"
            fullPath = Path.Combine(_uploadPath, relativePath);
        }
        else if (filePath.StartsWith("uploads/"))
        {
            fullPath = Path.Combine(_uploadPath, filePath.Substring(8));
        }
        else if (filePath.Contains("_"))
        {
            // Old format - just filename, try to find it
            var allFiles = Directory.GetFiles(_uploadPath, "*", SearchOption.AllDirectories);
            var matchingFile = allFiles.FirstOrDefault(f => f.EndsWith(filePath));
            if (matchingFile == null) return null;
            fullPath = matchingFile;
        }
        else
        {
            fullPath = Path.Combine(_uploadPath, filePath);
        }

        if (!File.Exists(fullPath)) return null;
        return File.ReadAllBytes(fullPath);
    }

}
