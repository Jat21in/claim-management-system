namespace CMS.Domain.Enums;

public enum ClaimStatus
{
    /// <summary>
    /// Claim has been submitted by the member.
    /// </summary>
    Submitted = 1,

    /// <summary>
    /// Claim has been approved.
    /// </summary>
    Approved = 2,

    /// <summary>
    /// Claim has been rejected.
    /// </summary>
    Rejected = 3,

    /// <summary>
    /// Claim is pending manual review.
    /// </summary>
    Pending = 4,           // ✅ ADD THIS - matches database 'Pending'

    /// <summary>
    /// Claim is being processed by AI verification.
    /// </summary>
    PendingAI = 5,

    /// <summary>
    /// Approved claim has been paid.
    /// </summary>
    Paid = 6
}
