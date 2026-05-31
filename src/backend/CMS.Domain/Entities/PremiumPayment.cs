using CMS.Domain.Enums;

namespace CMS.Domain.Entities;

public sealed class PremiumPayment
{
    public Guid PaymentId { get; private set; }
    public Guid PolicyId { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaymentDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string? PaymentMethod { get; private set; }
    public string? TransactionId { get; private set; }
    public string? ReceiptUrl { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // Navigation
    public Policy? Policy { get; private set; }

    private PremiumPayment() { }

    public PremiumPayment(
        Guid policyId,
        decimal amount,
        DateTime dueDate,
        string? paymentMethod = null)
    {
        PaymentId = Guid.NewGuid();
        PolicyId = policyId;
        Amount = amount;
        DueDate = dueDate;
        PaymentDate = DateTime.UtcNow;
        Status = PaymentStatus.Pending;
        PaymentMethod = paymentMethod;
        CreatedAt = DateTime.UtcNow;
    }

    public void MarkCompleted(string transactionId, string receiptUrl)
    {
        Status = PaymentStatus.Completed;
        TransactionId = transactionId;
        ReceiptUrl = receiptUrl;
        CompletedAt = DateTime.UtcNow;
    }

    public void MarkFailed()
    {
        Status = PaymentStatus.Failed;
        CompletedAt = DateTime.UtcNow;
    }
}
