using CMS.Application.DTOs.Member;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services;

public sealed class MemberService : IMemberService
{
    private readonly IMemberRepository _memberRepository;

    public MemberService(IMemberRepository memberRepository)
    {
        _memberRepository = memberRepository;
    }

    public async Task<Guid> RegisterMemberAsync(
        RegisterMemberRequest request,
        CancellationToken cancellationToken)
    {
        var address = new Address(
            request.Street,
            request.City,
            request.State,
            request.Country,
            request.PostalCode);

        var member = new Member(
            request.FullName,
            request.Email,
            request.DateOfBirth,
            address);

        await _memberRepository.AddAsync(member, cancellationToken);
        return member.MemberId;
    }

    public async Task AssignPlanAsync(
        Guid memberId,
        AssignPlanRequest request,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken)
            ?? throw new InvalidOperationException("Member not found.");

        var plan = new Plan(
            request.StartDate,
            request.EndDate,
            new Money(request.InsuredAmount));

        member.AssignPlan(plan);
        await _memberRepository.UpdateAsync(member, cancellationToken);
    }
}