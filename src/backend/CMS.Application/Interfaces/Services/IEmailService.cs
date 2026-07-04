namespace CMS.Application.Interfaces.Services;

public interface IEmailService
{
    // Existing methods
    Task SendKycApprovedEmailAsync(string toEmail, string fullName, CancellationToken cancellationToken);
    Task SendKycRejectedEmailAsync(string toEmail, string fullName, string reason, CancellationToken cancellationToken);
    Task SendKycSubmittedEmailToAdminAsync(string fullName, string email, CancellationToken cancellationToken);
    Task SendPremiumReminderEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, DateTime dueDate, CancellationToken cancellationToken);
    Task SendPolicyCreatedEmailAsync(string toEmail, string fullName, string policyNumber, CancellationToken cancellationToken);
    Task SendPaymentConfirmationEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, string transactionId, CancellationToken cancellationToken);
    Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken);
    Task SendPolicyLapsedEmailAsync(string toEmail, string fullName, string policyNumber, decimal outstandingAmount, CancellationToken cancellationToken);
    Task SendClaimSettlementEmailAsync(string toEmail, string fullName, string claimNumber, decimal amount, string paymentReference, CancellationToken cancellationToken);
    Task SendGstInvoiceEmailAsync(string toEmail, string fullName, string invoiceNumber, decimal amount, byte[] pdfAttachment, CancellationToken cancellationToken);
    Task SendClaimStatusUpdateEmailAsync(string toEmail, string fullName, string claimId, decimal amount, DateTime claimDate, string description, string status, double? aiConfidenceScore, string aiDecision, string aiReasoning, CancellationToken cancellationToken);

    // ✅ NEW: Password Reset Email
    Task SendPasswordResetOtpAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken);
}