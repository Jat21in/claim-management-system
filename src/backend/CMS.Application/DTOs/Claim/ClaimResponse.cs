using CMS.Domain.Enums;

namespace CMS.Application.DTOs.Claim;

public sealed class ClaimResponse
{
    public Guid ClaimId { get; init; }
    public DateTime ClaimDate { get; init; }
    public decimal Amount { get; init; }
    public string Status { get; init; } = null!;
    public string? Description { get; init; }

    // AI Fields
    public double? AiConfidenceScore { get; init; }
    public string? AiDecision { get; init; }
    public string? AiReasoning { get; init; }

    // Medical report fields
    public bool HasMedicalReport { get; init; }
    public string? MedicalReportFileName { get; init; }
    public string? MedicalReportContentType { get; init; }

    // ✅ ADD THESE MISSING FIELDS
    public string? MedicalReportPath { get; init; }

    // Pre-authorization fields
    public bool IsPreAuthorization { get; init; }
    public string? HospitalName { get; init; }
    public DateTime? AdmissionDate { get; init; }
    public string? DoctorName { get; init; }
    public string? Diagnosis { get; init; }
    public decimal? EstimatedAmount { get; init; }

    // Payment fields
    public string? PaymentMode { get; init; }
    public string? PaymentReferenceNumber { get; init; }
    public string? TreatmentType { get; init; }
}
