using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;


public interface IClaimRepository
{
    Task AddAsync(Claim claim, CancellationToken cancellationToken);
    Task<List<Claim>> GetByMemberIdAsync(Guid memberId, CancellationToken ct);
    Task<Claim?> GetByIdAsync(Guid claimId, CancellationToken ct);
}
