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
        var member = await _memberRepository
            .GetByIdAsync(memberId, cancellationToken)
            ?? throw new InvalidOperationException("Member not found.");

        var plan = await _planRepository
            .GetByIdAsync(request.PlanId, cancellationToken)
            ?? throw new InvalidOperationException("Plan not found.");

        member.AssignPlan(plan);

        await _memberRepository.UpdateAsync(member, cancellationToken);
    }

    public async Task UpdateProfileAsync(
        Guid memberId,
        UpdateMemberProfileRequest request,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository
            .GetByIdAsync(memberId, cancellationToken)
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

        // Additional validations
        if (request.EndDate <= DateTime.UtcNow)
            throw new InvalidOperationException("End date must be in the future.");

        if (request.InsuredAmount <= 0)
            throw new ArgumentException("Insured amount must be positive.");

        if (request.EndDate <= member.ActivePlan.EndDate)
            throw new InvalidOperationException("New end date must be after current end date.");

        member.ActivePlan.UpdateValidityAndCoverage(
            request.EndDate,
            request.InsuredAmount);

        await _memberRepository.UpdateAsync(member, cancellationToken);
    }


    public async Task<MemberDashboardResponse> GetMyDashboardAsync(
        Guid memberId,
        CancellationToken cancellationToken)
    {
        var member = await _memberRepository
            .GetByIdWithActivePlanAsync(memberId, cancellationToken)
            ?? throw new InvalidOperationException("Member not found.");

        if (member.ActivePlan is null)
            throw new InvalidOperationException("No active plan assigned.");

        return new MemberDashboardResponse
        {
            FullName = member.FullName,
            Email = member.Email,
            ActivePlan = new ActivePlanDto
            {
                Id = member.ActivePlan.PlanId,
                Name = member.ActivePlan.Name,
                InsuredAmount = member.ActivePlan.InsuredAmount,
                StartDate = member.ActivePlan.StartDate,
                EndDate = member.ActivePlan.EndDate
            }
        };
    }
}