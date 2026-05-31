using CMS.Application.DTOs.Policy;
using CMS.Application.Interfaces.Repositories;
using CMS.Application.Interfaces.Services;
using CMS.Domain.Entities;

namespace CMS.Application.Services;

public sealed class PolicyService : IPolicyService
{
    private readonly IPolicyRepository _policyRepository;
    private readonly IPlanRepository _planRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IEmailService _emailService;

    public PolicyService(
        IPolicyRepository policyRepository,
        IPlanRepository planRepository,
        IMemberRepository memberRepository,
        IEmailService emailService)
    {
        _policyRepository = policyRepository;
        _planRepository = planRepository;
        _memberRepository = memberRepository;
        _emailService = emailService;
    }

    public async Task<PolicyResponse> CreatePolicyFromPlanAsync(Guid memberId, Guid planId, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
        if (member == null)
            throw new InvalidOperationException("Member not found");

        if (member.Status != Domain.Enums.MemberStatus.Verified)
            throw new InvalidOperationException("KYC verification required before purchasing policy");

        var plan = await _planRepository.GetByIdAsync(planId, cancellationToken);
        if (plan == null)
            throw new InvalidOperationException("Plan not found");

        // Check if member already has active policy
        var existingPolicy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
        if (existingPolicy != null)
            throw new InvalidOperationException("Member already has an active policy");

        // Generate unique policy number
        var policyNumber = GeneratePolicyNumber();

        var policy = new Policy(
            memberId: memberId,
            planId: planId,
            policyNumber: policyNumber,
            monthlyPremium: CalculateMonthlyPremium(plan.InsuredAmount),
            annualPremium: CalculateAnnualPremium(plan.InsuredAmount),
            sumInsured: plan.InsuredAmount,
            startDate: DateTime.UtcNow,
            durationInMonths: plan.DurationInMonths
        );

        await _policyRepository.AddAsync(policy, cancellationToken);

        // Send email confirmation
        await _emailService.SendPolicyCreatedEmailAsync(
            member.Email,
            member.FullName,
            policyNumber,
            cancellationToken);

        return await MapToResponse(policy, cancellationToken);
    }

    public async Task<PolicyResponse> GetMemberPolicyAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
        if (policy == null)
            throw new InvalidOperationException("No active policy found");

