using CMS.Application.Interfaces.Repositories;
using CMS.Domain.Entities;
using CMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CMS.Infrastructure.Repositories;

public sealed class KycRepository : IKycRepository
{
    private readonly CmsDbContext _context;

    public KycRepository(CmsDbContext context)
    {
        _context = context;
    }

    public async Task<KycDocument?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken)
    {
        return await _context.Set<KycDocument>()
            .FirstOrDefaultAsync(k => k.DocumentId == documentId, cancellationToken);
    }

    public async Task<IEnumerable<KycDocument>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            return await _context.Set<KycDocument>()
                .AsNoTracking()
                .Where(k => k.MemberId == memberId)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetByMemberIdAsync: {ex.Message}");
            return new List<KycDocument>();
        }
    }


    public async Task<IEnumerable<KycDocument>> GetPendingKycAsync(CancellationToken cancellationToken)
    {
        return await _context.Set<KycDocument>()
            .Where(k => !k.IsVerified && k.RejectionReason == null)
            .Include(k => k.Member)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<KycDocument>> GetUnverifiedDocumentsAsync(CancellationToken cancellationToken)
    {
        return await _context.Set<KycDocument>()
            .Where(k => !k.IsVerified)
            .Include(k => k.Member)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(KycDocument document, CancellationToken cancellationToken)
    {
        await _context.Set<KycDocument>().AddAsync(document, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(KycDocument document, CancellationToken cancellationToken)
    {
        _context.Set<KycDocument>().Update(document);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> HasMemberSubmittedKycAsync(Guid memberId, CancellationToken cancellationToken)
    {
        return await _context.Set<KycDocument>()
            .AnyAsync(k => k.MemberId == memberId, cancellationToken);
    }
}
