# Dependency Injection & Service Lifetime

## Overview

The application uses **Microsoft Extensions Dependency Injection (DI)** container, built into ASP.NET Core. All services, repositories, and utilities are registered during application startup.

Key principles:

- **Constructor Injection** – Dependencies are passed via constructors (never `new` inside classes)
- **Explicit registration** – No auto-discovery; every dependency is manually registered
- **Scoped by default** – Most services use `AddScoped` (one instance per HTTP request)

---

## Registration Entry Points

Dependency registration is split across two modules:

| Module | File | Purpose |
|---|---|---|
| Application Layer | `CMS.Application.DependencyInjection` | Registers application services and external service interfaces |
| Infrastructure Layer | `CMS.Infrastructure.DependencyInjection` | Registers repositories, DbContext, security services |

The API project (`CMS.API`) calls both registration methods in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register application layer services
builder.Services.AddApplication();

// Register infrastructure layer services
builder.Services.AddInfrastructure(builder.Configuration);

// Register API controllers
builder.Services.AddControllers();
```

---

## Service Lifetime Decisions

| Lifetime | Behaviour | Used For | Example |
|---|---|---|---|
| **Singleton** | One instance for entire application lifetime | Stateless, thread-safe utilities | None in this codebase (explicitly avoided) |
| **Scoped** | One instance per HTTP request | Most services, repositories, `DbContext` | `MemberService`, `ClaimRepository`, `CmsDbContext` |
| **Transient** | New instance every time requested | Lightweight, stateless helpers | Not used (default is `Scoped`) |

### Why Scoped for `DbContext`?

`CmsDbContext` is registered as `Scoped` (by `AddDbContext`). This ensures:

- Same context instance throughout a single HTTP request
- Changes tracked across multiple repositories are saved together
- No cross-request state leakage

---

## Application Layer Registration

**File:** `src/backend/CMS.Application/DependencyInjection.cs`

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Authentication & Member Services
        services.AddScoped<IMemberService, MemberService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();  // Note: lives in Infrastructure!

        // Core Domain Services
        services.AddScoped<IClaimService, ClaimService>();
        services.AddScoped<IPlanService, PlanService>();
        services.AddScoped<IPolicyService, PolicyService>();

        // KYC & Verification
        services.AddScoped<IKycService, KycService>();
        services.AddScoped<IDocumentVerificationService, DocumentVerificationService>();

        // Payment & Premium
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IPremiumCalculatorService, PremiumCalculatorService>();
        services.AddScoped<IGracePeriodService, GracePeriodService>();

        // Communication
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IPdfGenerationService, PdfGenerationService>();

        return services;
    }
}
```

> **Observation — line 6:** `IJwtTokenGenerator` implementation lives in `CMS.Infrastructure.Security`, but registration is in the Application layer. This indicates a circular dependency risk — it should be moved to Infrastructure registration.

---

## Infrastructure Layer Registration

**File:** `src/backend/CMS.Infrastructure/DependencyInjection.cs`

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database Context (Scoped by default)
        services.AddDbContext<CmsDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("CmsDatabase"),
                sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
                    sqlOptions.CommandTimeout(120);
                    sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                })
            .EnableSensitiveDataLogging(false)
            .EnableDetailedErrors(false));

        // Repositories
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<IClaimRepository, ClaimRepository>();
        services.AddScoped<IPolicyRepository, PolicyRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IKycRepository, KycRepository>();

        // Security Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // Infrastructure Services
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IPdfGenerationService, PdfGenerationService>();
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}
```

> **Note:** `IPdfGenerationService` and `IEmailService` are registered in both Application and Infrastructure layers. This should be corrected — only Infrastructure should implement them.

---

## Constructor Injection Examples

### Example 1: `ClaimService` (6 dependencies)

**File:** `src/backend/CMS.Application/Services/ClaimService.cs` — lines 23–34

```csharp
public sealed class ClaimService : IClaimService
{
    private readonly IClaimRepository _claimRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IPlanRepository _planRepository;
    private readonly IAiVerificationService _aiVerificationService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<ClaimService> _logger;

    public ClaimService(
        IMemberRepository memberRepository,
        IClaimRepository claimRepository,
        IPlanRepository planRepository,
        IAiVerificationService aiVerificationService,
        IFileStorageService fileStorageService,
        ILogger<ClaimService> logger)
    {
        _memberRepository = memberRepository;
        _claimRepository = claimRepository;
        _planRepository = planRepository;
        _aiVerificationService = aiVerificationService;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }
}
```

What DI resolves automatically:

- `IMemberRepository` → `MemberRepository` *(Scoped)*
- `IClaimRepository` → `ClaimRepository` *(Scoped)*
- `ILogger<ClaimService>` → Built-in logging *(Singleton)*

### Example 2: `AuthService` (5 dependencies)

**File:** `src/backend/CMS.Application/Services/AuthService.cs` — lines 12–22

```csharp
public sealed class AuthService : IAuthService
{
    private readonly IMemberRepository _memberRepository;
    private readonly IPlanRepository _planRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly IPolicyRepository _policyRepository;

