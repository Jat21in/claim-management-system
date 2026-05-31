namespace CMS.Application.DTOs.Payment;

public sealed class PaymentHistoryResponse
{
    public List<PaymentRecord> Payments { get; init; } = new();
    public PaymentSummary Summary { get; init; } = new();
}

public sealed class PaymentRecord
{
    public Guid PaymentId { get; init; }
    public decimal Amount { get; init; }
    public DateTime PaymentDate { get; init; }
    public DateTime DueDate { get; init; }
    public string Status { get; init; } = null!;
    public string? PaymentMethod { get; init; }
    public string? TransactionId { get; init; }
    public string? ReceiptUrl { get; init; }
}

public sealed class PaymentSummary
{
    public int TotalPayments { get; init; }
    public decimal TotalAmountPaid { get; init; }
    public int PendingPayments { get; init; }
    public decimal NextPremiumAmount { get; init; }
    public DateTime? NextDueDate { get; init; }
}
