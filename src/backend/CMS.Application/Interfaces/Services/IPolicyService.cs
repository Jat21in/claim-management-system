using CMS.Application.DTOs.Policy;

namespace CMS.Application.Interfaces.Services;

public interface IPolicyService
{
    Task<PolicyResponse> CreatePolicyFromPlanAsync(Guid memberId, Guid planId, CancellationToken cancellationToken);
    Task<PolicyResponse> GetMemberPolicyAsync(Guid memberId, CancellationToken cancellationToken);
    Task AddDependentAsync(Guid memberId, AddDependentRequest request, CancellationToken cancellationToken);
    Task AddNomineeAsync(Guid memberId, AddNomineeRequest request, CancellationToken cancellationToken);
    Task<List<DependentResponse>> GetDependentsAsync(Guid memberId, CancellationToken cancellationToken);
    Task<List<NomineeResponse>> GetNomineesAsync(Guid memberId, CancellationToken cancellationToken);
    Task<PolicySummaryResponse> GetPolicySummaryAsync(Guid memberId, CancellationToken cancellationToken);
    Task<PolicySetupResponse> SetupPolicyWithPaymentAsync(
    Guid memberId,
    PolicySetupRequest request,
    CancellationToken cancellationToken);

}
