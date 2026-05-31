namespace CMS.Domain.Enums;

public enum PolicyStatus
{
    Active = 0,
    Lapsed = 1,      // Premium overdue >30 days
    Cancelled = 2,   // Cancelled by user/admin
    Expired = 3      // End date reached
}
