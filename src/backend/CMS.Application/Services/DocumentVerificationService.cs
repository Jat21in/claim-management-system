using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Enums;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace CMS.Application.Services;

public interface IDocumentVerificationService
{
    Task<DocumentVerificationResult> VerifyDocumentAsync(
        DocumentType documentType,
        string documentNumber,
        Stream documentStream,
        string fileName,
        CancellationToken cancellationToken);

    Task<bool> GenerateOtpAsync(string phoneNumber, Guid memberId, CancellationToken cancellationToken);
    Task<bool> VerifyOtpAsync(string phoneNumber, string otp, Guid memberId, CancellationToken cancellationToken);
}

public class DocumentVerificationResult
{
    public bool IsValid { get; set; }
    public int ConfidenceScore { get; set; }
    public List<string> ValidationPassed { get; set; } = new();
    public List<string> ValidationWarnings { get; set; } = new();
    public string ExtractedNumber { get; set; } = string.Empty;
    public string ExtractedName { get; set; } = string.Empty;
    public string VerificationMethod { get; set; } = string.Empty;
}

public class DocumentVerificationService : IDocumentVerificationService
{
    private readonly ILogger<DocumentVerificationService> _logger;
    private readonly IEmailService _emailService;
    private readonly IMemberRepository _memberRepository;
    private static readonly Dictionary<string, (string Otp, DateTime Expiry, Guid MemberId)> _otpStore = new();

    public DocumentVerificationService(
        ILogger<DocumentVerificationService> logger,
        IEmailService emailService,
        IMemberRepository memberRepository)
    {
        _logger = logger;
        _emailService = emailService;
        _memberRepository = memberRepository;
    }

    public async Task<DocumentVerificationResult> VerifyDocumentAsync(
        DocumentType documentType,
        string documentNumber,
        Stream documentStream,
        string fileName,
        CancellationToken cancellationToken)
    {
        var result = new DocumentVerificationResult();

        try
        {
            // Step 1: Format validation
            var formatValid = ValidateFormat(documentType, documentNumber);
            if (formatValid)
            {
                result.ValidationPassed.Add($"✓ Document number format is valid");
                result.ConfidenceScore += 30;
            }
            else
            {
                result.ValidationWarnings.Add("✗ Invalid document number format");
                result.IsValid = false;
                return result;
            }

            // Step 2: Checksum validation (for Aadhaar)
            if (documentType == DocumentType.Aadhaar)
            {
                var checksumValid = ValidateAadhaarChecksum(documentNumber);
                if (checksumValid)
                {
                    result.ValidationPassed.Add($"✓ Aadhaar checksum verification passed");
                    result.ConfidenceScore += 30;
                }
                else
                {
                    result.ValidationWarnings.Add("✗ Aadhaar checksum verification failed");
                    result.IsValid = false;
                    return result;
                }
            }

            // Step 3: OCR Text Extraction (if file provided)
            if (documentStream != null && documentStream.Length > 0)
            {
                var ocrResult = await PerformOcrAsync(documentStream, fileName, cancellationToken);

                if (!string.IsNullOrEmpty(ocrResult))
                {
                    result.ExtractedNumber = ExtractDocumentNumber(ocrResult, documentType);
                    result.ExtractedName = ExtractNameFromText(ocrResult);

                    // Check if extracted number matches provided number
                    if (!string.IsNullOrEmpty(result.ExtractedNumber) &&
                        NormalizeNumber(result.ExtractedNumber) == NormalizeNumber(documentNumber))
                    {
                        result.ValidationPassed.Add($"✓ OCR verification: Document number matches");
                        result.ConfidenceScore += 40;
                    }
                    else if (!string.IsNullOrEmpty(result.ExtractedNumber))
                    {
                        result.ValidationWarnings.Add($"⚠ OCR mismatch: Expected '{documentNumber}', Found '{result.ExtractedNumber}'");
                        result.ConfidenceScore += 10;
                    }
                    else
                    {
                        result.ValidationWarnings.Add($"⚠ Could not extract number from document");
                    }

                    if (!string.IsNullOrEmpty(result.ExtractedName))
                    {
                        result.ValidationPassed.Add($"✓ Extracted name: {result.ExtractedName}");
                    }
                }
            }

            // Determine final validity
            result.IsValid = result.ConfidenceScore >= 70;
            result.VerificationMethod = result.ConfidenceScore >= 80 ? "AUTOMATED" : "MANUAL_REVIEW";

            _logger.LogInformation($"Document verification completed. Confidence: {result.ConfidenceScore}%, Method: {result.VerificationMethod}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Document verification failed");
            result.ValidationWarnings.Add($"Verification error: {ex.Message}");
            result.IsValid = false;
        }

        return result;
    }

