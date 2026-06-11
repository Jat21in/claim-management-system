# Domain-Driven Design: Tactical Pattern

## Overview

The backend is organised around **Domain-Driven Design (DDD)** principles. The `CMS.Domain` project contains no external dependencies and represents the heart of the business logic.

| Pattern | Implementation | Location |
|---|---|---|
| **Aggregate Root** | `Member`, `Policy`, `Claim`, `Plan` | `CMS.Domain.Entities` |
| **Entity** | `Dependent`, `Nominee`, `KycDocument`, `PremiumPayment` | `CMS.Domain.Entities` |
| **Value Object** | `Address`, `Money` | `CMS.Domain.ValueObjects` |
| **Domain Event** *(implicit)* | `Claim.Submit()`, `Policy.Lapse()` – state changes | Entity methods |
| **Repository Interface** | `IMemberRepository`, `IClaimRepository`, `IPolicyRepository` | `CMS.Application.Interfaces.Repositories` |

---

## Aggregate Root: `Member`

**File:** `src/backend/CMS.Domain/Entities/Member.cs`

The `Member` aggregate is the primary entry point for user operations. It owns `Claims`, `KycDocuments`, and optionally an `ActivePlan`.

### Key Methods (Business Behaviour)

| Method | Purpose | File Reference |
|---|---|---|
| `SubmitClaim(Money amount, DateTime date, string description)` | Creates a new claim within policy validity | `ClaimService.cs` line 85 |
| `AssignPlan(Plan plan)` | Assigns a health plan to the member | `MemberService.cs` line 47 |
| `ApproveKyc(Guid adminId)` | Changes status from `Pending` → `Verified` | `KycService.cs` line 93 |
| `RejectKyc(Guid adminId, string reason)` | Changes status to `Rejected` with reason | `KycService.cs` line 108 |

### State Machine (`MemberStatus` Enum)

**File:** `src/backend/CMS.Domain/Enums/MemberStatus.cs`

```csharp
public enum MemberStatus
{
    Pending   = 0,   // KYC not submitted or under review
    Verified  = 1,   // KYC approved, can buy policies
    Rejected  = 2,   // KYC rejected
    Suspended = 3    // Account suspended by admin
}
```

| Status | Value | Description |
|---|---|---|
| `Pending` | 0 | KYC not submitted or under review |
| `Verified` | 1 | KYC approved, can buy policies |
| `Rejected` | 2 | KYC rejected |
| `Suspended` | 3 | Account suspended by admin |

### Invariants

> - Only `Verified` members can purchase a policy — `PolicyService.cs` line 29
> - A `Rejected` member can re-submit KYC; status resets to `Pending` — `KycService.cs` line 37

---

## Aggregate Root: `Policy`

**File:** `src/backend/CMS.Domain/Entities/Policy.cs`

The `Policy` aggregate represents an active insurance contract. It owns `Dependents`, `Nominees`, and `PremiumPayments`.

### Key Methods

| Method | Purpose | Called From |
|---|---|---|
| `RecordPayment(PremiumPayment payment)` | Updates `LastPaymentDate` and recalculates next due date | `PaymentService.cs` line 44 |
| `Lapse()` | Changes status from `Active` → `Lapsed` after 30+ days overdue | `GracePeriodService.cs` line 88 |
| `Reinstate()` | Restores a `Lapsed` policy to `Active` within 180 days | `GracePeriodService.cs` line 124 |

### Policy Status Flow (`PolicyStatus` Enum)

**File:** `src/backend/CMS.Domain/Enums/PolicyStatus.cs`

```csharp
public enum PolicyStatus
{
    Active    = 0,
    Lapsed    = 1,   // Premium overdue >30 days
    Cancelled = 2,   // Cancelled by user/admin
    Expired   = 3    // End date reached
}
```

---

## Value Object: `Money`

**File:** `src/backend/CMS.Domain/ValueObjects/Money.cs`

All monetary values in the domain are encapsulated in the `Money` value object. This ensures consistent rounding and prevents negative amounts.

### Key Lines

| Line(s) | Purpose |
|---|---|
| 10–16 | Constructor validates amount ≥ 0 and rounds to 2 decimal places |
| 18–19 | Static `Zero` factory method |
| 20–37 | `Add` and `Subtract` methods with domain rules |
| 39–45 | Operator overloads (`+`, `-`) for expressive code |
| 46–58 | Value-based equality (two `Money` objects with same amount are equal) |

