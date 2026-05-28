using Microsoft.AspNetCore.Http;

namespace CMS.Application.DTOs.Claim;

public sealed class SubmitClaimRequest
{
    public DateTime ClaimDate { get; init; }
    public decimal Amount { get; init; }
    public string Description { get; init; } = null!;

    // NEW: File upload for medical report
    public IFormFile? MedicalReport { get; init; }
}