# Application Layer – Services & DTOs

## Overview

The Application layer (`CMS.Application`) orchestrates use cases. It contains:

- **Services** – Implement business workflows
- **DTOs** – Transfer data between API and Services
- **Validators** – Input validation rules
- **Interfaces** – Abstractions for dependencies (repositories, external services)

The Application layer depends on `CMS.Domain` but has **no direct dependency** on `CMS.Infrastructure` (database, file system, email).

---

## Service Registration (Dependency Injection)

**File:** `src/backend/CMS.Application/DependencyInjection.cs`

All services are registered with `AddScoped()` lifetime — one instance per HTTP request.

```csharp
public static IServiceCollection AddApplication(this IServiceCollection services)
{
    services.AddScoped<IMemberService, MemberService>();
    services.AddScoped<IClaimService, ClaimService>();
    services.AddScoped<IPlanService, PlanService>();
    services.AddScoped<IAuthService, AuthService>();
    services.AddScoped<IPolicyService, PolicyService>();
    services.AddScoped<IKycService, KycService>();
    services.AddScoped<IEmailService, EmailService>();
    services.AddScoped<IPaymentService, PaymentService>();
    services.AddScoped<IPremiumCalculatorService, PremiumCalculatorService>();
    services.AddScoped<IGracePeriodService, GracePeriodService>();
    services.AddScoped<IPdfGenerationService, PdfGenerationService>();

    return services;
}
```

> `AddScoped` ensures services are disposed at the end of each HTTP request — lines 14–15.

---

## Core Service: `AuthService`

**File:** `src/backend/CMS.Application/Services/AuthService.cs`

Handles user registration and login.

### Login Flow

| Line(s) | Purpose |
|---|---|
| 21–23 | Fetch member by email, throw if not found |
| 25–27 | Verify password hash using BCrypt |
| 29 | Generate JWT token |
| 31–35 | Return token and expiry |

```csharp
public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
{
    var member = await _memberRepository.GetByEmailAsync(request.Email, cancellationToken)
        ?? throw new UnauthorizedAccessException("Invalid credentials");

    if (!_passwordHasher.Verify(request.Password, member.PasswordHash))
        throw new UnauthorizedAccessException("Invalid credentials");

    var token = _jwtGenerator.Generate(member);

    return new LoginResponse { Token = token.Token, ExpiresAt = token.ExpiresAt };
}
```

### Registration Flow

| Line(s) | Purpose |
|---|---|
| 41–43 | Check for existing email |
| 45–50 | Create new `Member` entity with empty address |
| 52 | Hash password and assign |
| 55 | Save member to database |
| 58–93 | If plan selected during registration, create policy |

```csharp
public async Task RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
{
    if (await _memberRepository.ExistsByEmailAsync(request.Email, cancellationToken))
        throw new InvalidOperationException("Email already exists");

    var member = new Member(request.FullName, request.Email, request.DateOfBirth, Address.Empty());
    member.SetPasswordHash(_passwordHasher.Hash(request.Password));
    await _memberRepository.AddAsync(member, cancellationToken);

    if (request.SelectedPlanId.HasValue)
    {
        var plan = await _planRepository.GetByIdAsync(request.SelectedPlanId.Value, cancellationToken);
        var policy = new Policy(member.MemberId, plan.PlanId, GeneratePolicyNumber(), ...);
        await _policyRepository.AddAsync(policy, cancellationToken);
        member.AssignPlan(plan);
        await _memberRepository.UpdateAsync(member, cancellationToken);
    }
}
```

---

## Core Service: `ClaimService`

**File:** `src/backend/CMS.Application/Services/ClaimService.cs`

Handles claim submission, AI verification, and payment processing.

### Submit Claim Flow

| Line(s) | Purpose |
|---|---|
| 55–58 | Fetch member with active plan |
| 61–63 | Validate member has an active plan |
| 85–89 | Create claim entity and save to database |
| 90–105 | Upload medical report (if provided) |
| 108–130 | Call AI verification service |
| 132–138 | Update claim with AI results |

```csharp
public async Task<Guid> SubmitClaimAsync(Guid memberId, SubmitClaimRequest request, CancellationToken ct)
{
    var member = await _memberRepository.GetByIdWithActivePlanAsync(memberId, ct);
    if (member?.ActivePlan == null)
        throw new InvalidOperationException("Member does not have an active plan.");

    var claim = member.SubmitClaim(new Money(request.Amount), request.ClaimDate, request.Description);
    await _claimRepository.AddAsync(claim, ct);

    // AI Verification
    var aiRequest = new AiVerificationRequest { ... };
    var aiResult = await _aiVerificationService.VerifyClaimAsync(aiRequest, ct);
    claim.UpdateAiVerification(aiResult.ConfidenceScore, aiResult.Decision, aiResult.Reasoning);
    await _claimRepository.UpdateAsync(claim, ct);

    return claim.ClaimId;
}
```

