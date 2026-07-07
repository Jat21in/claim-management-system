using CMS.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace CMS.Application.Services;

public sealed class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly EmailLinkService _linkService;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger, EmailLinkService linkService)
    {
        _configuration = configuration;
        _logger = logger;
        _linkService = linkService;
    }

    #region Core Email Methods

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var username = emailSettings["Username"];
            var password = emailSettings["Password"];
            var fromEmail = emailSettings["FromEmail"] ?? "noreply@claimcore.com";
            var fromName = emailSettings["FromName"] ?? "ClaimCore Insurance";

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Email credentials not configured. Skipping email send.");
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;
            message.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.StartTls, cancellationToken);
            await client.AuthenticateAsync(username, password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }

    private async Task SendEmailWithAttachmentAsync(string toEmail, string subject, string htmlBody, byte[] attachment, string attachmentName, CancellationToken cancellationToken)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var username = emailSettings["Username"];
            var password = emailSettings["Password"];
            var fromEmail = emailSettings["FromEmail"] ?? "noreply@claimcore.com";
            var fromName = emailSettings["FromName"] ?? "ClaimCore Insurance";

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Email credentials not configured. Skipping email send.");
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder();
            builder.HtmlBody = htmlBody;
            builder.Attachments.Add(attachmentName, attachment);
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.StartTls, cancellationToken);
            await client.AuthenticateAsync(username, password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email with attachment sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email with attachment to {Email}", toEmail);
            throw;
        }
    }

    #endregion

    #region IEmailService Implementation

    public async Task SendPasswordResetOtpAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken)
    {
        var subject = "🔐 Password Reset OTP - ClaimCore";
        var dashboardLink = _linkService.GetDashboardLink();

        var body = $@"
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #0B1220; color: #E5E7EB; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 30px; background: #1a2332; border-radius: 12px; }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .header h1 {{ color: #22D3EE; font-size: 28px; }}
                    .otp-box {{ background: #0B1220; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 12px; border-radius: 8px; border: 2px solid #22D3EE; color: #22D3EE; margin: 25px 0; }}
                    .info {{ color: #9CA3AF; font-size: 14px; line-height: 1.6; }}
                    .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #2a3a4a; color: #6B7280; font-size: 12px; text-align: center; }}
                    .highlight {{ color: #22D3EE; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🔐 Password Reset</h1>
                    </div>
                    <p>Hello <strong>{fullName}</strong>,</p>
                    <p>We received a request to reset your password for your ClaimCore account.</p>
                    <p>Use the OTP below to reset your password:</p>
                    <div class='otp-box'>{otp}</div>
                    <div class='info'>
                        <p>⏰ This OTP is valid for <span class='highlight'>15 minutes</span>.</p>
                        <p>🔒 If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class='footer'>
                        <p>ClaimCore Insurance • Secure & Trusted</p>
                        <p><a href='{dashboardLink}' style='color: #22D3EE;'>Go to Dashboard</a></p>
                        <p>© {DateTime.Now.Year} ClaimCore. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendClaimStatusUpdateEmailAsync(
        string toEmail,
        string fullName,
        string claimId,
        decimal amount,
        DateTime claimDate,
        string description,
        string status,
        double? aiConfidenceScore,
        string aiDecision,
        string aiReasoning,
        CancellationToken cancellationToken)
    {
        var (statusColor, statusIconSvg, statusBgColor, nextSteps) = status.ToLower() switch
        {
            "approved" => (
                "#10B981",
                GetCheckCircleIcon(),
                "#F0FDF4",
                "The approved amount will be credited to your registered bank account within 2-3 business days."),
            "rejected" => (
                "#EF4444",
                GetXCircleIcon(),
                "#FEF2F2",
                "Please review the rejection reason above. If you believe this is an error, please contact our support team."),
            "pendingai" => (
                "#F59E0B",
                GetClockIcon(),
                "#FFFBEB",
                "Our AI is analyzing your claim. You will receive another email once the review is complete."),
            "paid" => (
                "#10B981",
                GetBanknoteIcon(),
                "#F0FDF4",
                "The settlement amount has been credited to your registered bank account."),
            _ => (
                "#6B7280",
                GetFileTextIcon(),
                "#F9FAFB",
                "Your claim is being processed. We'll update you soon.")
        };

        var subject = status.ToLower() switch
        {
            "approved" => $"CLAIM APPROVED - ClaimCore Insurance",
            "rejected" => $"CLAIM DECISION - ClaimCore Insurance",
            "pendingai" => $"UNDER REVIEW - ClaimCore Insurance",
            "paid" => $"CLAIM SETTLED - ClaimCore Insurance",
            _ => $"STATUS UPDATE - ClaimCore Insurance"
        };

        var claimDetailsLink = _linkService.GetClaimDetailsLink(claimId);
        var dashboardLink = _linkService.GetDashboardLink();

        var formattedClaimId = claimId.Length > 8 ? claimId.Substring(0, 8) + "..." : claimId;
        var formattedDate = claimDate.ToString("dd MMMM yyyy");
        var formattedAmount = $"₹{amount:N2}";
        var truncatedDescription = description?.Length > 100 ? description.Substring(0, 100) + "..." : description ?? "No description provided";

        var confidenceScoreHtml = "";
        if (aiConfidenceScore.HasValue)
        {
            var score = (int)aiConfidenceScore.Value;
            var barWidth = score;
            var barColor = score >= 70 ? "#10B981" : (score >= 40 ? "#F59E0B" : "#EF4444");

            confidenceScoreHtml = $@"
                <div style='margin-bottom: 16px;'>
                    <div style='display: flex; justify-content: space-between; margin-bottom: 8px;'>
                        <span style='color: #6B7280; font-size: 14px;'>AI Confidence Score</span>
                        <span style='color: {barColor}; font-weight: 600;'>{score}%</span>
                    </div>
                    <div style='background: #E5E7EB; height: 8px; border-radius: 4px; overflow: hidden;'>
                        <div style='background: {barColor}; width: {barWidth}%; height: 100%; border-radius: 4px;'></div>
                    </div>
                </div>";
        }

        var aiReasoningHtml = "";
        if (!string.IsNullOrEmpty(aiReasoning))
        {
            aiReasoningHtml = $@"
                <div style='background: #F0F9FF; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid {statusColor};'>
                    <div style='display: flex; align-items: center; gap: 12px; margin-bottom: 12px;'>
                        {GetBrainIcon()}
                        <span style='color: #0284C7; font-weight: 600;'>AI Verification Insights</span>
                    </div>
                    <p style='color: #374151; font-size: 14px; line-height: 1.6; margin: 0;'>{aiReasoning}</p>
                </div>";
        }

        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>{subject}</title>
                <style>
                    @media only screen and (max-width: 600px) {{
                        .container {{ width: 100% !important; padding: 10px !important; }}
                        .content {{ padding: 20px !important; }}
                    }}
                </style>
            </head>
            <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F3F4F6; line-height: 1.5;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    
                    <!-- Header -->
                    <div style='background: linear-gradient(135deg, #0891B2, #06B6D4); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;'>
                        {GetShieldIcon()}
                        <h1 style='color: #FFFFFF; margin: 12px 0 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;'>ClaimCore Insurance</h1>
                        <p style='color: #E0F2FE; opacity: 0.9; margin: 8px 0 0; font-size: 14px;'>Smart Claims, Faster Settlements</p>
                    </div>
                    
                    <!-- Status Banner -->
                    <div style='background: {statusBgColor}; padding: 20px 24px; text-align: center; border-bottom: 1px solid #E5E7EB;'>
                        <div style='display: inline-block;'>{statusIconSvg}</div>
                        <h2 style='color: {statusColor}; margin: 12px 0 0; font-size: 22px; font-weight: 700; letter-spacing: 1px;'>CLAIM {status.ToUpper()}</h2>
                    </div>
                    
                    <!-- Content -->
                    <div style='background: #FFFFFF; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #E5E7EB; border-top: none;'>
                        
                        <p style='color: #111827; font-size: 16px; margin-bottom: 24px;'>Dear <strong style='color: #0891B2;'>{fullName}</strong>,</p>
                        
                        <div style='background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #E5E7EB;'>
                            <p style='color: #4B5563; margin: 0;'>
                                Your claim has been <strong style='color: {statusColor}; text-transform: uppercase;'>{status}</strong>.
                            </p>
                        </div>
                        
                        <div style='background: #F9FAFB; border-radius: 12px; overflow: hidden; margin-bottom: 24px; border: 1px solid #E5E7EB;'>
                            <div style='background: #F3F4F6; padding: 14px 20px; border-bottom: 1px solid #E5E7EB;'>
                                <div style='display: flex; align-items: center; gap: 8px;'>
                                    {GetFileTextIcon()}
                                    <span style='color: #374151; font-weight: 600;'>Claim Details</span>
                                </div>
                            </div>
                            <table style='width: 100%; border-collapse: collapse;'>
                                <tr style='border-bottom: 1px solid #E5E7EB;'>
                                    <td style='padding: 14px 20px; color: #6B7280; width: 40%;'>Claim ID:</td>
                                    <td style='padding: 14px 20px; color: #111827; font-family: 'Courier New', monospace; font-size: 14px;'>{formattedClaimId}</td>
                                 </tr>
                                <tr style='border-bottom: 1px solid #E5E7EB;'>
                                    <td style='padding: 14px 20px; color: #6B7280;'>Amount:</td>
                                    <td style='padding: 14px 20px; color: #10B981; font-weight: 700;'>{formattedAmount}</td>
                                 </tr>
                                <tr style='border-bottom: 1px solid #E5E7EB;'>
                                    <td style='padding: 14px 20px; color: #6B7280;'>Submission Date:</td>
                                    <td style='padding: 14px 20px; color: #111827;'>{formattedDate}</td>
                                 </tr>
                                <tr>
                                    <td style='padding: 14px 20px; color: #6B7280; vertical-align: top;'>Description:</td>
                                    <td style='padding: 14px 20px; color: #4B5563;'>""{truncatedDescription}""</td>
                                 </tr>
                            </table>
                        </div>
                        
                        {aiReasoningHtml}
                        {confidenceScoreHtml}
                        
                        <div style='background: #F0F9FF; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #BAE6FD;'>
                            <div style='display: flex; align-items: center; gap: 12px; margin-bottom: 12px;'>
                                {GetFlagIcon()}
                                <span style='color: #0369A1; font-weight: 600;'>Next Steps</span>
                            </div>
                            <p style='color: #075985; margin: 0; font-size: 14px; line-height: 1.6;'>{nextSteps}</p>
                        </div>
                        
                        <div style='text-align: center; margin-bottom: 28px;'>
                            <a href='{claimDetailsLink}' 
                               style='display: inline-block; background: #0891B2; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;'>
                                Access Claim Dashboard
                            </a>
                        </div>
                        
                        <div style='background: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #E5E7EB;'>
                            <p style='color: #6B7280; font-size: 12px; margin: 0;'>
                                Need assistance? Contact our support team at <a href='mailto:support@claimcore.com' style='color: #0891B2; text-decoration: none;'>support@claimcore.com</a>
                            </p>
                        </div>
                    </div>
                    
                    <div style='background: #F3F4F6; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #E5E7EB; border-top: none;'>
                        <p style='color: #9CA3AF; font-size: 12px; margin: 0;'>
                            This is an automated transactional message. Please do not reply directly to this email.
                        </p>
                        <p style='color: #9CA3AF; font-size: 12px; margin: 12px 0 0;'>
                            <a href='{dashboardLink}' style='color: #0891B2;'>Go to Dashboard</a>
                        </p>
                        <p style='color: #9CA3AF; font-size: 12px; margin: 12px 0 0;'>
                            © {DateTime.UtcNow.Year} ClaimCore Insurance. All rights reserved.
                        </p>
                    </div>
                    
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendKycApprovedEmailAsync(string toEmail, string fullName, CancellationToken cancellationToken)
    {
        var subject = "Your KYC has been approved! - ClaimCore Insurance";
        var dashboardLink = _linkService.GetDashboardLink();
        var policyLink = _linkService.GetPolicyLink();
        var claimsLink = _linkService.GetClaimsLink();

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
                        <h1>✅ KYC Approved!</h1>
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
                        <div style='text-align: center;'>
                            <a href='{dashboardLink}' class='button'>Go to Dashboard →</a>
                        </div>
                        <p style='margin-top: 20px;'>Thank you for choosing ClaimCore!</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p><a href='{policyLink}'>Browse Plans</a> | <a href='{claimsLink}'>Submit Claim</a></p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendKycRejectedEmailAsync(string toEmail, string fullName, string reason, CancellationToken cancellationToken)
    {
        var subject = "Action Required: KYC Verification Failed - ClaimCore Insurance";
        var kycLink = _linkService.GetKycLink();

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
                        <a href='{kycLink}' class='button'>Re-upload Documents →</a>
                        <p>If you have any questions, please contact our support team.</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendKycSubmittedEmailToAdminAsync(string fullName, string email, CancellationToken cancellationToken)
    {
        var subject = "New KYC Submission - Action Required";
        var adminEmail = _configuration["EmailSettings:AdminEmail"] ?? "admin@claimcore.com";
        var adminKycLink = $"{_linkService.GetDashboardLink()}/admin/kyc";

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
                        <a href='{adminKycLink}' class='button'>Review KYC →</a>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(adminEmail, subject, body, cancellationToken);
    }

    public async Task SendPremiumReminderEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, DateTime dueDate, CancellationToken cancellationToken)
    {
        var subject = $"Premium Reminder: Payment Due on {dueDate:MMMM dd, yyyy} - ClaimCore Insurance";
        var paymentLink = _linkService.GetPaymentLink();
        var dashboardLink = _linkService.GetDashboardLink();
        var policyLink = _linkService.GetPolicyLink();

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
                        <div style='text-align: center;'>
                            <a href='{paymentLink}' class='button'>Pay Now →</a>
                        </div>
                        <div style='text-align: center; margin-top: 16px;'>
                            <a href='{dashboardLink}' style='color: #22D3EE;'>Go to Dashboard</a>
                        </div>
                        <p style='margin-top: 20px;'>Please ensure timely payment to avoid policy lapse.</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p><a href='{policyLink}'>View Policy Details</a></p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPolicyCreatedEmailAsync(string toEmail, string fullName, string policyNumber, CancellationToken cancellationToken)
    {
        var subject = "Your Insurance Policy is Active! - ClaimCore Insurance";
        var policyLink = _linkService.GetPolicyLink();
        var dashboardLink = _linkService.GetDashboardLink();

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
                        <div style='text-align: center;'>
                            <a href='{policyLink}' class='button'>View Policy Details →</a>
                        </div>
                        <p>Stay protected with ClaimCore!</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p><a href='{dashboardLink}'>Go to Dashboard</a></p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPaymentConfirmationEmailAsync(string toEmail, string fullName, string policyNumber, decimal amount, string transactionId, CancellationToken cancellationToken)
    {
        var subject = "Payment Confirmation - ClaimCore Insurance";
        var dashboardLink = _linkService.GetDashboardLink();
        var policyLink = _linkService.GetPolicyLink();

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
                        <div style='text-align: center; margin-top: 20px;'>
                            <a href='{policyLink}' style='background: #22D3EE; color: #0B1220; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>View Policy</a>
                        </div>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p><a href='{dashboardLink}'>Go to Dashboard</a></p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken)
    {
        var subject = "Your Verification Code - ClaimCore Insurance";
        var dashboardLink = _linkService.GetDashboardLink();

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
                        <p><a href='{dashboardLink}'>Go to Dashboard</a></p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendPolicyLapsedEmailAsync(string toEmail, string fullName, string policyNumber, decimal outstandingAmount, CancellationToken cancellationToken)
    {
        var subject = $"Policy Lapsed - {policyNumber}";
        var reinstateLink = _linkService.GetReinstateLink();
        var dashboardLink = _linkService.GetDashboardLink();
        var paymentLink = _linkService.GetPaymentLink();

        var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; }}
                    .content {{ background: #f9fafb; padding: 30px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #22D3EE; color: #0B1220; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .button-danger {{ background: #ef4444; color: white; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>⚠️ Policy Lapsed</h1>
                    </div>
                    <div class='content'>
                        <h2>Dear {fullName},</h2>
                        <p>Your insurance policy <strong>{policyNumber}</strong> has been lapsed due to pending premium payments.</p>
                        <p><strong>Outstanding Amount:</strong> ₹{outstandingAmount:N2}</p>
                        <p>To reinstate your policy, please:</p>
                        <ol>
                            <li>Pay the outstanding amount</li>
                            <li>Pay the reinstatement fee</li>
                        </ol>
                        <div style='text-align: center;'>
                            <a href='{reinstateLink}' class='button'>Reinstate Policy →</a>
                        </div>
                        <div style='text-align: center; margin-top: 16px;'>
                            <a href='{paymentLink}' class='button' style='background: #ef4444;'>Pay Now</a>
                        </div>
                        <p style='margin-top: 20px;'>For any questions, please contact our support team.</p>
                        <p>Best regards,<br><strong>ClaimCore Insurance Team</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2026 ClaimCore Insurance. All rights reserved.</p>
                        <p><a href='{dashboardLink}'>Go to Dashboard</a></p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendClaimSettlementEmailAsync(string toEmail, string fullName, string claimNumber, decimal amount, string paymentReference, CancellationToken cancellationToken)
    {
        var subject = "Claim Settled Successfully - ClaimCore Insurance";
        var claimDetailsLink = _linkService.GetClaimDetailsLink(claimNumber);
        var dashboardLink = _linkService.GetDashboardLink();
        var settlementLetterLink = _linkService.GetSettlementLetterLink(claimNumber);

        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #22D3EE, #06B6D4); padding: 20px; text-align: center;'>
                    <h2 style='color: #0B1220; margin: 0;'>Claim Settlement Confirmation</h2>
                </div>
                <div style='background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB;'>
                    <p style='color: #111827; font-size: 16px;'>Dear {fullName},</p>
                    <p style='color: #4B5563;'>Your claim has been successfully settled. The details are as follows:</p>
                    <table style='width: 100%; margin: 20px 0; border-collapse: collapse;'>
                        <tr style='border-bottom: 1px solid #E5E7EB;'>
                            <td style='padding: 10px 0; color: #6B7280;'>Claim Number:</td>
                            <td style='padding: 10px 0; color: #0891B2; font-weight: bold;'>{claimNumber}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #E5E7EB;'>
                            <td style='padding: 10px 0; color: #6B7280;'>Settled Amount:</td>
                            <td style='padding: 10px 0; color: #10B981; font-weight: bold;'>₹{amount:N2}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px 0; color: #6B7280;'>Payment Reference:</td>
                            <td style='padding: 10px 0; color: #111827;'>{paymentReference}</td>
                        </tr>
                    </table>
                    <p style='color: #4B5563;'>The amount will be credited to your registered bank account within 2-3 business days.</p>
                    <div style='margin-top: 30px; text-align: center;'>
                        <a href='{claimDetailsLink}' style='background: #0891B2; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>View Claim Details</a>
                    </div>
                    <div style='margin-top: 16px; text-align: center;'>
                        <a href='{settlementLetterLink}' style='color: #0891B2;'>Download Settlement Letter</a>
                    </div>
                </div>
                <div style='background: #F3F4F6; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;'>
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p><a href='{dashboardLink}' style='color: #0891B2;'>Go to Dashboard</a></p>
                    <p>&copy; {DateTime.UtcNow.Year} ClaimCore Insurance. All rights reserved.</p>
                </div>
            </div>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendGstInvoiceEmailAsync(string toEmail, string fullName, string invoiceNumber, decimal amount, byte[] pdfAttachment, CancellationToken cancellationToken)
    {
        var subject = $"GST Invoice #{invoiceNumber} - ClaimCore Insurance";
        var dashboardLink = _linkService.GetDashboardLink();
        var invoiceLink = _linkService.GetGstInvoiceLink(invoiceNumber);

        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #22D3EE, #06B6D4); padding: 20px; text-align: center;'>
                    <h2 style='color: #0B1220; margin: 0;'>GST Invoice</h2>
                </div>
                <div style='background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB;'>
                    <p style='color: #111827; font-size: 16px;'>Dear {fullName},</p>
                    <p style='color: #4B5563;'>Thank you for your payment. Please find attached your GST invoice.</p>
                    <table style='width: 100%; margin: 20px 0; border-collapse: collapse;'>
                        <tr style='border-bottom: 1px solid #E5E7EB;'>
                            <td style='padding: 10px 0; color: #6B7280;'>Invoice Number:</td>
                            <td style='padding: 10px 0; color: #0891B2; font-weight: bold;'>{invoiceNumber}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #E5E7EB;'>
                            <td style='padding: 10px 0; color: #6B7280;'>Invoice Date:</td>
                            <td style='padding: 10px 0; color: #111827;'>{DateTime.UtcNow:dd MMM yyyy}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #E5E7EB;'>
                            <td style='padding: 10px 0; color: #6B7280;'>Total Amount:</td>
                            <td style='padding: 10px 0; color: #10B981; font-weight: bold;'>₹{amount:N2}</td>
                        </tr>
                    </table>
                    <p style='color: #4B5563;'>Please find the attached PDF for your records.</p>
                    <div style='margin-top: 20px; text-align: center;'>
                        <a href='{invoiceLink}' style='color: #0891B2;'>Download Invoice</a>
                    </div>
                </div>
                <div style='background: #F3F4F6; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;'>
                    <p>This is a system-generated invoice. It is valid without signature.</p>
                    <p><a href='{dashboardLink}' style='color: #0891B2;'>Go to Dashboard</a></p>
                    <p>&copy; {DateTime.UtcNow.Year} ClaimCore Insurance. All rights reserved.</p>
                </div>
            </div>";

        await SendEmailWithAttachmentAsync(toEmail, subject, body, pdfAttachment, $"Invoice_{invoiceNumber}.pdf", cancellationToken);
    }

    #endregion

    #region SVG Icon Helpers

    private static string GetCheckCircleIcon()
    {
        return @"<svg width='48' height='48' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='12' cy='12' r='10' stroke='#10B981' stroke-width='2'/>
            <path d='M8 12L11 15L16 9' stroke='#10B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        </svg>";
    }

    private static string GetXCircleIcon()
    {
        return @"<svg width='48' height='48' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='12' cy='12' r='10' stroke='#EF4444' stroke-width='2'/>
            <path d='M15 9L9 15M9 9L15 15' stroke='#EF4444' stroke-width='2' stroke-linecap='round'/>
        </svg>";
    }

    private static string GetClockIcon()
    {
        return @"<svg width='48' height='48' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='12' cy='12' r='10' stroke='#F59E0B' stroke-width='2'/>
            <path d='M12 8V12L15 15' stroke='#F59E0B' stroke-width='2' stroke-linecap='round'/>
        </svg>";
    }

    private static string GetBanknoteIcon()
    {
        return @"<svg width='48' height='48' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <rect x='2' y='6' width='20' height='12' rx='2' stroke='#10B981' stroke-width='2'/>
            <circle cx='12' cy='12' r='2' fill='#10B981'/>
            <path d='M6 12H8M16 12H18' stroke='#10B981' stroke-width='2' stroke-linecap='round'/>
        </svg>";
    }

    private static string GetFileTextIcon()
    {
        return @"<svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M4 4H20V20H4V4Z' stroke='#374151' stroke-width='1.5'/>
            <path d='M8 8H16M8 12H16M8 16H12' stroke='#374151' stroke-width='1.5' stroke-linecap='round'/>
        </svg>";
    }

    private static string GetShieldIcon()
    {
        return @"<svg width='40' height='40' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' style='margin: 0 auto;'>
            <path d='M12 2L3 6V12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12V6L12 2Z' stroke='#FFFFFF' stroke-width='1.5' fill='rgba(255, 255, 255, 0.2)'/>
            <path d='M12 7V12M12 16H12.01' stroke='#FFFFFF' stroke-width='1.5' stroke-linecap='round'/>
        </svg>";
    }

    private static string GetBrainIcon()
    {
        return @"<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M12 4C8 4 6 6 6 8C6 10 8 12 12 12C16 12 18 10 18 8C18 6 16 4 12 4Z' stroke='#0284C7' stroke-width='1.5' fill='rgba(2, 132, 199, 0.1)'/>
            <path d='M7 12C4 12 3 14 3 16C3 18 5 19 7 19' stroke='#0284C7' stroke-width='1.5'/>
            <path d='M17 12C20 12 21 14 21 16C21 18 19 19 17 19' stroke='#0284C7' stroke-width='1.5'/>
            <path d='M9 19V15M15 19V15' stroke='#0284C7' stroke-width='1.5' stroke-linecap='round'/>
            <circle cx='9' cy='17' r='1' fill='#0284C7'/>
            <circle cx='15' cy='17' r='1' fill='#0284C7'/>
        </svg>";
    }

    private static string GetFlagIcon()
    {
        return @"<svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M4 3V21' stroke='#0369A1' stroke-width='1.5' stroke-linecap='round'/>
            <path d='M4 3H16L18 8L16 13H4' stroke='#0369A1' stroke-width='1.5' fill='rgba(3, 105, 161, 0.1)'/>
        </svg>";
    }

    #endregion
}