### Usage in Claim Submission

**File:** `src/backend/CMS.Application/Services/ClaimService.cs` — line 85

```csharp
var claim = member.SubmitClaim(
    new Money(request.Amount),   // ← Value object created from DTO
    request.ClaimDate,
    request.Description);
```

### EF Core Configuration for `Money`

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/ClaimConfiguration.cs` — lines 23–26

```csharp
var moneyConverter = new ValueConverter<Money, decimal>(
    m => m.Amount,
    v => new Money(v));

builder.Property(c => c.ClaimAmount)
    .HasConversion(moneyConverter)
    .HasColumnName("ClaimAmount");
```

> This tells EF Core to store `Money.Amount` as a `decimal` column named `ClaimAmount` in the `Claims` table.

---

## Value Object: `Address`

**File:** `src/backend/CMS.Domain/ValueObjects/Address.cs`

Encapsulates postal address with validation.

### Key Lines

| Line(s) | Purpose |
|---|---|
| 14–40 | Constructor validates non-null/non-whitespace for each field |
| 42–49 | `Empty()` factory for temporary/unspecified addresses (e.g., during registration) |

### Owned Type Mapping (EF Core)

**File:** `src/backend/CMS.Infrastructure/Data/Configurations/MemberConfiguration.cs` — lines 36–62

EF Core maps `Address` as an owned entity — its properties become columns in the `Members` table.

```csharp
builder.OwnsOne(m => m.Address, address =>
{
    address.Property(a => a.Street)
           .HasColumnName("Street").HasMaxLength(200);
    address.Property(a => a.City)
           .HasColumnName("City").HasMaxLength(100);
    address.Property(a => a.State)
           .HasColumnName("State").HasMaxLength(100);
    address.Property(a => a.Country)
           .HasColumnName("Country").HasMaxLength(100);
    address.Property(a => a.PostalCode)
           .HasColumnName("PostalCode").HasMaxLength(20);
});
```

> This eliminates a separate `Addresses` table while preserving domain encapsulation.

---

## Repository Interfaces (Abstraction)

All repository interfaces live in `CMS.Application.Interfaces.Repositories`. They are defined in the Application layer but implemented in Infrastructure.

| Interface | Key Methods | Implemented In |
|---|---|---|
| `IMemberRepository` | `GetByIdAsync`, `GetByEmailAsync`, `GetByIdWithActivePlanAsync` | `CMS.Infrastructure.Repositories.MemberRepository` |
| `IClaimRepository` | `AddAsync`, `GetByMemberIdAsync`, `UpdateAsync` | `CMS.Infrastructure.Repositories.ClaimRepository` |
| `IPolicyRepository` | `GetByMemberIdAsync`, `AddAsync`, `AddDependentAsync` | `CMS.Infrastructure.Repositories.PolicyRepository` |
| `IPlanRepository` | `GetActivePlansAsync`, `GetByIdAsync` | `CMS.Infrastructure.Repositories.PlanRepository` |
| `IPaymentRepository` | `GetPendingPaymentsAsync`, `GetOverduePaymentsAsync` | `CMS.Infrastructure.Repositories.PaymentRepository` |

### Why Interfaces in the Application Layer?

- **Dependency Inversion** — The Application layer depends on abstractions, not concrete Infrastructure.
- **Testability** — `ClaimServiceTests.cs` (lines 16–29) substitutes `IMemberRepository` with an NSubstitute mock.
- **Separation of Concerns** — Switching from SQL Server to PostgreSQL requires only a new Infrastructure project, without touching Application or Domain.

---

## Notes

> The `ActivePlan` relationship on `Member` is legacy. The primary policy store is the `Policies` table, as evidenced by `PolicyService.cs` line 55 (`_policyRepository.GetByMemberIdAsync`).

---

## Summary

| Concept | Implementation Verification |
|---|---|
| Aggregates enforce invariants | `Member.SubmitClaim()` checks `ActivePlan` not null; `Policy.Lapse()` validates 30+ days overdue |
| Value objects replace primitives | `Money` and `Address` used throughout services and entities |
| Repository interfaces in Application layer | `IClaimRepository` defined in `CMS.Application`, implemented in `CMS.Infrastructure.Repositories` |
| EF Core maps DDD constructs | `ValueConverter` for `Money`, `OwnsOne` for `Address` |

This design ensures the domain remains pure (no dependency on EF Core or infrastructure concerns) while allowing efficient persistence.