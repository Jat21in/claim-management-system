using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Services;

public interface IGracePeriodService
{
    Task CheckAndUpdateOverduePaymentsAsync(CancellationToken cancellationToken);
    Task<PolicyLapseResult> ProcessPolicyLapseAsync(Guid policyId, CancellationToken cancellationToken);
    Task<PolicyReinstatementResult> ReinstatePolicyAsync(Guid policyId, bool withMedicalUnderwriting, CancellationToken cancellationToken);
    Task SendGracePeriodRemindersAsync(CancellationToken cancellationToken);
}

public class PolicyLapseResult
{
    public bool IsLapsed { get; set; }
    public DateTime LapsedDate { get; set; }
    public decimal OutstandingAmount { get; set; }
    public int DaysOverdue { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class PolicyReinstatementResult
{
    public bool IsReinstated { get; set; }
    public DateTime NewExpiryDate { get; set; }
    public decimal ReinstatementFee { get; set; }
    public bool RequiresMedicalUnderwriting { get; set; }
    public string Message { get; set; } = string.Empty;
}
