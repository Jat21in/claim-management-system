using CMS.Application.DTOs.AI;

namespace CMS.Application.Interfaces.Services;

public interface IAiVerificationService
{
    Task<AiVerificationResponse> VerifyClaimAsync(
        AiVerificationRequest request,
        CancellationToken cancellationToken);
}
