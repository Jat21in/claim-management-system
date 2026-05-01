using CMS.Application.DTOs.Claim;

namespace CMS.Application.Interfaces.Services;

public interface IClaimService
{
    Task<Guid> SubmitClaimAsync(
        SubmitClaimRequest request,
        CancellationToken cancellationToken);
}