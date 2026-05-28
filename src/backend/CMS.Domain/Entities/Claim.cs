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

    // AI Verification Fields - NEW
    public double? AiConfidenceScore { get; private set; }
    public string? AiDecision { get; private set; }
    public string? AiReasoning { get; private set; }
    public DateTime? AiVerifiedAt { get; private set; }

    // Auditing
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private Claim()
    {
        ClaimAmount = null!;
    }

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

    // NEW: Method to update with AI verification results
    public void UpdateAiVerification(
    double confidenceScore,
    string decision,
    string reasoning)
    {
        AiConfidenceScore = confidenceScore;
        AiDecision = decision;
        AiReasoning = reasoning;
        AiVerifiedAt = DateTime.UtcNow;

        // Auto-update status based on AI decision
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

    // Manual override for claims
    public void ManualApprove()
    {
        Status = ClaimStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ManualReject()
    {
        Status = ClaimStatus.Rejected;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }

    private static void ValidateCreation(DateOnly claimDate, Money claimAmount)
    {
        if (claimAmount is null)
            throw new ArgumentNullException(nameof(claimAmount));

        if (claimDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("Claim date cannot be in the future.");
    }

    // NEW: File upload fields
    public string? MedicalReportFileName { get; private set; }
    public string? MedicalReportPath { get; private set; }
    public long? MedicalReportSize { get; private set; }
    public string? MedicalReportContentType { get; private set; }

    // NEW: Method to update medical report information
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

    // Update Create method to include file info
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
}