using CMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace CMS.Application.Services;

public sealed class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly string _uploadFolder;

    public FileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
        _uploadFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "MedicalReports");

        // Create directory if it doesn't exist
        if (!Directory.Exists(_uploadFolder))
        {
            Directory.CreateDirectory(_uploadFolder);
        }
    }

    public async Task<(string fileName, string filePath, long fileSize, string contentType)> SaveFileAsync(
        IFormFile file,
        Guid claimId,
        CancellationToken cancellationToken)
    {
        // Generate unique filename
        var originalFileName = Path.GetFileNameWithoutExtension(file.FileName);
        var extension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{claimId}_{DateTime.Now:yyyyMMddHHmmss}_{originalFileName}{extension}";
        var filePath = Path.Combine(_uploadFolder, uniqueFileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return (
            fileName: originalFileName + extension,
            filePath: uniqueFileName, // Store relative path
            fileSize: file.Length,
            contentType: file.ContentType
        );
    }

    public void DeleteFile(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return;

        var fullPath = Path.Combine(_uploadFolder, filePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }

    public byte[]? GetFileBytes(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return null;

        var fullPath = Path.Combine(_uploadFolder, filePath);
        if (!File.Exists(fullPath)) return null;

        return File.ReadAllBytes(fullPath);
    }
}