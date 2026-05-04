using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IMemberRepository
{
    Task<Member?> GetByIdAsync(Guid memberId, CancellationToken cancellationToken);
    Task<Member?> GetByEmailAsync(
    string email,
    CancellationToken cancellationToken);

    Task<bool> ExistsByEmailAsync(
    string email,
    CancellationToken cancellationToken);

    Task AddAsync(Member member, CancellationToken cancellationToken);
    Task UpdateAsync(Member member, CancellationToken cancellationToken);

    Task<Member?> GetByIdWithActivePlanAsync(
    Guid memberId,
    CancellationToken cancellationToken);
}

