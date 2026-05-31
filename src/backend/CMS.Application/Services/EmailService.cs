using CMS.Application.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MimeKit.Text;

namespace CMS.Application.Services;

public sealed class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendKycApprovedEmailAsync(string toEmail, string fullName, CancellationToken cancellationToken)
    {
        var subject = "Your KYC has been approved!";
        var body = $@"
            <h2>Welcome to ClaimCore, {fullName}!</h2>
            <p>Your KYC verification has been approved. You can now:</p>
            <ul>
                <li>Browse and purchase insurance plans</li>
                <li>Add family members as dependents</li>
                <li>Nominate beneficiaries for your policy</li>
                <li>Submit and track claims</li>
            </ul>
            <p><a href='https://yourdomain.com/dashboard'>Click here to access your dashboard</a></p>
            <p>Thank you for choosing ClaimCore!</p>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendKycRejectedEmailAsync(string toEmail, string fullName, string reason, CancellationToken cancellationToken)
    {
        var subject = "Action Required: KYC Verification Failed";
        var body = $@"
            <h2>Dear {fullName},</h2>
            <p>Your KYC documents have been rejected for the following reason:</p>
            <p><strong>{reason}</strong></p>
            <p>Please login to your account and re-upload the correct documents.</p>
            <p><a href='https://yourdomain.com/kyc'>Click here to re-submit KYC</a></p>
            <p>If you have any questions, please contact our support team.</p>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPremiumReminderEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, DateTime dueDate, CancellationToken cancellationToken)
    {
        var subject = $"Premium Reminder: Payment Due on {dueDate:MMMM dd, yyyy}";
        var body = $@"
            <h2>Premium Payment Reminder</h2>
            <p>Dear {fullName},</p>
            <p>Your premium payment of <strong>₹{amount:N2}</strong> for policy <strong>{policyNumber}</strong> is due on <strong>{dueDate:MMMM dd, yyyy}</strong>.</p>
            <p>Please make the payment before the due date to avoid policy lapse.</p>
            <p><a href='https://yourdomain.com/payments'>Pay Now</a></p>
            <p>Thank you for being a valued customer!</p>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPolicyCreatedEmailAsync(string toEmail, string fullName, string policyNumber, CancellationToken cancellationToken)
    {
        var subject = "Your Insurance Policy is Active!";
        var body = $@"
            <h2>Congratulations, {fullName}!</h2>
            <p>Your insurance policy <strong>{policyNumber}</strong> has been successfully activated.</p>
            <p>Your policy documents are attached to this email. You can also download them from your dashboard.</p>
            <p><a href='https://yourdomain.com/policy'>View Policy Details</a></p>
            <p>Stay protected with ClaimCore!</p>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPaymentConfirmationEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, string transactionId, CancellationToken cancellationToken)
    {
        var subject = "Payment Confirmation";
        var body = $@"
            <h2>Payment Received</h2>
            <p>Dear {fullName},</p>
            <p>We have received your premium payment of <strong>₹{amount:N2}</strong> for policy <strong>{policyNumber}</strong>.</p>
            <p>Transaction ID: {transactionId}</p>
            <p>Your policy is now active until the next due date.</p>
            <p><a href='https://yourdomain.com/payments'>View Payment History</a></p>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        try
        {
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? throw new InvalidOperationException("EmailSettings:FromEmail is not configured");
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? throw new InvalidOperationException("EmailSettings:SmtpServer is not configured");
            var smtpPort = _configuration["EmailSettings:SmtpPort"] ?? throw new InvalidOperationException("EmailSettings:SmtpPort is not configured");
            var username = _configuration["EmailSettings:Username"] ?? throw new InvalidOperationException("EmailSettings:Username is not configured");
            var password = _configuration["EmailSettings:Password"] ?? throw new InvalidOperationException("EmailSettings:Password is not configured");

            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(fromEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(
                smtpServer,
                int.Parse(smtpPort),
                SecureSocketOptions.StartTls,
                cancellationToken);

            await smtp.AuthenticateAsync(
                username,
                password,
                cancellationToken);

            await smtp.SendAsync(email, cancellationToken);
            await smtp.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            // Log error but don't fail the operation
            Console.WriteLine($"Failed to send email: {ex.Message}");
        }
    }
}
