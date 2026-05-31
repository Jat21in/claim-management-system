using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IKycRepository
{
    Task<KycDocument?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken);
    Task<IEnumerable<KycDocument>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken);
    Task<IEnumerable<KycDocument>> GetPendingKycAsync(CancellationToken cancellationToken);
    Task<IEnumerable<KycDocument>> GetUnverifiedDocumentsAsync(CancellationToken cancellationToken);
    Task AddAsync(KycDocument document, CancellationToken cancellationToken);
    Task UpdateAsync(KycDocument document, CancellationToken cancellationToken);
    Task<bool> HasMemberSubmittedKycAsync(Guid memberId, CancellationToken cancellationToken);
}
