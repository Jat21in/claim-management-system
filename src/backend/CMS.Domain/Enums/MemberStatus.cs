namespace CMS.Domain.Enums;

public enum MemberStatus
{
    Pending = 0,      // KYC not submitted or under review
    Verified = 1,     // KYC approved, can buy policies
    Rejected = 2,     // KYC rejected
    Suspended = 3     // Account suspended by admin
}