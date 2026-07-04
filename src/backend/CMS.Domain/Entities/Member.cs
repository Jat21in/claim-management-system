using CMS.Domain.Common;
using CMS.Domain.ValueObjects;
using CMS.Domain.Enums;

namespace CMS.Domain.Entities;

public sealed class Member : IAuditable
{
    // Identity
    public Guid MemberId { get; private set; }
    public Guid? ActivePlanId { get; private set; }

    // KYC + Status
    public MemberStatus Status { get; private set; } = MemberStatus.Pending;
    public DateTime? KycSubmittedAt { get; private set; }
    public DateTime? KycVerifiedAt { get; private set; }
    public Guid? VerifiedByAdminId { get; private set; }
    public string? RejectionReason { get; private set; }

    // Core Data
    public string FullName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public DateTime DateOfBirth { get; private set; }
    public Address Address { get; private set; } = null!;
    public string? ContactNumber { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string Role { get; private set; } = "Member";

    // ✅ NEW: Profile Photo
    public string? ProfilePhotoUrl { get; private set; }

    // Authentication
    public string PasswordHash { get; private set; } = null!;

    // ✅ NEW: Password Reset Fields
    public string? ResetToken { get; private set; }
    public DateTime? ResetTokenExpiresAt { get; private set; }

    public void SetPasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(passwordHash));

        PasswordHash = passwordHash;
        UpdatedAt = DateTime.UtcNow;
    }

    // Aggregate Relations
    public Plan? ActivePlan { get; private set; }
    public ICollection<Claim> Claims { get; set; } = new List<Claim>();

    // Auditing
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // EF Core Constructor
    private Member() { }

    // Domain Constructor
    public Member(
        string fullName,
        string email,
        DateTime dateOfBirth,
        Address address)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name is required.", nameof(fullName));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        MemberId = Guid.NewGuid();
        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        DateOfBirth = dateOfBirth;
        Address = address ?? throw new ArgumentNullException(nameof(address));

        Status = MemberStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    // ✅ KYC METHODS
    public void SubmitKyc()
    {
        Status = MemberStatus.Pending;
        KycSubmittedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ApproveKyc(Guid adminId)
    {
        Status = MemberStatus.Verified;
        KycVerifiedAt = DateTime.UtcNow;
        VerifiedByAdminId = adminId;
        RejectionReason = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RejectKyc(Guid adminId, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Rejection reason is required", nameof(reason));

        Status = MemberStatus.Rejected;
        KycVerifiedAt = DateTime.UtcNow;
        VerifiedByAdminId = adminId;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ PROFILE PHOTO METHODS
    public void UpdateProfilePhoto(string photoUrl)
    {
        if (string.IsNullOrWhiteSpace(photoUrl))
            throw new ArgumentException("Photo URL is required", nameof(photoUrl));

        ProfilePhotoUrl = photoUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveProfilePhoto()
    {
        ProfilePhotoUrl = null;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ PASSWORD RESET METHODS
    public void SetResetToken(string token, DateTime expiresAt)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Reset token is required", nameof(token));

        if (expiresAt <= DateTime.UtcNow)
            throw new ArgumentException("Expiration must be in the future", nameof(expiresAt));

        ResetToken = token;
        ResetTokenExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearResetToken()
    {
        ResetToken = null;
        ResetTokenExpiresAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsResetTokenValid(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        if (ResetToken != token) return false;
        if (ResetTokenExpiresAt < DateTime.UtcNow) return false;
        return true;
    }

    // ✅ OBSOLETE PLAN ASSIGNMENT (Phase 1 compatibility)
    [Obsolete("Use Policy creation instead. Will be removed in Phase 2.")]
    public void AssignPlan(Plan plan)
    {
        if (plan is null)
            throw new ArgumentNullException(nameof(plan));

        ActivePlan = plan;
        ActivePlanId = plan.PlanId;
        UpdatedAt = DateTime.UtcNow;
    }

    // ✅ CLAIM SUBMISSION
    public Claim SubmitClaim(
        Money claimAmount,
        DateTime claimDate,
        string description)
    {
        if (ActivePlan is null)
            throw new InvalidOperationException("Member does not have an active plan.");

        if (Status != MemberStatus.Verified)
            throw new InvalidOperationException("KYC must be verified before submitting claims.");

        var claim = Claim.Create(
            memberId: MemberId,
            planId: ActivePlan.PlanId,
            claimDate: DateOnly.FromDateTime(claimDate),
            claimAmount: claimAmount,
            description: description
        );

        Claims.Add(claim);
        UpdatedAt = DateTime.UtcNow;

        return claim;
    }

    // ✅ UPDATE PROFILE
    public void UpdateAddress(Address address, string contactNumber)
    {
        Address = address ?? throw new ArgumentNullException(nameof(address));

        ContactNumber = string.IsNullOrWhiteSpace(contactNumber)
            ? null
            : contactNumber.Trim();

        UpdatedAt = DateTime.UtcNow;
    }
}