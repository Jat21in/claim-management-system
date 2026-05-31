using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IPaymentRepository
{
    Task<PremiumPayment?> GetByIdAsync(Guid paymentId, CancellationToken cancellationToken);
    Task<IEnumerable<PremiumPayment>> GetByPolicyIdAsync(Guid policyId, CancellationToken cancellationToken);
    Task<IEnumerable<PremiumPayment>> GetPendingPaymentsAsync(CancellationToken cancellationToken);
    Task<IEnumerable<PremiumPayment>> GetOverduePaymentsAsync(CancellationToken cancellationToken);
    Task AddAsync(PremiumPayment payment, CancellationToken cancellationToken);
    Task UpdateAsync(PremiumPayment payment, CancellationToken cancellationToken);
}