    public AuthService(
        IMemberRepository memberRepository,
        IPlanRepository planRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtGenerator,
        IPolicyRepository policyRepository)
    {
        _memberRepository = memberRepository;
        _planRepository = planRepository;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
        _policyRepository = policyRepository;
    }
}
```

### Example 3: Controller (API Layer)

**File:** `src/backend/CMS.API/Controllers/Admin/AdminMembersController.cs` — lines 12–17

```csharp
[AuthorizeAdmin]
[ApiController]
[Route("api/admin/members")]
public class AdminMembersController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;

    public AdminMembersController(IMemberRepository memberRepository)
    {
        _memberRepository = memberRepository;
    }
}
```

> **Note:** Controllers directly inject repositories here. This violates the thin controller principle — services should be injected instead.

---

## Angular DI (Frontend)

The Angular frontend uses its own DI system with `providedIn: 'root'` for singleton services.

### Example: `ClaimService`

**File:** `src/frontend/src/app/services/claim.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ClaimService {
  constructor(private http: HttpClient) {}

  submitClaim(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims`, data);
  }
}
```

### Component Injection

**File:** `src/frontend/src/app/claims/submit-claim/submit-claim.component.ts` — lines 24–28

```typescript
export class SubmitClaimComponent {
  constructor(
    private fb: FormBuilder,
    private claimService: ClaimService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
}
```

---

## Scoped vs Transient vs Singleton – Decision Matrix

| Use Case | Lifetime | Example in Codebase |
|---|---|---|
| `DbContext` | Scoped | `CmsDbContext` – each request gets its own |
| Repository | Scoped | `MemberRepository` – shares `DbContext` with services |
| Application Service | Scoped | `ClaimService` – holds request-scoped state |
| Logger | Singleton | `ILogger<T>` – thread-safe, app-wide |
| HTTP Client | Singleton | `HttpClient` (not shown, but typical) |
| JWT Generator | Scoped | `JwtTokenGenerator` – reads config per request |

### Why Not Use Singleton for Services?

If `ClaimService` were `Singleton`:

- One instance shared across all requests
- Cannot have request-specific state
- Must be thread-safe (difficult with `List<T>`)
- `DbContext` (Scoped) cannot be injected into a `Singleton`

> **Rule:** Always use `AddScoped` unless you have a specific reason to use `Singleton` or `Transient`.

---

## Dependency Injection Anti-Patterns (Avoid These)

| Anti-Pattern | Why It's Wrong | Correct Approach |
|---|---|---|
| `new Service()` inside constructor | Hard to test, tight coupling | Inject interface instead |
| Service Locator (`IServiceProvider.GetService`) | Hides dependencies, runtime errors | Constructor injection |
| Injecting `DbContext` into `Singleton` | `DbContext` is Scoped – causes memory leaks | Make service `Scoped` |
| Too many dependencies (>6) | Violates Single Responsibility Principle | Split service into smaller services |

---

## Unit Testing with DI – Mock Substitution

**File:** `src/backend/CMS.Tests/ClaimServiceTests.cs` — lines 16–29

```csharp
[Fact]
public async Task SubmitClaim_ShouldThrow_When_NoActivePlan()
{
    // Arrange – create mocks using NSubstitute
    var memberRepo = Substitute.For<IMemberRepository>();
    var claimRepo = Substitute.For<IClaimRepository>();
    var planRepo = Substitute.For<IPlanRepository>();
    var aiService = Substitute.For<IAiVerificationService>();
    var fileStorage = Substitute.For<IFileStorageService>();
    var logger = Substitute.For<ILogger<ClaimService>>();

    // Configure mock to return null (member not found)
    memberRepo.GetByIdWithActivePlanAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
        .Returns((Member?)null);

    // Act – create real service with mocked dependencies
    var service = new ClaimService(
        memberRepo, claimRepo, planRepo, aiService, fileStorage, logger);

    // Assert
    await Assert.ThrowsAsync<InvalidOperationException>(() =>
        service.SubmitClaimAsync(Guid.NewGuid(), new SubmitClaimRequest(), CancellationToken.None));
}
```

> **Pattern:** The test substitutes `IMemberRepository` with a mock, proving that DI enables unit testing without a real database.

---

## Summary

| Component | Lifetime | Registration Method | File |
|---|---|---|---|
| `CmsDbContext` | Scoped | `AddDbContext` | `Infrastructure.DependencyInjection` line 22 |
| `IMemberRepository` | Scoped | `AddScoped` | `Infrastructure.DependencyInjection` line 41 |
| `IClaimService` | Scoped | `AddScoped` | `Application.DependencyInjection` line 14 |
| `IAuthService` | Scoped | `AddScoped` | `Application.DependencyInjection` line 17 |
| `IPasswordHasher` | Scoped | `AddScoped` | `Infrastructure.DependencyInjection` line 50 |
| `ILogger<T>` | Singleton | Built-in | N/A – added by `AddLogging` |

The DI container ensures:

- **Correct lifetimes** – Scoped services dispose at request end
- **Circular dependency detection** – Container throws at startup if detected
- **Disposal** – Scoped services disposed automatically after request