### AI Verification Logic

**File:** `src/backend/CMS.Application/Services/GrokAiVerificationService.cs`

| Line(s) | Purpose |
|---|---|
| 28–30 | Read AI configuration from `appsettings.json` |
| 37–45 | Mock mode returns predefined responses (for development) |
| 47–75 | Real Groq API call with structured prompt |
| 77–98 | Parse JSON response into `AiVerificationResponse` |

---

## Core Service: `MemberService`

**File:** `src/backend/CMS.Application/Services/MemberService.cs`

Handles member profile management and plan assignment.

| Method | Purpose | Key Lines |
|---|---|---|
| `RegisterMemberAsync` | Create new member account | 32–43 |
| `AssignPlanAsync` | Assign a health plan to member | 45–55 |
| `UpdateProfileAsync` | Update address and contact number | 57–71 |
| `UpdateActivePlanAsync` | Change current plan (end date, coverage) | 73–93 |
| `GetMyDashboardAsync` | Fetch member dashboard data | 95–119 |

```csharp
public async Task<MemberDashboardResponse> GetMyDashboardAsync(Guid memberId, CancellationToken cancellationToken)
{
    var member = await _memberRepository.GetByIdWithActivePlanAsync(memberId, cancellationToken);
    var activePolicy = await _policyRepository.GetByMemberIdAsync(memberId, cancellationToken);

    return new MemberDashboardResponse
    {
        FullName = member.FullName,
        Email = member.Email,
        ActivePlan = member.ActivePlan != null ? new ActivePlanDto { ... } : null,
        ActivePolicyId = activePolicy?.PolicyId,
        ActivePolicyNumber = activePolicy?.PolicyNumber
    };
}
```

---

## Core Service: `PaymentService`

**File:** `src/backend/CMS.Application/Services/PaymentService.cs`

Handles premium payment initiation, processing, and history.

| Method | Purpose |
|---|---|
| `InitiatePaymentAsync` | Create a pending payment record — lines 26–45 |
| `ProcessMockPaymentAsync` | Mark payment as completed, update policy — lines 47–76 |
| `GetPaymentHistoryAsync` | Return all payments for a member — lines 78–104 |
| `CheckOverduePaymentsAndLapsePoliciesAsync` | Background job – lapse policies after 30 days — lines 106–122 |

```csharp
public async Task<PaymentResponse> ProcessMockPaymentAsync(Guid memberId, Guid paymentId, CancellationToken cancellationToken)
{
    var payment = await _paymentRepository.GetByIdAsync(paymentId, cancellationToken);
    var policy = await _policyRepository.GetByIdAsync(payment.PolicyId, cancellationToken);

    var transactionId = $"MOCK_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid().ToString().Substring(0, 8)}";
    payment.MarkCompleted(transactionId, $"/receipts/{paymentId}.pdf");
    await _paymentRepository.UpdateAsync(payment, cancellationToken);

    policy.RecordPayment(payment);  // ← Updates LastPaymentDate
    await _policyRepository.UpdateAsync(policy, cancellationToken);

    return new PaymentResponse { Success = true, TransactionId = transactionId };
}
```

---

## Core Service: `KycService`

**File:** `src/backend/CMS.Application/Services/KycService.cs`

Handles KYC document upload, verification, and status tracking.

| Method | Purpose |
|---|---|
| `SubmitKycDocumentsAsync` | Upload document, trigger admin notification — lines 32–83 |
| `GetKycStatusAsync` | Return current KYC status and documents — lines 85–118 |
| `ApproveKycAsync` | Admin approves, update member status to `Verified` — lines 120–138 |
| `RejectKycAsync` | Admin rejects with reason, update status to `Rejected` — lines 140–158 |

```csharp
public async Task ApproveKycAsync(Guid adminId, Guid memberId, CancellationToken cancellationToken)
{
    var member = await _memberRepository.GetByIdAsync(memberId, cancellationToken);
    member.ApproveKyc(adminId);  // Status → Verified
    await _memberRepository.UpdateAsync(member, cancellationToken);

    var documents = await _kycRepository.GetByMemberIdAsync(memberId, cancellationToken);
    foreach (var doc in documents)
    {
        doc.Verify(adminId);
        await _kycRepository.UpdateAsync(doc, cancellationToken);
    }

    await _emailService.SendKycApprovedEmailAsync(member.Email, member.FullName, cancellationToken);
}
```

