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

    public async Task UpdateAsync(Policy policy, CancellationToken cancellationToken)
    {
        _context.Set<Policy>().Update(policy);
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

}
