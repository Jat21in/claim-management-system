using CMS.Application.DTOs.Member;
using CMS.Application.DTOs.Plan;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;
using CMS.Domain.ValueObjects;

namespace CMS.Application.Services;

public sealed class MemberService : IMemberService
{
    private readonly IMemberRepository _memberRepository;
    private readonly IPlanRepository _planRepository;

    public MemberService(
    IMemberRepository memberRepository,
    IPlanRepository planRepository)
    {
        _memberRepository = memberRepository;
        _planRepository = planRepository;
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

        // ✅ Load EXISTING plan from DB
        var plan = await _planRepository.GetByIdAsync(request.PlanId, cancellationToken)
            ?? throw new InvalidOperationException("Plan not found.");

        // ✅ Domain-safe assignment
        member.AssignPlan(plan);

        await _memberRepository.UpdateAsync(member, cancellationToken);
    }

    public async Task UpdateProfileAsync(
    Guid memberId,
    UpdateMemberProfileRequest request,
    CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken)
            ?? throw new InvalidOperationException("Member not found.");

        var address = new Address(
            request.Street,
            request.City,
            request.State,
            request.Country,
            request.PostalCode);

        member.UpdateAddress(address, request.ContactNumber);

        await _memberRepository.UpdateAsync(member, cancellationToken);
    }


    public async Task UpdateActivePlanAsync(
        Guid memberId,
        UpdatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository
            .GetByIdWithActivePlanAsync(memberId, cancellationToken)
            ?? throw new InvalidOperationException("Member not found.");

        if (member.ActivePlan is null)
            throw new InvalidOperationException("No active plan found.");

        if (request.EndDate <= member.ActivePlan.EndDate)
            throw new InvalidOperationException("End date must be after current end date.");

        member.ActivePlan.UpdateValidityAndCoverage(
            request.EndDate,
            request.InsuredAmount);


        await _memberRepository.UpdateAsync(member, cancellationToken);
    }

}