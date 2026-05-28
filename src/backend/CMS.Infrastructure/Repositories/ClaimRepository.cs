using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class ClaimRepository : IClaimRepository
{
    private readonly CmsDbContext _db;

    public ClaimRepository(CmsDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Claim claim, CancellationToken ct)
    {
        _db.Claims.Add(claim);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<Claim>> GetByMemberIdAsync(Guid memberId, CancellationToken ct)
    {
        return await _db.Claims
            .Include(c => c.Member)
            .Where(c => c.MemberId == memberId)
            .ToListAsync(ct);
    }

    public async Task<Claim?> GetByIdAsync(Guid claimId, CancellationToken ct)
    {
        return await _db.Claims
            .Include(c => c.Member)
            .FirstOrDefaultAsync(c => c.ClaimId == claimId, ct);
    }

    public async Task<IEnumerable<Claim>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Claims
            .Include(c => c.Member)
            //.AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task UpdateAsync(Claim claim, CancellationToken ct)
    {
        // ✅ Attach and mark as modified
        _db.Claims.Attach(claim);
        _db.Entry(claim).State = EntityState.Modified;
        await _db.SaveChangesAsync(ct);
    }

}