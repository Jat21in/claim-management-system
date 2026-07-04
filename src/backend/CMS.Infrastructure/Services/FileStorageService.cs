using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace CMS.Infrastructure.Services;

public sealed class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(
        IWebHostEnvironment environment,
        ILogger<FileStorageService> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    #region Private Helper Methods

    private string GetUploadsPath()
    {
        var path = Path.Combine(_environment.ContentRootPath, "Uploads");
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
        return path;
    }

    private string GetMemberFolder(Guid memberId)
    {
        var folder = Path.Combine(GetUploadsPath(), "Members", memberId.ToString());
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        return folder;
    }

    private string GetProfilePhotoFolder(Guid memberId)
    {
        var folder = Path.Combine(GetMemberFolder(memberId), "Profile");
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        return folder;
    }

    private string GetClaimFolder(Guid claimId)
    {
        var folder = Path.Combine(GetUploadsPath(), "Claims", claimId.ToString());
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        return folder;
    }

    private string GetKycFolder(Guid memberId)
    {
        var folder = Path.Combine(GetMemberFolder(memberId), "KYC");
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        return folder;
    }

    private async Task<string> SaveFileAsync(
        string folder,
        Stream fileStream,
        string fileName,
        string prefix,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(fileName);
        var sanitizedFileName = $"{prefix}_{DateTime.UtcNow:yyyyMMddHHmmssfff}{extension}";
        var filePath = Path.Combine(folder, sanitizedFileName);

        // Ensure directory exists
        Directory.CreateDirectory(folder);

        // Save file
        using var fileStreamOutput = new FileStream(filePath, FileMode.Create, FileAccess.Write);
        await fileStream.CopyToAsync(fileStreamOutput, cancellationToken);

        // Return relative path
        var relativePath = filePath.Replace(_environment.ContentRootPath, "").Replace('\\', '/');
        return relativePath;
    }

    private bool DeleteFileFromDisk(string filePath)
    {
        try
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("File deleted: {FilePath}", filePath);
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {FilePath}", filePath);
            return false;
        }
    }

    #endregion

    #region IFileStorageService Implementation

    /// <summary>
    /// Uploads a profile photo for a member
    /// </summary>
    public async Task<string> UploadProfilePhotoAsync(
        Guid memberId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken)
    {
        var folder = GetProfilePhotoFolder(memberId);
        var relativePath = await SaveFileAsync(
            folder,
            fileStream,
            fileName,
            $"profile_{memberId:N}",
            cancellationToken);

        _logger.LogInformation("Profile photo uploaded for member {MemberId}: {FilePath}", memberId, relativePath);
        return relativePath;
    }

    /// <summary>
    /// Deletes a profile photo
    /// </summary>
    public async Task<bool> DeleteProfilePhotoAsync(string photoUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(photoUrl)) return false;

        try
        {
            var physicalPath = GetPhysicalPath(photoUrl);
            var result = DeleteFileFromDisk(physicalPath);

            if (result)
            {
                _logger.LogInformation("Profile photo deleted: {FilePath}", physicalPath);
            }

            return await Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete profile photo: {PhotoUrl}", photoUrl);
            return false;
        }
    }

    /// <summary>
    /// Uploads a KYC document for a member
    /// </summary>
    public async Task<string> UploadKycDocumentAsync(
        Guid memberId,
        DocumentType documentType,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken)
    {
        var folder = GetKycFolder(memberId);
        var prefix = $"KYC_{documentType}_{memberId:N}";
        var relativePath = await SaveFileAsync(
            folder,
            fileStream,
            fileName,
            prefix,
            cancellationToken);

        _logger.LogInformation("KYC document uploaded for member {MemberId}: {FilePath}", memberId, relativePath);
        return relativePath;
    }

    /// <summary>
    /// Uploads a claim document
    /// </summary>
    public async Task<string> UploadClaimDocumentAsync(
        Guid claimId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken)
    {
        var folder = GetClaimFolder(claimId);
        var prefix = $"Claim_{claimId:N}";
        var relativePath = await SaveFileAsync(
            folder,
            fileStream,
            fileName,
            prefix,
            cancellationToken);

        _logger.LogInformation("Claim document uploaded for claim {ClaimId}: {FilePath}", claimId, relativePath);
        return relativePath;
    }

    /// <summary>
    /// Deletes a file by its URL
    /// </summary>
    public async Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(fileUrl)) return false;

        try
        {
            var physicalPath = GetPhysicalPath(fileUrl);
            var result = DeleteFileFromDisk(physicalPath);

            if (result)
            {
                _logger.LogInformation("File deleted: {FilePath}", physicalPath);
            }

            return await Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {FileUrl}", fileUrl);
            return false;
        }
    }

    #endregion

    #region Additional Utility Methods

    /// <summary>
    /// Gets the file size in bytes
    /// </summary>
    public long GetFileSize(string filePath)
    {
        try
        {
            var physicalPath = GetPhysicalPath(filePath);
            if (File.Exists(physicalPath))
            {
                return new FileInfo(physicalPath).Length;
            }
            return 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get file size: {FilePath}", filePath);
            return 0;
        }
    }

    /// <summary>
    /// Gets the file content type based on extension
    /// </summary>
    public string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            _ => "application/octet-stream"
        };
    }

    /// <summary>
    /// Reads file as byte array
    /// </summary>
    public byte[]? GetFileBytes(string filePath)
    {
        try
        {
            var physicalPath = GetPhysicalPath(filePath);
            if (File.Exists(physicalPath))
            {
                return File.ReadAllBytes(physicalPath);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read file: {FilePath}", filePath);
            return null;
        }
    }

    /// <summary>
    /// Gets the physical path from a relative URL
    /// </summary>
    public string GetPhysicalPath(string relativeUrl)
    {
        var relativePath = relativeUrl.TrimStart('/');
        return Path.Combine(_environment.ContentRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
    }

    #endregion
}