using CMS.Application.DTOs.Claim;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services;

public sealed class ClaimService : IClaimService
{
    private readonly IMemberRepository _memberRepository;

    public ClaimService(IMemberRepository memberRepository)
    {
        _memberRepository = memberRepository;
    }

    public async Task<Guid> SubmitClaimAsync(
        SubmitClaimRequest request,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(
            request.MemberId, cancellationToken)
            ?? throw new InvalidOperationException("Member not found.");

        var claim = member.SubmitClaim(
            new Money(request.Amount),
            request.ClaimDate,
            "Claim Submission");

        await _memberRepository.UpdateAsync(member, cancellationToken);
        return claim.ClaimId;
    }
}