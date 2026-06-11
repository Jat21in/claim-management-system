# Repository Pattern & Unit of Work

## Overview

The Repository pattern abstracts data access logic behind interfaces. The **Unit of Work** is implicitly managed by Entity Framework Core's `DbContext`.

- **Interfaces** defined in `CMS.Application.Interfaces.Repositories`
- **Implementations** in `CMS.Infrastructure.Repositories`
- **Unit of Work** = `CmsDbContext` (shared across repositories)

This separation allows:

- Mocking repositories in unit tests
- Switching database providers without changing application logic
- Centralised data access configuration

---

## Repository Interface Hierarchy

All interfaces live in `CMS.Application.Interfaces.Repositories`.

```csharp
// Base pattern – no generic repository (explicit interfaces per aggregate)
public interface IMemberRepository
{
    Task<Member?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Member?> GetByEmailAsync(string email, CancellationToken ct);
    Task<Member?> GetByIdWithActivePlanAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct);
    Task AddAsync(Member member, CancellationToken ct);
    Task UpdateAsync(Member member, CancellationToken ct);
    Task<IEnumerable<Member>> GetAllAsync(CancellationToken ct);
}
```

### Why No Generic Repository?

| Approach | Decision |
|---|---|
| Generic `IRepository<T>` | **Rejected** – leads to leaky abstractions (e.g., `GetById` for aggregates vs value objects) |
| Explicit interfaces per aggregate | **Accepted** – each aggregate has specific query requirements (e.g., `GetByMemberIdAsync` only on `IClaimRepository`) |

---

## Repository Implementations

### 1. `MemberRepository`

**File:** `src/backend/CMS.Infrastructure/Repositories/MemberRepository.cs`

| Method | Line(s) | EF Core Behaviour |
|---|---|---|
| `GetByIdAsync` | 17–23 | `AsNoTracking()` – read-only, no change tracking |
| `GetByIdWithActivePlanAsync` | 52–60 | `Include(m => m.ActivePlan)` – eager load related entity |
| `AddAsync` | 25–32 | Attaches existing plan as `Unchanged` to avoid duplicate insert |
| `UpdateAsync` | 34–38 | Marks entity as modified |

```csharp
public async Task<Member?> GetByIdWithActivePlanAsync(Guid memberId, CancellationToken cancellationToken)
{
    try
    {
        return await _dbContext.Members
            .AsNoTracking()
            .Include(m => m.ActivePlan)
            .FirstOrDefaultAsync(m => m.MemberId == memberId);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GetByIdWithActivePlanAsync: {ex.Message}");
        return null;
    }
}
```

> **Critical — line 57:** `AsNoTracking()` improves performance for read-only queries.

---

### 2. `ClaimRepository`

**File:** `src/backend/CMS.Infrastructure/Repositories/ClaimRepository.cs`

| Method | Line(s) | Key Detail |
|---|---|---|
| `AddAsync` | 17–21 | Adds new claim, calls `SaveChangesAsync` immediately |
| `GetByMemberIdAsync` | 23–40 | `AsNoTracking()` + `.Take(50)` – limits results for dashboard |
| `GetAllAsync` | 57–73 | `Include(c => c.Member)` – loads member for admin panel |
| `UpdateAsync` | 74–78 | Marks claim as modified and saves |

```csharp
public async Task<List<Claim>> GetByMemberIdAsync(Guid memberId, CancellationToken ct)
{
    try
    {
        return await _db.Claims
            .AsNoTracking()
            .Where(c => c.MemberId == memberId)
            .OrderByDescending(c => c.ClaimDate)
            .Take(50)
            .ToListAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
        return new List<Claim>();
    }
}
```

> **Pattern:** `try-catch` with empty list fallback prevents API crashes on database errors.

---

### 3. `PolicyRepository`

**File:** `src/backend/CMS.Infrastructure/Repositories/PolicyRepository.cs`