    private bool ValidateFormat(DocumentType type, string number)
    {
        return type switch
        {
            DocumentType.Aadhaar => Regex.IsMatch(number, @"^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$"),
            DocumentType.PAN => Regex.IsMatch(number, @"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"),
            DocumentType.Passport => Regex.IsMatch(number, @"^[A-Z]{1}[0-9]{7}$"),
            _ => true
        };
    }

    private bool ValidateAadhaarChecksum(string aadhaar)
    {
        // Verhoeff algorithm implementation
        var d = new int[,]
        {
            {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
            {1, 2, 3, 4, 0, 6, 7, 8, 9, 5},
            {2, 3, 4, 0, 1, 7, 8, 9, 5, 6},
            {3, 4, 0, 1, 2, 8, 9, 5, 6, 7},
            {4, 0, 1, 2, 3, 9, 5, 6, 7, 8},
            {5, 9, 8, 7, 6, 0, 4, 3, 2, 1},
            {6, 5, 9, 8, 7, 1, 0, 4, 3, 2},
            {7, 6, 5, 9, 8, 2, 1, 0, 4, 3},
            {8, 7, 6, 5, 9, 3, 2, 1, 0, 4},
            {9, 8, 7, 6, 5, 4, 3, 2, 1, 0}
        };

        var p = new int[,]
        {
            {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
            {1, 5, 7, 6, 2, 8, 3, 0, 9, 4},
            {5, 8, 0, 3, 7, 9, 6, 1, 4, 2},
            {8, 9, 1, 6, 0, 4, 3, 5, 2, 7},
            {9, 4, 5, 3, 1, 2, 6, 8, 7, 0},
            {4, 2, 8, 6, 5, 7, 3, 9, 0, 1},
            {2, 7, 9, 3, 8, 0, 6, 4, 1, 5},
            {7, 0, 4, 6, 9, 1, 3, 2, 5, 8}
        };

        var inv = new int[] { 0, 4, 3, 2, 1, 5, 6, 7, 8, 9 };

        int c = 0;
        var reversed = aadhaar.Reverse().ToArray();

        for (int i = 0; i < reversed.Length; i++)
        {
            int digit = int.Parse(reversed[i].ToString());
            c = d[c, p[(i + 1) % 8, digit]];
        }

        return c == 0;
    }

    private async Task<string> PerformOcrAsync(Stream stream, string fileName, CancellationToken cancellationToken)
    {
        // For company laptop constraints, we'll use a mock implementation
        // You can replace with Tesseract OCR (free) when permitted

        _logger.LogInformation($"OCR would process file: {fileName}");

        // Mock OCR - In production, integrate Tesseract
        // Install: Install-Package Tesseract
        return await Task.FromResult(string.Empty);
    }

    private string ExtractDocumentNumber(string text, DocumentType type)
    {
        // Try to find document number in OCR text
        var patterns = new Dictionary<DocumentType, string>
        {
            { DocumentType.Aadhaar, @"\b[2-9][0-9]{11}\b" },
            { DocumentType.PAN, @"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b" },
            { DocumentType.Passport, @"\b[A-Z][0-9]{7}\b" }
        };

        if (patterns.TryGetValue(type, out var pattern))
        {
            var match = Regex.Match(text, pattern);
            if (match.Success)
                return match.Value;
        }

        return string.Empty;
    }

    private string ExtractNameFromText(string text)
    {
        // Look for common name patterns
        var namePattern = @"(?:Name|NAME|नाम)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)";
        var match = Regex.Match(text, namePattern);
        return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
    }

    private string NormalizeNumber(string number)
    {
        return new string(number.Where(char.IsDigit).ToArray());
    }

    public async Task<bool> GenerateOtpAsync(string phoneNumber, Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
            if (member == null)
                return false;

            // Generate 6-digit OTP
            var otp = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(5);

            _otpStore[phoneNumber] = (otp, expiry, memberId);

            // Send OTP via email (since SMS might have constraints)
            await _emailService.SendOtpEmailAsync(member.Email, member.FullName, otp, cancellationToken);

            _logger.LogInformation($"OTP generated for {phoneNumber} (User: {member.Email}): {otp}");

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate OTP");
            return false;
        }
    }

    public async Task<bool> VerifyOtpAsync(string phoneNumber, string otp, Guid memberId, CancellationToken cancellationToken)
    {
        if (!_otpStore.ContainsKey(phoneNumber))
            return false;

        var (storedOtp, expiry, storedMemberId) = _otpStore[phoneNumber];

        if (storedMemberId != memberId)
            return false;

        if (DateTime.UtcNow > expiry)
        {
            _otpStore.Remove(phoneNumber);
            return false;
        }

        var isValid = storedOtp == otp;
        if (isValid)
        {
            _otpStore.Remove(phoneNumber);
        }

        return await Task.FromResult(isValid);
    }
}