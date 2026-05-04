using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.ValueObjects;

public sealed class ClaimService : IClaimService
{
    private readonly IClaimRepository _claimRepository;
    private readonly IMemberRepository _memberRepository;

    public ClaimService(
        IMemberRepository memberRepository,
        IClaimRepository claimRepository)
    {
        _memberRepository = memberRepository;
        _claimRepository = claimRepository;
    }

    public async Task<Guid> SubmitClaimAsync(
    Guid memberId,
    SubmitClaimRequest request,
    CancellationToken ct)
    {
        var member = await _memberRepository
            .GetByIdWithActivePlanAsync(memberId, ct)
            ?? throw new InvalidOperationException("Member not found.");

        var claim = member.SubmitClaim(
            new Money(request.Amount),
            request.ClaimDate,
            request.Description);

        await _claimRepository.AddAsync(claim, ct);

        return claim.ClaimId; // ✅ IMPORTANT
    }

}