| Method | Line(s) | EF Core Feature |
|---|---|---|
| `GetByIdAsync` | 17–25 | Multiple `Include` navigation properties + `AsSplitQuery()` |
| `GetByMemberIdAsync` | 27–38 | Simple `FirstOrDefault` – no includes for performance |
| `AddDependentAsync` / `AddNomineeAsync` | 64–72 | Separate methods for child entities |

```csharp
public async Task<Policy?> GetByIdAsync(Guid policyId, CancellationToken cancellationToken)
{
    return await _context.Set<Policy>()
        .Include(p => p.Dependents)
        .Include(p => p.Nominees)
        .Include(p => p.Payments)
        .Include(p => p.Plan)
        .AsSplitQuery()  // ← Prevents cartesian explosion
        .FirstOrDefaultAsync(p => p.PolicyId == policyId, cancellationToken);
}
```

> **Why `AsSplitQuery()`?** Without it, EF Core generates a single query with multiple JOINs, causing duplicate rows. `AsSplitQuery()` executes separate queries and combines results in memory.

---

### 4. `PlanRepository`

**File:** `src/backend/CMS.Infrastructure/Repositories/PlanRepository.cs`

| Method | Line(s) | Behaviour |
|---|---|---|
| `GetByIdAsync` | 17–21 | No `AsNoTracking()` – entity must be tracked for updates |
| `GetActivePlansAsync` | 30–35 | `Where(p => p.IsActive)` – only return purchasable plans |
| `UpdateAsync` | 37–41 | Tracks and saves changes |

```csharp
public async Task<Plan?> GetByIdAsync(Guid planId, CancellationToken cancellationToken)
{
    // ✅ Remove AsNoTracking so EF tracks the entity
    return await _dbContext.Plans
        .FirstOrDefaultAsync(p => p.PlanId == planId, cancellationToken);
}
```

> **Critical:** No `AsNoTracking()` here because `Plan` is often updated (e.g., `UpdatePlanRequest` modifies dates/amounts).

---

### 5. `PaymentRepository`

**File:** `src/backend/CMS.Infrastructure/Repositories/PaymentRepository.cs`

| Method | Line(s) | Purpose |
|---|---|---|
| `GetPendingPaymentsAsync` | 30–50 | Includes `Policy` and `Member` for email notifications |
| `GetOverduePaymentsAsync` | 52–72 | Filters `DueDate < DateTime.UtcNow.AddDays(-30)` |
| `AddAsync` / `UpdateAsync` | 74–82 | Standard CRUD |

```csharp
public async Task<IEnumerable<PremiumPayment>> GetPendingPaymentsAsync(CancellationToken cancellationToken)
{
    var payments = await _context.Set<PremiumPayment>()
        .Include(p => p.Policy)
            .ThenInclude(policy => policy!.Member)
        .Where(p => p.Status == PaymentStatus.Pending)
        .ToListAsync(cancellationToken);

    return payments;
}
```

> **Pattern:** Eager loading (`Include` + `ThenInclude`) ensures all needed data is fetched in one round trip.

---

### 6. `KycRepository`

**File:** `src/backend/CMS.Infrastructure/Repositories/KycRepository.cs`

| Method | Line(s) | Key Feature |
|---|---|---|
| `GetPendingKycAsync` | 26–33 | `Where(!IsVerified && RejectionReason == null)` |
| `GetByMemberIdAsync` | 14–24 | Standard filter |
| `HasMemberSubmittedKycAsync` | 49–52 | Returns `bool` using `AnyAsync()` |

```csharp
public async Task<bool> HasMemberSubmittedKycAsync(Guid memberId, CancellationToken cancellationToken)
{
    return await _context.Set<KycDocument>()
        .AnyAsync(k => k.MemberId == memberId, cancellationToken);
}
```

---

## Unit of Work – `CmsDbContext`

**File:** `src/backend/CMS.Infrastructure/Data/CmsDbContext.cs`

The `DbContext` acts as the Unit of Work — it tracks changes to entities, manages transactions, and coordinates multiple repository operations.

### Key Configuration

