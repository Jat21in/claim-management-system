using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IMemberRepository
{
    Task<Member?> GetByIdAsync(Guid memberId, CancellationToken cancellationToken);
    Task AddAsync(Member member, CancellationToken cancellationToken);
    Task UpdateAsync(Member member, CancellationToken cancellationToken);
}