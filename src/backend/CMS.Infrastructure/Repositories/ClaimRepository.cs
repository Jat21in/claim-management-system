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
        try
        {
            // 🔥 SIMPLIFIED - No includes, no tracking
            return await _db.Claims
                .AsNoTracking()
                .Where(c => c.MemberId == memberId)
                .OrderByDescending(c => c.ClaimDate)
                .Take(50) // Limit results
                .ToListAsync(); // 🔥 REMOVED ct parameter
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetByMemberIdAsync: {ex.Message}");
            return new List<Claim>();
        }
    }

    public async Task<Claim?> GetByIdAsync(Guid claimId, CancellationToken ct)
    {
        try
        {
            return await _db.Claims
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.ClaimId == claimId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetByIdAsync: {ex.Message}");
            return null;
        }
    }

    public async Task<IEnumerable<Claim>> GetAllAsync(CancellationToken ct)
    {
        try
        {
            return await _db.Claims
                .AsNoTracking()
                .Take(100)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAllAsync: {ex.Message}");
            return new List<Claim>();
        }
    }

    public async Task UpdateAsync(Claim claim, CancellationToken ct)
    {
        _db.Claims.Update(claim);
        await _db.SaveChangesAsync(ct);
    }
}
