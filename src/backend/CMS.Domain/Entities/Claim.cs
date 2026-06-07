using System;
using CMS.Domain.Enums;
using CMS.Domain.ValueObjects;
using CMS.Domain.Common;

namespace CMS.Domain.Entities;

public sealed class Claim : IAuditable
{
    // Identity
    public Guid ClaimId { get; private set; }

    // Associations
    public Member Member { get; set; } = null!;
    public Guid MemberId { get; private set; }
    public Guid PlanId { get; private set; }

    // Core Attributes
    public DateOnly ClaimDate { get; private set; }
    public Money ClaimAmount { get; private set; } = null!;
    public ClaimStatus Status { get; private set; }
    public string? Description { get; private set; }

    // AI Verification Fields
    public double? AiConfidenceScore { get; private set; }
    public string? AiDecision { get; private set; }
    public string? AiReasoning { get; private set; }
    public DateTime? AiVerifiedAt { get; private set; }

    // ✅ NEW: Claim Settlement & Pre-Authorization Fields
    public bool IsPreAuthorization { get; private set; }
    public DateTime? AdmissionDate { get; private set; }
    public DateTime? DischargeDate { get; private set; }
    public Guid? HospitalId { get; private set; }
    public string? HospitalName { get; private set; }
    public string? DoctorName { get; private set; }
    public string? Diagnosis { get; private set; }
    public string? TreatmentType { get; private set; }

    public DateTime? PaymentDate { get; private set; }
    public string? PaymentReferenceNumber { get; private set; }
    public string? PaymentMode { get; private set; }

    // Auditing
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // File upload fields
    public string? MedicalReportFileName { get; private set; }
    public string? MedicalReportPath { get; private set; }
    public long? MedicalReportSize { get; private set; }
    public string? MedicalReportContentType { get; private set; }

    private Claim()
    {
        ClaimAmount = null!;
    }

    // ✅ Create claim without file
    public static Claim Create(
        Guid memberId,
        Guid planId,
        DateOnly claimDate,
        Money claimAmount,
        string? description = null)
    {
        ValidateCreation(claimDate, claimAmount);

        return new Claim
        {
            ClaimId = Guid.NewGuid(),
            MemberId = memberId,
            PlanId = planId,
            ClaimDate = claimDate,
            ClaimAmount = claimAmount,
            Description = description,
            Status = ClaimStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };
    }

    // ✅ Create claim with medical report
    public static Claim Create(
        Guid memberId,
        Guid planId,
        DateOnly claimDate,
        Money claimAmount,
        string? description = null,
        string? medicalReportFileName = null,
        string? medicalReportPath = null,
        long? medicalReportSize = null,
        string? medicalReportContentType = null)
    {
        ValidateCreation(claimDate, claimAmount);

        return new Claim
        {
            ClaimId = Guid.NewGuid(),
            MemberId = memberId,
            PlanId = planId,
            ClaimDate = claimDate,
            ClaimAmount = claimAmount,
            Description = description,
            Status = ClaimStatus.Submitted,
            CreatedAt = DateTime.UtcNow,

            MedicalReportFileName = medicalReportFileName,
            MedicalReportPath = medicalReportPath,
            MedicalReportSize = medicalReportSize,
            MedicalReportContentType = medicalReportContentType
        };
    }

    // ✅ AI Verification Update
    public void UpdateAiVerification(
        double confidenceScore,
        string decision,
        string reasoning)
    {
        AiConfidenceScore = confidenceScore;
        AiDecision = decision;
        AiReasoning = reasoning;
        AiVerifiedAt = DateTime.UtcNow;

        if (confidenceScore > 90 && decision == "Approved")
        {
            Status = ClaimStatus.Approved;
        }
        else if (confidenceScore < 30 && decision == "Rejected")
        {
            Status = ClaimStatus.Rejected;
        }
        else
        {
            Status = ClaimStatus.PendingAI;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ Manual Approval
    public void ManualApprove()
    {
        Status = ClaimStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ Manual Rejection
    public void ManualReject()
    {
        Status = ClaimStatus.Rejected;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ Update medical report
    public void UpdateMedicalReport(
        string fileName,
        string filePath,
        long fileSize,
        string contentType)
    {
        MedicalReportFileName = fileName;
        MedicalReportPath = filePath;
        MedicalReportSize = fileSize;
        MedicalReportContentType = contentType;

        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ NEW: Request Pre-Authorization
    public void RequestPreAuthorization(
        DateTime admissionDate,
        Guid hospitalId,
        string hospitalName,
        string doctorName,
        string diagnosis)
    {
        IsPreAuthorization = true;

        AdmissionDate = admissionDate;
        HospitalId = hospitalId;
        HospitalName = hospitalName;
        DoctorName = doctorName;
        Diagnosis = diagnosis;

        Status = ClaimStatus.PreAuth;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ NEW: Approve Pre-Authorization
    public void ApprovePreAuthorization()
    {
        if (Status != ClaimStatus.PreAuth)
        {
            throw new InvalidOperationException(
                "Claim is not in pre-authorization state"
            );
        }

        Status = ClaimStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ NEW: Mark Claim as Paid
    public void MarkAsPaid(
        string paymentReference,
        string paymentMode)
    {
        if (Status != ClaimStatus.Approved)
        {
            throw new InvalidOperationException(
                "Claim must be approved before payment"
            );
        }

        Status = ClaimStatus.Paid;

        PaymentDate = DateTime.UtcNow;
        PaymentReferenceNumber = paymentReference;
        PaymentMode = paymentMode;

        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ Optional helper
    public void UpdateDischargeDetails(
        DateTime dischargeDate,
        string treatmentType)
    {
        DischargeDate = dischargeDate;
        TreatmentType = treatmentType;

        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }

    private static void ValidateCreation(
        DateOnly claimDate,
        Money claimAmount)
    {
        if (claimAmount is null)
            throw new ArgumentNullException(nameof(claimAmount));

        if (claimDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException(
                "Claim date cannot be in the future."
            );
    }

    public void UpdateWithFinalBills(
    DateTime admissionDate,
    DateTime dischargeDate,
    decimal finalAmount,
    string diagnosis,
    string treatmentType)
    {
        AdmissionDate = admissionDate;
        DischargeDate = dischargeDate;

        Diagnosis = diagnosis;
        TreatmentType = treatmentType;

        ClaimAmount = new Money(finalAmount);

        UpdatedAt = DateTime.UtcNow;
    }

    public void AddMedicalReport(string fileName)
    {
        MedicalReportFileName = fileName;
        UpdatedAt = DateTime.UtcNow;
    }
}