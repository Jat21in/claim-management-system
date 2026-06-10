using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IPlanRepository
{
    Task<Plan?> GetByIdAsync(Guid planId, CancellationToken cancellationToken);

    Task<List<Plan>> GetActivePlansAsync(CancellationToken cancellationToken);
    //Task<Policy?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken);

    Task AddAsync(Plan plan, CancellationToken cancellationToken);
    Task UpdateAsync(Plan plan, CancellationToken cancellationToken);
}