using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Repositories;

public interface IPolicyRepository
{
    Task<Policy?> GetByIdAsync(Guid policyId, CancellationToken cancellationToken);
    Task<Policy?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken);
    Task<Policy?> GetByPolicyNumberAsync(string policyNumber, CancellationToken cancellationToken);
    Task<IEnumerable<Policy>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Policy>> GetActivePoliciesAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Policy>> GetPoliciesByStatusAsync(int status, CancellationToken cancellationToken);
    Task AddAsync(Policy policy, CancellationToken cancellationToken);
    Task UpdateAsync(Policy policy, CancellationToken cancellationToken);
    Task AddDependentAsync(Dependent dependent, CancellationToken cancellationToken);
    Task AddNomineeAsync(Nominee nominee, CancellationToken cancellationToken);
    Task<Dependent?> GetDependentByIdAsync(Guid dependentId, CancellationToken cancellationToken);
    Task<Nominee?> GetNomineeByIdAsync(Guid nomineeId, CancellationToken cancellationToken);
}