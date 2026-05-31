using CMS.Application.DTOs.KYC;

namespace CMS.Application.Interfaces.Services;

public interface IKycService
{
    Task SubmitKycDocumentsAsync(Guid memberId, SubmitKycRequest request, Stream fileStream, string fileName, CancellationToken cancellationToken);
    Task<KycStatusResponse> GetKycStatusAsync(Guid memberId, CancellationToken cancellationToken);
    Task<List<PendingKycResponse>> GetPendingKycRequestsAsync(CancellationToken cancellationToken);
    Task ApproveKycAsync(Guid adminId, Guid memberId, CancellationToken cancellationToken);
    Task RejectKycAsync(Guid adminId, Guid memberId, string reason, CancellationToken cancellationToken);
}
