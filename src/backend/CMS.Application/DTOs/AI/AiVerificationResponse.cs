namespace CMS.Application.DTOs.AI;

public sealed class AiVerificationResponse
{
    public double ConfidenceScore { get; init; }
    public string Decision { get; init; } = string.Empty; // "Approved", "Rejected", "ManualReview"
    public string Reasoning { get; init; } = string.Empty;
    public List<string> RiskFactors { get; init; } = new();
    public List<string> ValidationPassed { get; init; } = new();

    // ✅ FIXED
    public DateTime VerifiedAt { get; set; }

    // ✅ FIXED
    public string AiModel { get; set; } = string.Empty;

}