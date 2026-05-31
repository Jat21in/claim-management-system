using CMS.Application.DTOs.Payment;

namespace CMS.Application.Interfaces.Services;

public interface IPaymentService
{
    Task<InitiatePaymentResponse> InitiatePaymentAsync(Guid memberId, InitiatePaymentRequest request, CancellationToken cancellationToken);
    Task<PaymentHistoryResponse> GetPaymentHistoryAsync(Guid memberId, CancellationToken cancellationToken);
    Task<PaymentResponse> ProcessMockPaymentAsync(Guid memberId, Guid paymentId, CancellationToken cancellationToken);
    Task CheckOverduePaymentsAndLapsePoliciesAsync(CancellationToken cancellationToken);
}