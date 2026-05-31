using CMS.Application.DTOs.Payment;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.Enums;

namespace CMS.Application.Services;

public sealed class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IPolicyRepository _policyRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IEmailService _emailService;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IPolicyRepository policyRepository,
        IMemberRepository memberRepository,
        IEmailService emailService)
    {
        _paymentRepository = paymentRepository;
        _policyRepository = policyRepository;
        _memberRepository = memberRepository;
        _emailService = emailService;
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

    public async Task<PaymentResponse> ProcessMockPaymentAsync(Guid memberId, Guid paymentId, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepository.GetByIdAsync(paymentId, cancellationToken);
        if (payment == null)
            throw new InvalidOperationException("Payment not found");

        var policy = await _policyRepository.GetByIdAsync(payment.PolicyId, cancellationToken);
        if (policy == null || policy.MemberId != memberId)
            throw new InvalidOperationException("Unauthorized");

        // Generate mock transaction ID
        var transactionId = $"MOCK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 6)}";
        var receiptUrl = $"/uploads/receipts/{transactionId}.pdf";

        payment.MarkCompleted(transactionId, receiptUrl);
        await _paymentRepository.UpdateAsync(payment, cancellationToken);

        // Send confirmation email
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member != null)
        {
            await _emailService.SendPaymentConfirmationEmailAsync(
                member.Email,
                member.FullName,
                policy.PolicyNumber,
                payment.Amount,
                transactionId,
                cancellationToken);
        }

        return new PaymentResponse
        {
            PaymentId = paymentId,
            Success = true,
            Message = "Payment processed successfully",
            TransactionId = transactionId
        };
    }

    public async Task<PaymentHistoryResponse> GetPaymentHistoryAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
        if (policy == null)
            return new PaymentHistoryResponse();

        var payments = await _paymentRepository.GetByPolicyIdAsync(policy.PolicyId, cancellationToken);

        var response = new PaymentHistoryResponse
        {
            Payments = payments.Select(p => new PaymentRecord
            {
                PaymentId = p.PaymentId,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                DueDate = p.DueDate,
                Status = p.Status.ToString(),
                PaymentMethod = p.PaymentMethod,
                TransactionId = p.TransactionId,
                ReceiptUrl = p.ReceiptUrl
            }).ToList(),
            Summary = new PaymentSummary
            {
                TotalPayments = payments.Count(p => p.Status == PaymentStatus.Completed),
                TotalAmountPaid = payments.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                PendingPayments = payments.Count(p => p.Status == PaymentStatus.Pending),
                NextPremiumAmount = policy.MonthlyPremium,
                NextDueDate = policy.GetNextPremiumDueDate()
            }
        };

        return response;
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
