namespace CMS.Application.DTOs.Policy;

public sealed class CreatePolicyRequest
{
    public Guid PlanId { get; init; }
    public List<AddDependentRequest>? Dependents { get; init; }
    public List<AddNomineeRequest>? Nominees { get; init; }
}