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
        Console.WriteLine("=== GetPendingPaymentsAsync CALLED ===");

        var payments = await _context.Set<PremiumPayment>()
            .Include(p => p.Policy)
                .ThenInclude(policy => policy!.Member)
            .Where(p => p.Status == PaymentStatus.Pending)
            .ToListAsync(cancellationToken);

        Console.WriteLine($"Found {payments.Count} pending payments total");

        // Also check if any payments are overdue
        var overdueCount = payments.Count(p => p.DueDate < DateTime.UtcNow);
        Console.WriteLine($"Of these, {overdueCount} are overdue (DueDate < now)");

        foreach (var p in payments)
        {
            Console.WriteLine($"Payment: {p.PaymentId}");
            Console.WriteLine($"  - DueDate: {p.DueDate:yyyy-MM-dd}");
            Console.WriteLine($"  - IsOverdue: {p.DueDate < DateTime.UtcNow}");
            Console.WriteLine($"  - PolicyId: {p.PolicyId}");
            Console.WriteLine($"  - PolicyNumber: {p.Policy?.PolicyNumber ?? "NULL"}");
            Console.WriteLine($"  - MemberEmail: {p.Policy?.Member?.Email ?? "NULL"}");
            Console.WriteLine($"  - PolicyStatus: {p.Policy?.Status}");
        }

        return payments;
    }

    public async Task<IEnumerable<PremiumPayment>> GetOverduePaymentsAsync(CancellationToken cancellationToken)
    {
        var overdueDate = DateTime.UtcNow.AddDays(-30);

        Console.WriteLine($"=== GetOverduePaymentsAsync CALLED ===");
        Console.WriteLine($"Looking for payments with DueDate < {overdueDate:yyyy-MM-dd}");

        var payments = await _context.Set<PremiumPayment>()
            .Where(p => p.Status == PaymentStatus.Pending && p.DueDate < overdueDate)
            .Include(p => p.Policy)
                .ThenInclude(policy => policy!.Member)
            .ToListAsync(cancellationToken);

        Console.WriteLine($"Found {payments.Count} overdue payments (30+ days)");

        foreach (var p in payments)
        {
            Console.WriteLine($"  - Payment: {p.PaymentId}, Policy: {p.Policy?.PolicyNumber}, DueDate: {p.DueDate:yyyy-MM-dd}");
        }

        return payments;
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
