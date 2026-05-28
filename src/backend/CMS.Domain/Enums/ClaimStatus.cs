namespace CMS.Domain.Enums;

public enum ClaimStatus
{
    /// <summary>
    /// Claim has been submitted by the member.
    /// </summary>
    Submitted = 1,

    /// <summary>
    /// Claim is being processed by AI verification.
    /// </summary>
    PendingAI = 5,  // NEW - Add this line

    /// <summary>
    /// Claim has been reviewed and approved.
    /// </summary>
    Approved = 2,

    /// <summary>
    /// Claim has been reviewed and rejected.
    /// </summary>
    Rejected = 3,

    /// <summary>
    /// Approved claim has been paid.
    /// </summary>
    Paid = 4
}