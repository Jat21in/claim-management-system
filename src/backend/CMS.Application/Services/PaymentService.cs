using CMS.Application.DTOs.Payment;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CMS.Application.Services;

public sealed class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IPolicyRepository _policyRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly IEmailService _emailService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IPolicyRepository policyRepository,
        IMemberRepository memberRepository,
        IPdfGenerationService pdfGenerationService,
        IEmailService emailService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<PaymentService> logger)
    {
        _paymentRepository = paymentRepository;
        _policyRepository = policyRepository;
        _memberRepository = memberRepository;
        _pdfGenerationService = pdfGenerationService;
        _emailService = emailService;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task<InitiatePaymentResponse> InitiatePaymentAsync(Guid memberId, InitiatePaymentRequest request, CancellationToken cancellationToken)
    {
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
        if (policy == null)
            throw new InvalidOperationException("No active policy found");

        var nextDueDate = policy.GetNextPremiumDueDate();
        var amount = policy.MonthlyPremium;

        var payment = new PremiumPayment(
            policyId: policy.PolicyId,
            amount: amount,
            dueDate: nextDueDate,
            paymentMethod: request.PaymentMethod
        );

        await _paymentRepository.AddAsync(payment, cancellationToken);

        return new InitiatePaymentResponse
        {
            PaymentId = payment.PaymentId,
            Amount = amount,
            DueDate = nextDueDate,
            PaymentUrl = $"/api/payments/mock/{payment.PaymentId}" // Mock URL
        };
    }

    // /src/backend/CMS.Application/Services/PaymentService.cs

    public async Task<PaymentResponse> ProcessMockPaymentAsync(Guid memberId, Guid paymentId, CancellationToken cancellationToken)
    {
        // ✅ Use a fresh scope to avoid tracking conflicts
        using var scope = _serviceScopeFactory.CreateScope();
        var freshPaymentRepo = scope.ServiceProvider.GetRequiredService<IPaymentRepository>();
        var freshPolicyRepo = scope.ServiceProvider.GetRequiredService<IPolicyRepository>();
        var freshMemberRepo = scope.ServiceProvider.GetRequiredService<IMemberRepository>();
        var freshPdfService = scope.ServiceProvider.GetRequiredService<IPdfGenerationService>();
        var freshEmailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        // ✅ Get payment with fresh DbContext
        var payment = await freshPaymentRepo.GetByIdAsync(paymentId, cancellationToken);
        if (payment == null)
            return new PaymentResponse { Success = false, Message = "Payment not found" };

        // ✅ Get policy
        var policy = await freshPolicyRepo.GetByIdAsync(payment.PolicyId, cancellationToken);
        if (policy == null)
            return new PaymentResponse { Success = false, Message = "Policy not found" };

        // ✅ Check authorization
        if (policy.MemberId != memberId)
            return new PaymentResponse { Success = false, Message = "Unauthorized" };

        // ✅ Check if payment is already completed
        if (payment.Status == PaymentStatus.Completed)
            return new PaymentResponse { Success = false, Message = "Payment already processed" };

        // ✅ Generate transaction ID
        var transactionId = $"MOCK_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid().ToString().Substring(0, 8)}";

        // ✅ Mark payment as completed
        payment.MarkCompleted(transactionId, $"receipt_{paymentId}.pdf");
        await freshPaymentRepo.UpdateAsync(payment, cancellationToken);

        // ✅ Update policy with payment info
        policy.RecordPayment(payment.Amount, payment.DueDate);
        await freshPolicyRepo.UpdateAsync(policy, cancellationToken);

        // ✅ Get member for email
        var member = await freshMemberRepo.GetByIdAsync(memberId, cancellationToken);

        // ✅ Generate and send GST invoice
        if (member != null)
        {
            try
            {
                var invoicePdf = await freshPdfService.GenerateGstInvoiceAsync(payment, policy, member, cancellationToken);
                var invoiceNumber = $"INV-{DateTime.Now:yyyyMMdd}-{paymentId.ToString().Substring(0, 8)}";
                await freshEmailService.SendGstInvoiceEmailAsync(member.Email, member.FullName, invoiceNumber, payment.Amount, invoicePdf, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send GST invoice email for payment {PaymentId}", paymentId);
            }
        }

        return new PaymentResponse
        {
            Success = true,
            Message = "Payment processed successfully",
            TransactionId = transactionId
        };
    }
    // /src/backend/CMS.Application/Services/PaymentService.cs

    public async Task<PaymentHistoryResponse> GetPaymentHistoryAsync(Guid memberId, CancellationToken cancellationToken)
    {
        // ✅ Get member's policy
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
        if (policy == null)
        {
            return new PaymentHistoryResponse
            {
                Payments = new List<PaymentRecord>(),
                Summary = new PaymentSummary
                {
                    TotalPayments = 0,
                    TotalAmountPaid = 0,
                    PendingPayments = 0,
                    NextPremiumAmount = 0,
                    NextDueDate = null
                }
            };
        }

        // ✅ Get all payments for this policy
        var payments = await _paymentRepository.GetByPolicyIdAsync(policy.PolicyId, cancellationToken);

        var completedPayments = payments.Where(p => p.Status == PaymentStatus.Completed).ToList();
        var pendingPayments = payments.Where(p => p.Status == PaymentStatus.Pending).ToList();

        // ✅ Calculate next due amount (monthly premium)
        var nextPremiumAmount = policy.MonthlyPremium;
        var nextDueDate = policy.GetNextPremiumDueDate();

        // ✅ Check if current month's premium is already paid
        var currentMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var currentMonthPaid = completedPayments.Any(p => p.PaymentDate >= currentMonthStart);

        if (currentMonthPaid)
        {
            nextDueDate = nextDueDate.AddMonths(1);
        }

        var paymentRecords = payments.Select(p => new PaymentRecord
        {
            PaymentId = p.PaymentId,
            Amount = p.Amount,
            PaymentDate = p.PaymentDate,
            DueDate = p.DueDate,
            Status = p.Status.ToString(),
            PaymentMethod = p.PaymentMethod,
            TransactionId = p.TransactionId,
            ReceiptUrl = p.ReceiptUrl
        }).OrderByDescending(p => p.PaymentDate).ToList();

        return new PaymentHistoryResponse
        {
            Payments = paymentRecords,
            Summary = new PaymentSummary
            {
                TotalPayments = completedPayments.Count,
                TotalAmountPaid = completedPayments.Sum(p => p.Amount),
                PendingPayments = pendingPayments.Count,
                NextPremiumAmount = nextPremiumAmount,
                NextDueDate = nextDueDate
            }
        };
    }
    public async Task CheckOverduePaymentsAndLapsePoliciesAsync(CancellationToken cancellationToken)
    {
        var overduePayments = await _paymentRepository.GetOverduePaymentsAsync(cancellationToken);
        var policiesToLapse = new HashSet<Guid>();

        foreach (var payment in overduePayments)
        {
            if (!policiesToLapse.Contains(payment.PolicyId))
            {
                var policy = await _policyRepository.GetByIdAsync(payment.PolicyId, cancellationToken);
                if (policy != null && policy.Status == PolicyStatus.Active)
                {
                    policy.Lapse();
                    await _policyRepository.UpdateAsync(policy, cancellationToken);
                    policiesToLapse.Add(payment.PolicyId);
                }
            }
        }
    }
}
