using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IClaimRepository
{
    Task<Claim?> GetByIdAsync(Guid claimId, CancellationToken cancellationToken);
    Task AddAsync(Claim claim, CancellationToken cancellationToken);
}