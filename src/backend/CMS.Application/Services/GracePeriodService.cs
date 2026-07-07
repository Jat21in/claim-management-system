using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CMS.Application.Services;

public sealed class GracePeriodService : IGracePeriodService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IPolicyRepository _policyRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<GracePeriodService> _logger;

    private const int GRACE_PERIOD_DAYS = 15;
    private const int LAPSE_DAYS = 30;
    private const int REINSTATEMENT_WINDOW_DAYS = 180;
    private const decimal LATE_FEE_PERCENTAGE = 0.05m; // 5% late fee
    private const decimal REINSTATEMENT_FEE = 500; // Fixed fee for reinstatement

    public GracePeriodService(
        IPaymentRepository paymentRepository,
        IPolicyRepository policyRepository,
        IEmailService emailService,
        ILogger<GracePeriodService> logger)
    {
        _paymentRepository = paymentRepository;
        _policyRepository = policyRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task CheckAndUpdateOverduePaymentsAsync(CancellationToken cancellationToken)
    {
        var overduePayments = await _paymentRepository.GetOverduePaymentsAsync(cancellationToken);

        foreach (var payment in overduePayments)
        {
            var daysOverdue = (DateTime.UtcNow - payment.DueDate).Days;
            var policy = payment.Policy;

            if (policy == null) continue;

            // Within grace period (1-15 days overdue)
            if (daysOverdue <= GRACE_PERIOD_DAYS && daysOverdue > 0)
            {
                // Policy remains active, but add late fee
                if (!payment.TransactionId?.Contains("LATE_FEE") == true)
                {
                    var lateFee = payment.Amount * LATE_FEE_PERCENTAGE;
                    var lateFeePayment = new PremiumPayment(
                        policy.PolicyId,
                        lateFee,
                        DateTime.UtcNow.AddDays(7),
                        "LATE_FEE");
                    await _paymentRepository.AddAsync(lateFeePayment, cancellationToken);

                    await _emailService.SendPremiumReminderEmailAsync(
                        policy.Member.Email,
                        policy.Member.FullName,
                        policy.PolicyNumber,
                        payment.Amount + lateFee,
                        DateTime.UtcNow.AddDays(7),
                        cancellationToken);
                }
            }
            // Lapse period (30+ days overdue)
            else if (daysOverdue >= LAPSE_DAYS)
            {
                await ProcessPolicyLapseAsync(policy.PolicyId, cancellationToken);
            }
        }
    }

    public async Task<PolicyLapseResult> ProcessPolicyLapseAsync(Guid policyId, CancellationToken cancellationToken)
    {
        var result = new PolicyLapseResult();

        try
        {
            // ✅ FIX: Get policy with Member loaded
            var policy = await _policyRepository.GetByIdWithMemberAsync(policyId, cancellationToken);

            if (policy == null)
            {
                result.Message = "Policy not found";
                _logger.LogWarning($"Policy {policyId} not found for lapse processing");
                return result;
            }

            if (policy.Status == PolicyStatus.Lapsed)
            {
                result.Message = "Policy already lapsed";
                _logger.LogInformation($"Policy {policy.PolicyNumber} is already lapsed");
                return result;
            }

            // Get overdue payments
            var allPayments = await _paymentRepository.GetByPolicyIdAsync(policyId, cancellationToken);
            var overduePayments = allPayments?.Where(p => p.Status == PaymentStatus.Pending && p.DueDate < DateTime.UtcNow).ToList() ?? new List<PremiumPayment>();

            var totalOutstanding = overduePayments.Sum(p => p.Amount);
            var daysOverdue = overduePayments.Any() ? (DateTime.UtcNow - overduePayments.Min(p => p.DueDate)).Days : 0;

            result.IsLapsed = true;
            result.LapsedDate = DateTime.UtcNow;
            result.OutstandingAmount = totalOutstanding;
            result.DaysOverdue = daysOverdue;
            result.Message = $"Policy lapsed due to non-payment for {daysOverdue} days";

            policy.Lapse();
            await _policyRepository.UpdateAsync(policy, cancellationToken);

            // ✅ FIX: Now Member is loaded, check if it exists
            if (policy.Member != null && !string.IsNullOrEmpty(policy.Member.Email))
            {
                await _emailService.SendPolicyLapsedEmailAsync(
                    policy.Member.Email,
                    policy.Member.FullName ?? "Valued Customer",
                    policy.PolicyNumber,
                    totalOutstanding,
                    cancellationToken);

                _logger.LogInformation($"✅ Lapse notification sent to {policy.Member.Email}");
            }
            else
            {
                _logger.LogWarning($"❌ Cannot send lapse email for policy {policy.PolicyNumber}: Member or email is null");
                _logger.LogWarning($"   MemberId: {policy.MemberId}, Member object is null: {policy.Member == null}");
            }

            _logger.LogWarning($"Policy {policy.PolicyNumber} lapsed on {DateTime.UtcNow}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing policy lapse for {policyId}");
            result.Message = $"Error: {ex.Message}";
        }

        return result;
    }

    public async Task<PolicyReinstatementResult> ReinstatePolicyAsync(
        Guid policyId,
        bool withMedicalUnderwriting,
        CancellationToken cancellationToken)
    {
        var result = new PolicyReinstatementResult();
        var policy = await _policyRepository.GetByIdAsync(policyId, cancellationToken);

        if (policy == null)
        {
            result.Message = "Policy not found";
            return result;
        }

        var daysSinceLapse = (DateTime.UtcNow - policy.UpdatedAt.GetValueOrDefault()).Days;

        // Check if within reinstatement window (180 days)
        if (daysSinceLapse > REINSTATEMENT_WINDOW_DAYS)
        {
            result.Message = "Reinstatement period has expired. Please purchase a new policy.";
            return result;
        }

        // Check if medical underwriting is required
        result.RequiresMedicalUnderwriting = withMedicalUnderwriting || daysSinceLapse > 90;

        if (result.RequiresMedicalUnderwriting)
        {
            result.Message = "Medical underwriting required for reinstatement. Please submit recent health reports.";
            return result;
        }

        // Calculate reinstatement fee
        var overduePayments = (await _paymentRepository.GetByPolicyIdAsync(policyId, cancellationToken))
            .Where(p => p.Status == PaymentStatus.Pending);

        var totalOutstanding = overduePayments.Sum(p => p.Amount);
        result.ReinstatementFee = totalOutstanding + REINSTATEMENT_FEE;

        // Create reinstatement payment record
        var reinstatementPayment = new PremiumPayment(
            policy.PolicyId,
            result.ReinstatementFee,
            DateTime.UtcNow.AddDays(7),
            "REINSTATEMENT");
        await _paymentRepository.AddAsync(reinstatementPayment, cancellationToken);

        result.IsReinstated = true;
        result.NewExpiryDate = DateTime.UtcNow.AddMonths(12);
        result.Message = "Policy reinstated successfully. Please complete the reinstatement payment.";

        // Update policy status back to Active
        policy.Reinstate();
        await _policyRepository.UpdateAsync(policy, cancellationToken);

        _logger.LogInformation("Policy {PolicyNumber} reinstated on {Date}", policy.PolicyNumber, DateTime.UtcNow);

        return result;
    }

    public async Task SendGracePeriodRemindersAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("=== SendGracePeriodRemindersAsync STARTED ===");

            // ✅ FIX: Get pending payments with Policy AND Member loaded
            var pendingPayments = await _paymentRepository.GetPendingPaymentsWithDetailsAsync(cancellationToken);

            _logger.LogInformation($"Found {pendingPayments?.Count() ?? 0} pending payments");

            if (pendingPayments == null) return;

            foreach (var payment in pendingPayments)
            {
                // ✅ FIX: Check all navigation properties
                if (payment == null || payment.Policy == null || payment.Policy.Member == null)
                {
                    _logger.LogWarning($"Skipping payment with null policy or member: {payment?.PaymentId}");
                    continue;
                }

                var daysUntilDue = (payment.DueDate - DateTime.UtcNow).Days;
                var isOverdue = daysUntilDue < 0;
                var daysOverdue = isOverdue ? Math.Abs(daysUntilDue) : 0;

                // Get email with null check
                var email = payment.Policy.Member?.Email;
                var fullName = payment.Policy.Member?.FullName ?? "Valued Customer";

                if (string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning($"Skipping payment {payment.PaymentId}: Member has no email");
                    continue;
                }

                // Send email based on days until due
                if (isOverdue && daysOverdue <= 30)
                {
                    _logger.LogInformation($"🔴 SENDING OVERDUE reminder to {email} for policy {payment.Policy.PolicyNumber}, {daysOverdue} days overdue");

                    await _emailService.SendPremiumReminderEmailAsync(
                        email,
                        fullName,
                        payment.Policy.PolicyNumber,
                        payment.Amount,
                        payment.DueDate,
                        cancellationToken);
                }
                else if (daysUntilDue == 7 || daysUntilDue == 3 || daysUntilDue == 1)
                {
                    _logger.LogInformation($"📧 Sending reminder to {email} for policy {payment.Policy.PolicyNumber}, due in {daysUntilDue} days");

                    await _emailService.SendPremiumReminderEmailAsync(
                        email,
                        fullName,
                        payment.Policy.PolicyNumber,
                        payment.Amount,
                        payment.DueDate,
                        cancellationToken);
                }
                else
                {
                    _logger.LogInformation($"No reminder needed for {payment.Policy.PolicyNumber} (DaysUntilDue: {daysUntilDue})");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendGracePeriodRemindersAsync");
        }

        _logger.LogInformation("=== SendGracePeriodRemindersAsync COMPLETED ===");
    }
}