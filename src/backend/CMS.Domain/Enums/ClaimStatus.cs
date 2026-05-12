namespace CMS.Domain.Enums;
public enum ClaimStatus
{
    /// <summary>
    /// Claim has been submitted by the member.
    /// This is the initial state of every claim.
    /// </summary>
    Submitted = 1,

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
    /// Future-ready state.
    /// </summary>
    Paid = 4
}