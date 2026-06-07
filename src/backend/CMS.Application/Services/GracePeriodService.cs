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
        var policy = await _policyRepository.GetByIdAsync(policyId, cancellationToken);

        if (policy == null || policy.Status == PolicyStatus.Lapsed)
        {
            result.Message = "Policy not found or already lapsed";
            return result;
        }

        var overduePayments = (await _paymentRepository.GetByPolicyIdAsync(policyId, cancellationToken))
            .Where(p => p.Status == PaymentStatus.Pending && p.DueDate < DateTime.UtcNow);

        var totalOutstanding = overduePayments.Sum(p => p.Amount);
        var daysOverdue = (DateTime.UtcNow - overduePayments.Min(p => p.DueDate)).Days;

        result.IsLapsed = true;
        result.LapsedDate = DateTime.UtcNow;
        result.OutstandingAmount = totalOutstanding;
        result.DaysOverdue = daysOverdue;
        result.Message = $"Policy lapsed due to non-payment for {daysOverdue} days";

        policy.Lapse();
        await _policyRepository.UpdateAsync(policy, cancellationToken);

        // Send lapse notification
        await _emailService.SendPolicyLapsedEmailAsync(
            policy.Member.Email,
            policy.Member.FullName,
            policy.PolicyNumber,
            totalOutstanding,
            cancellationToken);

        _logger.LogWarning("Policy {PolicyNumber} lapsed on {Date}", policy.PolicyNumber, DateTime.UtcNow);

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
        var pendingPayments = await _paymentRepository.GetPendingPaymentsAsync(cancellationToken);

        foreach (var payment in pendingPayments)
        {
            var daysUntilDue = (payment.DueDate - DateTime.UtcNow).Days;

            if (daysUntilDue == 7 || daysUntilDue == 3 || daysUntilDue == 1)
            {
                await _emailService.SendPremiumReminderEmailAsync(
                    payment.Policy.Member.Email,
                    payment.Policy.Member.FullName,
                    payment.Policy.PolicyNumber,
                    payment.Amount,
                    payment.DueDate,
                    cancellationToken);
            }
        }
    }
}
