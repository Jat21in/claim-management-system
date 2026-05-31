namespace CMS.Application.DTOs.Payment;

public sealed class InitiatePaymentResponse
{
    public Guid PaymentId { get; init; }
    public decimal Amount { get; init; }
    public DateTime DueDate { get; init; }
    public string PaymentUrl { get; init; } = null!; // For future gateway integration
}