using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IClaimRepository
{
    Task AddAsync(Claim claim, CancellationToken ct);

    Task<List<Claim>> GetByMemberIdAsync(Guid memberId, CancellationToken ct);

    Task<Claim?> GetByIdAsync(Guid claimId, CancellationToken ct);

    Task<IEnumerable<Claim>> GetAllAsync(CancellationToken ct);

    Task UpdateAsync(Claim claim, CancellationToken ct);

}