        return await MapToResponse(policy, cancellationToken);
    }

    public async Task AddDependentAsync(Guid memberId, AddDependentRequest request, CancellationToken cancellationToken)
    {
        // First try to get policy from Policies table
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);

        // If no policy in Policies table, check Member.ActivePlan
        if (policy == null)
        {
            var member = await _memberRepository.GetByIdWithActivePlanAsync(memberId, cancellationToken);
            if (member?.ActivePlan == null)
                throw new InvalidOperationException("No active policy found");

            // Create a policy from the member's active plan
            policy = new Policy(
                memberId: member.MemberId,
                planId: member.ActivePlan.PlanId,
                policyNumber: GeneratePolicyNumber(),
                monthlyPremium: CalculateMonthlyPremium(member.ActivePlan.InsuredAmount),
                annualPremium: CalculateAnnualPremium(member.ActivePlan.InsuredAmount),
                sumInsured: member.ActivePlan.InsuredAmount,
                startDate: DateTime.UtcNow,
                durationInMonths: member.ActivePlan.DurationInMonths
            );

            await _policyRepository.AddAsync(policy, cancellationToken);
        }

        var dependent = new Dependent(
            policyId: policy.PolicyId,
            fullName: request.FullName,
            relationship: request.Relationship,
            dateOfBirth: request.DateOfBirth
        );

        await _policyRepository.AddDependentAsync(dependent, cancellationToken);
    }


    public async Task AddNomineeAsync(Guid memberId, AddNomineeRequest request, CancellationToken cancellationToken)
    {
        // First try to get policy from Policies table
        var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);

        // If no policy in Policies table, check Member.ActivePlan
        if (policy == null)
        {
            var member = await _memberRepository.GetByIdWithActivePlanAsync(memberId, cancellationToken);
            if (member?.ActivePlan == null)
                throw new InvalidOperationException("No active policy found");

            // Create a policy from the member's active plan
            policy = new Policy(
                memberId: member.MemberId,
                planId: member.ActivePlan.PlanId,
                policyNumber: GeneratePolicyNumber(),
                monthlyPremium: CalculateMonthlyPremium(member.ActivePlan.InsuredAmount),
                annualPremium: CalculateAnnualPremium(member.ActivePlan.InsuredAmount),
                sumInsured: member.ActivePlan.InsuredAmount,
                startDate: DateTime.UtcNow,
                durationInMonths: member.ActivePlan.DurationInMonths
            );

            await _policyRepository.AddAsync(policy, cancellationToken);
        }

        var nominee = new Nominee(
            policyId: policy.PolicyId,
            fullName: request.FullName,
            relationship: request.Relationship,
            percentageAllocation: request.PercentageAllocation,
            guardianName: request.GuardianName,
            isPrimary: request.IsPrimary
        );

        await _policyRepository.AddNomineeAsync(nominee, cancellationToken);
    }


    public async Task<List<DependentResponse>> GetDependentsAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
            if (policy == null)
                return new List<DependentResponse>();

            return policy.Dependents.Where(d => d.IsActive).Select(d => new DependentResponse
            {
                DependentId = d.DependentId,
                FullName = d.FullName,
                Relationship = d.Relationship,
                DateOfBirth = d.DateOfBirth,
                IsActive = d.IsActive
            }).ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetDependentsAsync: {ex.Message}");
            return new List<DependentResponse>();
        }
    }


    public async Task<List<NomineeResponse>> GetNomineesAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
            if (policy == null)
                return new List<NomineeResponse>();

            return policy.Nominees.Select(n => new NomineeResponse
            {
                NomineeId = n.NomineeId,
                FullName = n.FullName,
                Relationship = n.Relationship,
                PercentageAllocation = n.PercentageAllocation,
                GuardianName = n.GuardianName,
                IsPrimary = n.IsPrimary
            }).ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetNomineesAsync: {ex.Message}");
            return new List<NomineeResponse>();
        }
    }

    public async Task<PolicySummaryResponse> GetPolicySummaryAsync(Guid memberId, CancellationToken cancellationToken)
    {
        try
        {
            var policy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);
            if (policy == null)
                return new PolicySummaryResponse { HasActivePolicy = false };

            return new PolicySummaryResponse
            {
                HasActivePolicy = true,
                PolicyNumber = policy.PolicyNumber,
                PlanName = policy.Plan?.Name ?? "Unknown",
                SumInsured = policy.SumInsured,
                UtilizedAmount = policy.UtilizedAmount,
                NextPremiumDueDate = policy.GetNextPremiumDueDate(),
                NextPremiumAmount = policy.MonthlyPremium,
                DependentsCount = policy.Dependents.Count(d => d.IsActive),
                NomineesCount = policy.Nominees.Count
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetPolicySummaryAsync: {ex.Message}");
            return new PolicySummaryResponse { HasActivePolicy = false };
        }
    }


    private string GeneratePolicyNumber()
    {
        return $"POL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
    }

    private decimal CalculateMonthlyPremium(decimal sumInsured)
    {
        // Rough calculation: 0.5% of sum insured per year, divided by 12
        return Math.Round((sumInsured * 0.005m) / 12, 2);
    }

    private decimal CalculateAnnualPremium(decimal sumInsured)
    {
        return Math.Round(sumInsured * 0.005m, 2);
    }

    private async Task<PolicyResponse> MapToResponse(Policy policy, CancellationToken cancellationToken)
    {
        return new PolicyResponse
        {
            PolicyId = policy.PolicyId,
            PolicyNumber = policy.PolicyNumber,
            Status = policy.Status,
            StartDate = policy.StartDate,
            EndDate = policy.EndDate,
            MonthlyPremium = policy.MonthlyPremium,
            SumInsured = policy.SumInsured,
            UtilizedAmount = policy.UtilizedAmount,
            RemainingAmount = policy.SumInsured - policy.UtilizedAmount,
            PlanName = policy.Plan?.Name ?? "Unknown",
            Dependents = policy.Dependents.Select(d => new DependentResponse
            {
                DependentId = d.DependentId,
                FullName = d.FullName,
                Relationship = d.Relationship,
                DateOfBirth = d.DateOfBirth,
                IsActive = d.IsActive
            }).ToList(),
            Nominees = policy.Nominees.Select(n => new NomineeResponse
            {
                NomineeId = n.NomineeId,
                FullName = n.FullName,
                Relationship = n.Relationship,
                PercentageAllocation = n.PercentageAllocation,
                GuardianName = n.GuardianName,
                IsPrimary = n.IsPrimary
            }).ToList()
        };
    }
}
