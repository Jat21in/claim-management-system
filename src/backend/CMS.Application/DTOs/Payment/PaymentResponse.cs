namespace CMS.Application.DTOs.Payment;

public sealed class PaymentResponse
{
    public Guid PaymentId { get; init; }
    public bool Success { get; init; }
    public string Message { get; init; } = null!;
    public string? TransactionId { get; init; }
}
