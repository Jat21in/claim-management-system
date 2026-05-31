namespace CMS.Application.Interfaces.Services;

public interface IEmailService
{
    Task SendKycApprovedEmailAsync(string toEmail, string fullName, CancellationToken cancellationToken);
    Task SendKycRejectedEmailAsync(string toEmail, string fullName, string reason, CancellationToken cancellationToken);
    Task SendPremiumReminderEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, DateTime dueDate, CancellationToken cancellationToken);
    Task SendPolicyCreatedEmailAsync(string toEmail, string fullName, string policyNumber, CancellationToken cancellationToken);
    Task SendPaymentConfirmationEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, string transactionId, CancellationToken cancellationToken);
}
