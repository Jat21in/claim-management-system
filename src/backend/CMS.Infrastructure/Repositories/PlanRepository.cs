using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class PlanRepository : IPlanRepository
{
    private readonly CmsDbContext _dbContext;

    public PlanRepository(CmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Plan?> GetByIdAsync(Guid planId, CancellationToken cancellationToken)
    {
        // ✅ Remove AsNoTracking so EF tracks the entity
        return await _dbContext.Plans
            .FirstOrDefaultAsync(p => p.PlanId == planId, cancellationToken);
    }

    public async Task AddAsync(Plan plan, CancellationToken cancellationToken)
    {
        _dbContext.Plans.Add(plan);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Plan>> GetActivePlansAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Plans
            .Where(p => p.IsActive)
            
            .ToListAsync(cancellationToken);
    }
}