using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class ClaimRepository : IClaimRepository
{
    private readonly CmsDbContext _dbContext;

    public ClaimRepository(CmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Claim?> GetByIdAsync(Guid claimId, CancellationToken cancellationToken)
    {
        return await _dbContext.Claims
            .FirstOrDefaultAsync(c => c.ClaimId == claimId, cancellationToken);
    }

    public async Task AddAsync(Claim claim, CancellationToken cancellationToken)
    {
        _dbContext.Claims.Add(claim);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}