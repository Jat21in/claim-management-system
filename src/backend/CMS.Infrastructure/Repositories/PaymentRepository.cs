using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Domain.Enums;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class PaymentRepository : IPaymentRepository
{
    private readonly CmsDbContext _context;

    public PaymentRepository(CmsDbContext context)
    {
        _context = context;
    }

    public async Task<PremiumPayment?> GetByIdAsync(Guid paymentId, CancellationToken cancellationToken)
    {
        return await _context.Set<PremiumPayment>()
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId, cancellationToken);
    }

    public async Task<IEnumerable<PremiumPayment>> GetByPolicyIdAsync(Guid policyId, CancellationToken cancellationToken)
    {
        return await _context.Set<PremiumPayment>()
            .Where(p => p.PolicyId == policyId)
            .OrderByDescending(p => p.DueDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PremiumPayment>> GetPendingPaymentsAsync(CancellationToken cancellationToken)
    {
        return await _context.Set<PremiumPayment>()
            .Where(p => p.Status == PaymentStatus.Pending)
            .Include(p => p.Policy)
            .ThenInclude(policy => policy!.Member)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PremiumPayment>> GetOverduePaymentsAsync(CancellationToken cancellationToken)
    {
        var overdueDate = DateTime.UtcNow.AddDays(-30);
        return await _context.Set<PremiumPayment>()
            .Where(p => p.Status == PaymentStatus.Pending && p.DueDate < overdueDate)
            .Include(p => p.Policy)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(PremiumPayment payment, CancellationToken cancellationToken)
    {
        await _context.Set<PremiumPayment>().AddAsync(payment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(PremiumPayment payment, CancellationToken cancellationToken)
    {
        _context.Set<PremiumPayment>().Update(payment);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
