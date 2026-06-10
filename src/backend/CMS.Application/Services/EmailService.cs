using CMS.Application.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MimeKit.Text;

namespace CMS.Application.Services;

public sealed class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendKycApprovedEmailAsync(string toEmail, string fullName, CancellationToken cancellationToken)
    {
        var subject = "Your KYC has been approved! - ClaimCore Insurance";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #22D3EE, #06b6d4); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Welcome to ClaimCore!</h1>
                    </div>
                    <div class='content'>
                        <h2>Dear {fullName},</h2>
                        <p>Great news! Your KYC verification has been <strong>approved</strong>.</p>
                        <p>You now have full access to:</p>
                        <ul>
                            <li>Browse and purchase insurance plans</li>
                            <li>Add family members as dependents</li>
                            <li>Nominate beneficiaries</li>
                            <li>Submit and track claims</li>
                            <li>Download policy documents</li>
                        </ul>
                        <a href='https://yourdomain.com/dashboard' class='button'>Go to Dashboard →</a>
                        <p style='margin-top: 20px;'>Thank you for choosing ClaimCore!</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendKycRejectedEmailAsync(string toEmail, string fullName, string reason, CancellationToken cancellationToken)
    {
        var subject = "Action Required: KYC Verification Failed - ClaimCore Insurance";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .reason-box {{ background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>KYC Verification Failed</h1>
                    </div>
                    <div class='content'>
                        <h2>Dear {fullName},</h2>
                        <p>Unfortunately, your KYC verification has been <strong>rejected</strong>.</p>
                        <div class='reason-box'>
                            <strong>Reason for rejection:</strong><br>
                            {reason}
                        </div>
                        <p>Please login to your account and re-upload the correct documents with the following guidelines:</p>
                        <ul>
                            <li>Ensure documents are clear and readable</li>
                            <li>Document number should match exactly</li>
                            <li>File size should be under 5MB</li>
                            <li>Accepted formats: PDF, JPG, PNG</li>
                        </ul>
                        <a href='https://yourdomain.com/kyc/upload' class='button'>Re-upload Documents →</a>
                        <p>If you have any questions, please contact our support team.</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPremiumReminderEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, DateTime dueDate, CancellationToken cancellationToken)
    {
        var subject = $"Premium Reminder: Payment Due on {dueDate:MMMM dd, yyyy} - ClaimCore Insurance";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Premium Payment Reminder</h1>
                    </div>
                    <div class='content'>
                        <h2>Dear {fullName},</h2>
                        <p>This is a reminder that your premium payment is due soon.</p>
                        <p><strong>Policy Number:</strong> {policyNumber}</p>
                        <p><strong>Amount Due:</strong> ₹{amount:N2}</p>
                        <p><strong>Due Date:</strong> {dueDate:MMMM dd, yyyy}</p>
                        <a href='https://yourdomain.com/payments' class='button'>Pay Now →</a>
                        <p>Please ensure timely payment to avoid policy lapse.</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPolicyCreatedEmailAsync(string toEmail, string fullName, string policyNumber, CancellationToken cancellationToken)
    {
        var subject = "Your Insurance Policy is Active! - ClaimCore Insurance";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Congratulations!</h1>
                    </div>
                    <div class='content'>
                        <h2>Dear {fullName},</h2>
                        <p>Your insurance policy has been successfully activated!</p>
                        <p><strong>Policy Number:</strong> {policyNumber}</p>
                        <a href='https://yourdomain.com/policy' class='button'>View Policy Details →</a>
                        <p>Stay protected with ClaimCore!</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPaymentConfirmationEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, string transactionId, CancellationToken cancellationToken)
    {
        var subject = "Payment Confirmation - ClaimCore Insurance";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #22D3EE, #06b6d4); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Payment Received</h1>
                    </div>
                    <div class='content'>
                        <h2>Dear {fullName},</h2>
                        <p>We have received your premium payment successfully.</p>
                        <p><strong>Policy Number:</strong> {policyNumber}</p>
                        <p><strong>Amount:</strong> ₹{amount:N2}</p>
                        <p><strong>Transaction ID:</strong> {transactionId}</p>
                        <p>Your policy is now active until the next due date.</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendKycSubmittedEmailToAdminAsync(string fullName, string email, CancellationToken cancellationToken)
    {
        var subject = "New KYC Submission - Action Required";
        var adminEmail = _configuration["EmailSettings:AdminEmail"] ?? "admin@claimcore.com";
        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #22D3EE, #06b6d4); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>New KYC Submission</h1>
                    </div>
                    <div class='content'>
                        <h2>Action Required</h2>
                        <p>A user has submitted KYC documents for verification.</p>
                        <p><strong>User:</strong> {fullName}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <a href='https://yourdomain.com/admin/kyc' class='button'>Review KYC →</a>
                    </div>
                </div>
            </body>
            </html>
        ";

        await SendEmailAsync(adminEmail, subject, body, cancellationToken);
    }

    public async Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken)
    {
        var subject = "Your Verification Code - ClaimCore Insurance";
        var body = $@"
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #22D3EE, #06b6d4); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }}
                .otp-code {{ font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Verification Code</h1>
                </div>
                <div class='content'>
                    <h2>Dear {fullName},</h2>
                    <p>Please use the following verification code to complete your KYC:</p>
                    <div class='otp-code'>{otp}</div>
                    <p>This code will expire in <strong>5 minutes</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
                <div class='footer'>
                    <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPolicyLapsedEmailAsync(string toEmail, string fullName, string policyNumber, decimal outstandingAmount, CancellationToken cancellationToken)
    {
        var subject = $"Policy Lapsed - {policyNumber}";
        var body = $@"
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Policy Lapsed</h1>
                </div>
                <div class='content'>
                    <h2>Dear {fullName},</h2>
                    <p>Your insurance policy <strong>{policyNumber}</strong> has been lapsed due to pending premium payments.</p>
                    <p><strong>Outstanding Amount:</strong> ₹{outstandingAmount:N2}</p>
                    <p>Please contact support or initiate reinstatement to restore your coverage.</p>
                    <a href='https://yourdomain.com/policy/reinstate' class='button'>Reinstate Policy →</a>
                    <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                </div>
                <div class='footer'>
                    <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendClaimSettlementEmailAsync(string toEmail, string fullName, string claimNumber, decimal amount, string paymentReference, CancellationToken cancellationToken)
    {
        var subject = "Claim Settled Successfully - ClaimCore Insurance";
        var body = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <div style='background: linear-gradient(135deg, #22D3EE, #06B6D4); padding: 20px; text-align: center;'>
                <h2 style='color: #0B1220; margin: 0;'>Claim Settlement Confirmation</h2>
            </div>
            <div style='background: #111827; padding: 30px; border: 1px solid #1F2937;'>
                <p style='color: #FFFFFF; font-size: 16px;'>Dear {fullName},</p>
                <p style='color: #9CA3AF;'>Your claim has been successfully settled. The details are as follows:</p>
                <table style='width: 100%; margin: 20px 0; border-collapse: collapse;'>
                    <tr style='border-bottom: 1px solid #1F2937;'>
                        <td style='padding: 10px 0; color: #9CA3AF;'>Claim Number:</td>
                        <td style='padding: 10px 0; color: #22D3EE; font-weight: bold;'>{claimNumber}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #1F2937;'>
                        <td style='padding: 10px 0; color: #9CA3AF;'>Settled Amount:</td>
                        <td style='padding: 10px 0; color: #10B981; font-weight: bold;'>₹{amount:N2}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #1F2937;'>
                        <td style='padding: 10px 0; color: #9CA3AF;'>Payment Reference:</td>
                        <td style='padding: 10px 0; color: #FFFFFF;'>{paymentReference}</td>
                    </tr>
                </table>
                <p style='color: #9CA3AF;'>The amount will be credited to your registered bank account within 2-3 business days.</p>
                <div style='margin-top: 30px; text-align: center;'>
                    <a href='https://claimcore.com/app/claims/{claimNumber}' style='background: #22D3EE; color: #0B1220; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>View Claim Details</a>
                </div>
            </div>
            <div style='background: #0F172A; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;'>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; {DateTime.UtcNow.Year} ClaimCore Insurance. All rights reserved.</p>
            </div>
        </div>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendGstInvoiceEmailAsync(string toEmail, string fullName, string invoiceNumber, decimal amount, byte[] pdfAttachment, CancellationToken cancellationToken)
    {
        var subject = $"GST Invoice #{invoiceNumber} - ClaimCore Insurance";
        var body = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <div style='background: linear-gradient(135deg, #22D3EE, #06B6D4); padding: 20px; text-align: center;'>
                <h2 style='color: #0B1220; margin: 0;'>GST Invoice</h2>
            </div>
            <div style='background: #111827; padding: 30px; border: 1px solid #1F2937;'>
                <p style='color: #FFFFFF; font-size: 16px;'>Dear {fullName},</p>
                <p style='color: #9CA3AF;'>Thank you for your payment. Please find attached your GST invoice.</p>
                <table style='width: 100%; margin: 20px 0; border-collapse: collapse;'>
                    <tr style='border-bottom: 1px solid #1F2937;'>
                        <td style='padding: 10px 0; color: #9CA3AF;'>Invoice Number:</td>
                        <td style='padding: 10px 0; color: #22D3EE; font-weight: bold;'>{invoiceNumber}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #1F2937;'>
                        <td style='padding: 10px 0; color: #9CA3AF;'>Invoice Date:</td>
                        <td style='padding: 10px 0; color: #FFFFFF;'>{DateTime.UtcNow:dd MMM yyyy}</td>
                    </tr>
                    <tr style='border-bottom: 1px solid #1F2937;'>
                        <td style='padding: 10px 0; color: #9CA3AF;'>Total Amount:</td>
                        <td style='padding: 10px 0; color: #10B981; font-weight: bold;'>₹{amount:N2}</td>
                    </tr>
                </table>
                <p style='color: #9CA3AF;'>Please find the attached PDF for your records.</p>
                <div style='margin-top: 30px; text-align: center;'>
                    <a href='#' style='background: #22D3EE; color: #0B1220; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>Download Invoice</a>
                </div>
            </div>
            <div style='background: #0F172A; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;'>
                <p>This is a system-generated invoice. It is valid without signature.</p>
                <p>&copy; {DateTime.UtcNow.Year} ClaimCore Insurance. All rights reserved.</p>
            </div>
        </div>";

        await SendEmailWithAttachmentAsync(toEmail, subject, body, pdfAttachment, $"Invoice_{invoiceNumber}.pdf", cancellationToken);
    }

    // ✅ FIXED: Core email sending method
    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Sending email to: {toEmail}");

            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_configuration["EmailSettings:FromEmail"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            using var smtp = new SmtpClient();

            // Bypass SSL certificate validation for development
            smtp.ServerCertificateValidationCallback = (s, c, h, e) => true;

            await smtp.ConnectAsync(
                _configuration["EmailSettings:SmtpServer"],
                int.Parse(_configuration["EmailSettings:SmtpPort"]),
                SecureSocketOptions.StartTls,
                cancellationToken);

            await smtp.AuthenticateAsync(
                _configuration["EmailSettings:Username"],
                _configuration["EmailSettings:Password"],
                cancellationToken);

            await smtp.SendAsync(email, cancellationToken);
            await smtp.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation($"Email sent successfully to {toEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Failed to send email to {toEmail}. Error: {ex.Message}");
            throw;
        }
    }

    // ✅ FIXED: Email with attachment - Now uses configuration instead of undefined variables
    private async Task SendEmailWithAttachmentAsync(string toEmail, string subject, string htmlBody, byte[] attachment, string attachmentName, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation($"Sending email with attachment to: {toEmail}");

            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_configuration["EmailSettings:FromEmail"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder();
            builder.HtmlBody = htmlBody;
            builder.Attachments.Add(attachmentName, attachment);
            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();

            // Bypass SSL certificate validation for development
            smtp.ServerCertificateValidationCallback = (s, c, h, e) => true;

            await smtp.ConnectAsync(
                _configuration["EmailSettings:SmtpServer"],
                int.Parse(_configuration["EmailSettings:SmtpPort"]),
                SecureSocketOptions.StartTls,
                cancellationToken);

            await smtp.AuthenticateAsync(
                _configuration["EmailSettings:Username"],
                _configuration["EmailSettings:Password"],
                cancellationToken);

            await smtp.SendAsync(email, cancellationToken);
            await smtp.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation($"Email with attachment sent successfully to {toEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Failed to send email with attachment to {toEmail}. Error: {ex.Message}");
            throw;
        }
    }
}