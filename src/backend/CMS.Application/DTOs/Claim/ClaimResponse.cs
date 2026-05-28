namespace CMS.Application.DTOs.Claim;

public sealed class ClaimResponse
{
    public Guid ClaimId { get; init; }
    public DateTime ClaimDate { get; init; }
    public decimal Amount { get; init; }
    public string Status { get; init; } = null!;
    public string? Description { get; init; }
    // AI Fields - NEW
    public double? AiConfidenceScore { get; init; }
    public string? AiDecision { get; init; }
    public string? AiReasoning { get; init; }

    // NEW: Medical report fields
    public bool HasMedicalReport { get; init; }
    public string? MedicalReportFileName { get; init; }
    public string? MedicalReportContentType { get; init; }

}