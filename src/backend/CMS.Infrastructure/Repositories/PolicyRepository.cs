using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class PolicyRepository : IPolicyRepository
{
    private readonly CmsDbContext _context;

    public PolicyRepository(CmsDbContext context)
    {
        _context = context;
    }

    public async Task<Policy?> GetByIdAsync(Guid policyId, CancellationToken cancellationToken)
    {
        return await _context.Set<Policy>()
            .Include(p => p.Dependents)
            .Include(p => p.Nominees)
            .Include(p => p.Payments)
            .Include(p => p.Plan)
            .AsSplitQuery() // 🔥 FIX: Split query to avoid cartesian explosion
            .FirstOrDefaultAsync(p => p.PolicyId == policyId, cancellationToken);
    }

    public async Task<Policy?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            // 🔥 SIMPLE - No includes
            return await _context.Set<Policy>()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.MemberId == memberId && p.Status == Domain.Enums.PolicyStatus.Active);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetByMemberIdAsync: {ex.Message}");
            return null;
        }
    }


    public async Task<Policy?> GetByPolicyNumberAsync(string policyNumber, CancellationToken cancellationToken)
    {
        return await _context.Set<Policy>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PolicyNumber == policyNumber, cancellationToken);
    }

    public async Task<IEnumerable<Policy>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Set<Policy>()
            .Include(p => p.Member)
            .Include(p => p.Plan)
            .Include(p => p.Dependents)
            .Include(p => p.Nominees)
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Policy>> GetActivePoliciesAsync(CancellationToken cancellationToken)
    {
        return await _context.Set<Policy>()
            .Where(p => p.Status == Domain.Enums.PolicyStatus.Active)
            .Include(p => p.Member)
            .Include(p => p.Plan)
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Policy>> GetPoliciesByStatusAsync(int status, CancellationToken cancellationToken)
    {
        return await _context.Set<Policy>()
            .Where(p => (int)p.Status == status)
            .Include(p => p.Member)
            .Include(p => p.Plan)
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Policy policy, CancellationToken cancellationToken)
    {
        await _context.Set<Policy>().AddAsync(policy, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // /src/backend/CMS.Infrastructure/Repositories/PolicyRepository.cs

    // /src/backend/CMS.Infrastructure/Repositories/PolicyRepository.cs

    // /src/backend/CMS.Infrastructure/Repositories/PolicyRepository.cs

    public async Task UpdateAsync(Policy policy, CancellationToken cancellationToken)
    {
        // ✅ Get the existing policy WITH tracking (not AsNoTracking)
        var existingPolicy = await _context.Policies
            .FirstOrDefaultAsync(p => p.PolicyId == policy.PolicyId, cancellationToken);

        if (existingPolicy == null)
        {
            await _context.Policies.AddAsync(policy, cancellationToken);
        }
        else
        {
            // ✅ Use the domain methods that already exist in Policy class
            // The RecordPayment method already updates LastPaymentDate, LastPaymentAmount, NextPremiumDueDate
            // But we need to update the existing policy, not the detached one

            // Update scalar properties using EF Core's property access (bypassing private setters)
            _context.Entry(existingPolicy).CurrentValues.SetValues(policy);

            // Mark only specific properties as modified to avoid conflicts
            _context.Entry(existingPolicy).Property(x => x.LastPaymentDate).IsModified = true;
            _context.Entry(existingPolicy).Property(x => x.LastPaymentAmount).IsModified = true;
            _context.Entry(existingPolicy).Property(x => x.NextPremiumDueDate).IsModified = true;
            _context.Entry(existingPolicy).Property(x => x.UpdatedAt).IsModified = true;

            // Update status if changed
            if (existingPolicy.Status != policy.Status)
            {
                _context.Entry(existingPolicy).Property(x => x.Status).IsModified = true;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddDependentAsync(Dependent dependent, CancellationToken cancellationToken)
    {
        await _context.Set<Dependent>().AddAsync(dependent, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddNomineeAsync(Nominee nominee, CancellationToken cancellationToken)
    {
        await _context.Set<Nominee>().AddAsync(nominee, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Dependent?> GetDependentByIdAsync(Guid dependentId, CancellationToken cancellationToken)
    {
        return await _context.Set<Dependent>()
            .FirstOrDefaultAsync(d => d.DependentId == dependentId, cancellationToken);
    }

    public async Task<Nominee?> GetNomineeByIdAsync(Guid nomineeId, CancellationToken cancellationToken)
    {
        return await _context.Set<Nominee>()
            .FirstOrDefaultAsync(n => n.NomineeId == nomineeId, cancellationToken);
    }
    // In PolicyRepository.cs
    public async Task<Policy?> GetByIdWithMemberAsync(Guid policyId, CancellationToken cancellationToken)
    {
        return await _context.Policies
            .Include(p => p.Member)  // ✅ This loads the Member
            .Include(p => p.Plan)
            .FirstOrDefaultAsync(p => p.PolicyId == policyId, cancellationToken);
    }
}
