using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class MemberRepository : IMemberRepository
{
    private readonly CmsDbContext _dbContext;

    public MemberRepository(CmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Member?> GetByIdAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            // 🔥 SIMPLEST POSSIBLE QUERY
            return await _dbContext.Members
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MemberId == memberId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetByIdAsync: {ex.Message}");
            return null;
        }
    }

    public async Task AddAsync(Member member, CancellationToken cancellationToken)
    {
        // ✅ FIX: If member has an ActivePlan, ensure it's not treated as a new entity
        if (member.ActivePlan != null)
        {
            // Attach the existing plan without marking it as added
            _dbContext.Entry(member.ActivePlan).State = EntityState.Unchanged;
        }

        _dbContext.Members.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }


    public async Task UpdateAsync(Member member, CancellationToken cancellationToken)
    {
        _dbContext.Members.Update(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Member?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        return await _dbContext.Members
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Email == email);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken)
    {
        return await _dbContext.Members
            .AnyAsync(m => m.Email == email);
    }

    public async Task<Member?> GetByIdWithActivePlanAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext.Members
                .AsNoTracking()
                .Include(m => m.ActivePlan)
                .FirstOrDefaultAsync(m => m.MemberId == memberId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetByIdWithActivePlanAsync: {ex.Message}");
            return null;
        }
    }

    public async Task<IEnumerable<Member>> GetAllAsync(CancellationToken ct)
    {
        return await _dbContext.Members
            .AsNoTracking()
            .Take(100)
            .ToListAsync();
    }
}