---

## Core Service: `GracePeriodService`

**File:** `src/backend/CMS.Application/Services/GracePeriodService.cs`

Handles premium grace periods, reminders, and policy lapse/reinstatement.

| Method | Purpose | Constants |
|---|---|---|
| `SendGracePeriodRemindersAsync` | Send email reminders 7, 3, 1 days before due | Line 15: `GRACE_PERIOD_DAYS = 15` |
| `ProcessPolicyLapseAsync` | Lapse policy after 30+ days overdue | Line 16: `LAPSE_DAYS = 30` |
| `ReinstatePolicyAsync` | Reinstate within 180 days with fee | Line 17: `REINSTATEMENT_WINDOW_DAYS = 180` |

```csharp
public async Task<PolicyLapseResult> ProcessPolicyLapseAsync(Guid policyId, CancellationToken cancellationToken)
{
    var policy = await _policyRepository.GetByIdAsync(policyId, cancellationToken);
    var overduePayments = (await _paymentRepository.GetByPolicyIdAsync(policyId, cancellationToken))
        .Where(p => p.Status == PaymentStatus.Pending && p.DueDate < DateTime.UtcNow);

    var daysOverdue = (DateTime.UtcNow - overduePayments.Min(p => p.DueDate)).Days;

    if (daysOverdue >= LAPSE_DAYS)
    {
        policy.Lapse();  // Status → Lapsed
        await _policyRepository.UpdateAsync(policy, cancellationToken);

        await _emailService.SendPolicyLapsedEmailAsync(...);
    }

    return result;
}
```

---

## DTOs (Data Transfer Objects)

All DTOs live in `CMS.Application.DTOs` and its subfolders.

| Folder | Purpose | Example DTOs |
|---|---|---|
| `Auth/` | Login/registration | `LoginRequest`, `RegisterRequest`, `LoginResponse` |
| `Claim/` | Claim submission | `SubmitClaimRequest`, `ClaimResponse` |
| `Member/` | Member operations | `RegisterMemberRequest`, `MemberDashboardResponse` |
| `Plan/` | Plan queries | `PublicPlanResponse`, `UpdatePlanRequest` |
| `Policy/` | Policy management | `PolicyResponse`, `PolicySetupRequest` |
| `Payment/` | Payment processing | `InitiatePaymentRequest`, `PaymentHistoryResponse` |
| `KYC/` | Document verification | `SubmitKycRequest`, `KycStatusResponse` |
| `Premium/` | Premium calculation | `CalculatePremiumRequest`, `PremiumCalculationResult` |
| `AI/` | AI verification | `AiVerificationRequest`, `AiVerificationResponse` |

### Example DTO: `SubmitClaimRequest`

**File:** `src/backend/CMS.Application/DTOs/Claim/SubmitClaimRequest.cs`

```csharp
public sealed class SubmitClaimRequest
{
    public DateTime ClaimDate { get; init; }
    public decimal Amount { get; init; }
    public string Description { get; init; } = null!;
    public IFormFile? MedicalReport { get; init; }
}
```

> Usage: Controller receives this DTO, then passes it to `ClaimService`.

---

## Validators (Input Validation)

**Placeholder folder:** `CMS.Application.Validators/`

Currently empty. Recommended to add FluentValidation for complex rules:

```csharp
public class SubmitClaimValidator : AbstractValidator<SubmitClaimRequest>
{
    public SubmitClaimValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).LessThanOrEqualTo(1000000);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.ClaimDate).LessThanOrEqualTo(DateTime.UtcNow);
    }
}
```

---

## Summary

| Concern | Implementation | File |
|---|---|---|
| Service registration | `AddApplication()` | `DependencyInjection.cs` lines 12–31 |
| Authentication logic | `AuthService.LoginAsync()` | `AuthService.cs` lines 21–35 |
| Claim workflow | `ClaimService.SubmitClaimAsync()` | `ClaimService.cs` lines 55–138 |
| Premium payment | `PaymentService.ProcessMockPaymentAsync()` | `PaymentService.cs` lines 47–76 |
| KYC approval | `KycService.ApproveKycAsync()` | `KycService.cs` lines 120–138 |
| Policy lapse | `GracePeriodService.ProcessPolicyLapseAsync()` | `GracePeriodService.cs` lines 80–113 |
| DTOs | Request/Response objects | `CMS.Application.DTOs/*` |

> All services are stateless and thread-safe. Dependencies are injected via constructor.