| Line(s) | Setting | Purpose |
|---|---|---|
| 24–27 | `UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)` | Default to no-tracking for performance |
| 36–121 | `OnModelCreating` | Fluent API mappings for all entities |

```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    base.OnConfiguring(optionsBuilder);
    optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
}
```

> **Warning:** This makes all queries no-tracking by default. For updates, entities must be explicitly attached — as seen in `PlanRepository.GetByIdAsync`.

---

## Dependency Injection Registration

**File:** `src/backend/CMS.Infrastructure/DependencyInjection.cs`

All repositories are registered as `Scoped` — one instance per HTTP request.

| Line(s) | Registration |
|---|---|
| 41–43 | `AddScoped<IMemberRepository, MemberRepository>()` |
| 44 | `AddScoped<IPlanRepository, PlanRepository>()` |
| 45 | `AddScoped<IClaimRepository, ClaimRepository>()` |
| 46–48 | `AddScoped<IPolicyRepository, PolicyRepository>()` |
| 47 | `AddScoped<IPaymentRepository, PaymentRepository>()` |
| 48 | `AddScoped<IKycRepository, KycRepository>()` |

```csharp
public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
{
    services.AddDbContext<CmsDbContext>(options =>
        options.UseSqlServer(configuration.GetConnectionString("CmsDatabase"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(3)));

    services.AddScoped<IMemberRepository, MemberRepository>();
    services.AddScoped<IPlanRepository, PlanRepository>();
    services.AddScoped<IClaimRepository, ClaimRepository>();
    services.AddScoped<IPolicyRepository, PolicyRepository>();
    services.AddScoped<IPaymentRepository, PaymentRepository>();
    services.AddScoped<IKycRepository, KycRepository>();

    return services;
}
```

---

## Unit Test Example (Mocking Repository)

**File:** `src/backend/CMS.Tests/ClaimServiceTests.cs` — lines 16–29

```csharp
[Fact]
public async Task SubmitClaim_ShouldThrow_When_NoActivePlan()
{
    // Arrange
    var memberRepo = Substitute.For<IMemberRepository>();
    var claimRepo = Substitute.For<IClaimRepository>();

    memberRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
        .Returns((Member?)null);

    var service = new ClaimService(memberRepo, claimRepo, ...);

    // Act & Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() =>
        service.SubmitClaimAsync(Guid.NewGuid(), new SubmitClaimRequest(), CancellationToken.None));
}
```

> **Pattern:** NSubstitute creates a mock repository that returns `null`, triggering the "Member not found" exception.

---

## Summary

| Repository | Interface Location | Implementation Location | Key Feature |
|---|---|---|---|
| `IMemberRepository` | `CMS.Application.Interfaces.Repositories` | `CMS.Infrastructure.Repositories.MemberRepository` | `GetByIdWithActivePlanAsync` includes `ActivePlan` |
| `IClaimRepository` | `CMS.Application.Interfaces.Repositories` | `CMS.Infrastructure.Repositories.ClaimRepository` | `AsNoTracking()` + `.Take(50)` |
| `IPolicyRepository` | `CMS.Application.Interfaces.Repositories` | `CMS.Infrastructure.Repositories.PolicyRepository` | `AsSplitQuery()` for multiple includes |
| `IPlanRepository` | `CMS.Application.Interfaces.Repositories` | `CMS.Infrastructure.Repositories.PlanRepository` | No `AsNoTracking()` – allows updates |
| `IPaymentRepository` | `CMS.Application.Interfaces.Repositories` | `CMS.Infrastructure.Repositories.PaymentRepository` | `Include(p => p.Policy.Member)` |
| `IKycRepository` | `CMS.Application.Interfaces.Repositories` | `CMS.Infrastructure.Repositories.KycRepository` | `GetPendingKycAsync` filtering |

All repositories follow the same pattern:

- Constructor injection of `CmsDbContext`
- Async methods with `CancellationToken`
- `SaveChangesAsync()` called immediately after `Add` or `Update`
- Exception handling with console logging *(production should use `ILogger`)*