namespace CMS.Application.DTOs.Payment;

public sealed class InitiatePaymentRequest
{
    public string PaymentMethod { get; init; } = "Mock";
}
