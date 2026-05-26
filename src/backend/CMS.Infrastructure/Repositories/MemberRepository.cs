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
        return await _dbContext.Members
            .Include(m => m.Claims)
            .FirstOrDefaultAsync(m => m.MemberId == memberId, cancellationToken);
    }

    public async Task AddAsync(Member member, CancellationToken cancellationToken)
    {
        _dbContext.Members.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Member member, CancellationToken cancellationToken)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }


    public async Task<Member?> GetByEmailAsync(string email, CancellationToken cancellationToken) 
    { 
        return await _dbContext.Members.FirstOrDefaultAsync(m => m.Email == email, cancellationToken); 
    }

    public async Task<bool> ExistsByEmailAsync(
    string email,
    CancellationToken cancellationToken)
    {
        return await _dbContext.Members
            .AnyAsync(m => m.Email == email, cancellationToken);
    }

    public async Task<Member?> GetByIdWithActivePlanAsync(
    Guid memberId,
    CancellationToken cancellationToken)
    {
        return await _dbContext.Members
            .Include(m => m.ActivePlan)     // ✅ THIS IS THE FIX
            .Include(m => m.Claims)
            .FirstOrDefaultAsync(
                m => m.MemberId == memberId,
                cancellationToken);
    }

    public async Task<IEnumerable<Member>> GetAllAsync(CancellationToken ct)
    {
        return await _dbContext.Members
            .Include(m => m.ActivePlan)
            .Include(m => m.Claims)
            .AsNoTracking()
            .ToListAsync(ct);
    }
}