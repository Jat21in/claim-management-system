# ASP.NET Core Controllers – Thin API Layer

## Overview

The API layer (`CMS.API`) contains only **thin controllers**. Each controller:

- Receives HTTP requests
- Extracts user identity from JWT claims
- Delegates business logic to Application services
- Returns HTTP responses (`200`, `400`, `401`, `404`)

**No business logic** resides in controllers. This enables:

- Unit testing of services without HTTP context
- Reuse of the same service logic for different endpoints
- Clean separation of concerns

---

## Controller Inventory

| Controller | File | Routes | Authentication |
|---|---|---|---|
| `AuthController` | `AuthController.cs` | `/api/auth/*` | None (public) |
| `MembersController` | `MemberController.cs` | `/api/v1/members/*` | JWT required |
| `ClaimController` | *(inferred)* | `/api/v1/claims/*` | JWT required |
| `PlanController` | `PlanController.cs` | `/api/v1/plans/*` | JWT required |
| `PublicPlansController` | `PublicPlansController.cs` | `/api/v1/public/plans/*` | None (public) |
| `KycController` | `KycController.cs` | `/api/v1/kyc/*` | JWT required |
| `PremiumController` | `PremiumController.cs` | `/api/v1/premium/*` | Mixed (public + JWT) |
| `AdminMembersController` | `Admin/AdminMembersController.cs` | `/api/admin/members/*` | `[AuthorizeAdmin]` |
| `VerificationController` | `VerificationController.cs` | `/api/v1/verification/*` | Mixed |
| `TestController` | `TestController.cs` | `/api/test/*` | None (development) |

---

## 1. `AuthController` – Public Authentication

**File:** `src/backend/CMS.API/Controllers/AuthController.cs`

```csharp
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        await _authService.RegisterAsync(request, HttpContext.RequestAborted);
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request, HttpContext.RequestAborted);
        return Ok(result);
    }
}
```

| Method | Endpoint | Request Body | Response | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `RegisterRequest` | `200 OK` | Create new user account |
| `POST` | `/api/auth/login` | `LoginRequest` | `LoginResponse` | Authenticate and receive JWT |

> **Key Pattern — lines 7–9:** `[ApiController]` enables automatic model validation and `[FromBody]` inference.

---

## 2. `MembersController` – Authenticated Member Operations

**File:** `src/backend/CMS.API/Controllers/MemberController.cs`

```csharp
[Authorize]
[ApiController]
[Route("api/v1/members")]
public sealed class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;

    public MembersController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<MemberDashboardResponse>> GetMyDetails()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _memberService.GetMyDashboardAsync(memberId, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateMemberProfileRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.UpdateProfileAsync(memberId, request, HttpContext.RequestAborted);
        return Ok(new { message = "Profile updated successfully" });
    }
}
```

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/api/v1/members/me` | JWT required | Get current member's dashboard data |
| `PUT` | `/api/v1/members/profile` | JWT required | Update address and contact number |

> **Critical Pattern — line 17:** `User.FindFirstValue(ClaimTypes.NameIdentifier)` extracts the `MemberId` from the JWT token. This prevents tampering — users cannot access other members' data.

---

## 3. `PlanController` – Plan Assignment & Updates

**File:** `src/backend/CMS.API/Controllers/PlanController.cs`

```csharp
[Authorize]
[ApiController]
[Route("api/v1/plans")]
public sealed class PlanController : ControllerBase
{
    private readonly IMemberService _memberService;

    public PlanController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignPlan([FromBody] AssignPlanRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.AssignPlanAsync(memberId, request, HttpContext.RequestAborted);
        return Ok(new { message = "Plan assigned successfully" });
    }

    [HttpPut("update")]
    public async Task<IActionResult> UpdateMyPlan(UpdatePlanRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.UpdateActivePlanAsync(memberId, request, HttpContext.RequestAborted);
        return Ok(new { message = "Plan updated successfully" });
    }
}
```

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `POST` | `/api/v1/plans/assign` | JWT required | Assign a health plan to current member |
| `PUT` | `/api/v1/plans/update` | JWT required | Extend end date or increase coverage |

---

## 4. `PublicPlansController` – No Authentication Required

**File:** `src/backend/CMS.API/Controllers/PublicPlansController.cs`

```csharp
[ApiController]
[Route("api/v1/public/plans")]
public sealed class PublicPlansController : ControllerBase
{
    private readonly IPlanService _planService;

    public PublicPlansController(IPlanService planService)
    {
        _planService = planService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _planService.GetPublicPlansAsync();
        return Ok(plans);
    }

    [HttpGet("{planId:guid}")]
    public async Task<IActionResult> GetPlan(Guid planId)
    {
        var plan = await _planService.GetPublicPlanByIdAsync(planId);
        return Ok(plan);
    }
}
```

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/api/v1/public/plans` | None | List all active plans (landing page) |
| `GET` | `/api/v1/public/plans/{planId}` | None | Get single plan details |

> **Note:** No `[Authorize]` attribute — these endpoints are public for unauthenticated browsing.

---

## 5. `KycController` – Document Upload & Status

**File:** `src/backend/CMS.API/Controllers/KycController.cs`

```csharp
[Authorize]
[ApiController]
[Route("api/v1/kyc")]
public sealed class KycController : ControllerBase
{
    private readonly IKycService _kycService;

    public KycController(IKycService kycService)
    {
        _kycService = kycService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadKycDocument(
        [FromForm] SubmitKycRequest request,
        IFormFile file)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "File is required" });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { error = "File size cannot exceed 5MB" });

        using var stream = file.OpenReadStream();
        await _kycService.SubmitKycDocumentsAsync(memberId, request, stream, file.FileName, HttpContext.RequestAborted);

        return Ok(new { message = "KYC documents submitted successfully" });
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetKycStatus()
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var status = await _kycService.GetKycStatusAsync(memberId, HttpContext.RequestAborted);
        return Ok(status);
    }
}
```

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `POST` | `/api/v1/kyc/upload` | JWT required | Upload KYC document (PDF/JPG/PNG, max 5MB) |
| `GET` | `/api/v1/kyc/status` | JWT required | Get current KYC verification status |

> **Validation — lines 15–19:** File validation (size, presence) happens in the controller before reaching the service.

---

## 6. `PremiumController` – Mixed Authentication

**File:** `src/backend/CMS.API/Controllers/PremiumController.cs`

```csharp
[ApiController]
[Route("api/v1/premium")]
public sealed class PremiumController : ControllerBase
{
    private readonly IPremiumCalculatorService _premiumCalculator;
    private readonly IPlanRepository _planRepository;

    public PremiumController(IPremiumCalculatorService premiumCalculator, IPlanRepository planRepository)
    {
        _premiumCalculator = premiumCalculator;
        _planRepository = planRepository;
    }

    [HttpPost("calculate")]
    [AllowAnonymous]  // ← Public endpoint
    public async Task<IActionResult> CalculatePremium([FromBody] CalculatePremiumRequest request)
    {
        var plan = await _planRepository.GetByIdAsync(request.PlanId, HttpContext.RequestAborted);
        if (plan == null) return NotFound(new { error = "Plan not found" });

        var result = await _premiumCalculator.CalculatePremiumAsync(plan, request, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpPost("my-plan")]
    [Authorize]  // ← Authenticated only
    public async Task<IActionResult> CalculateMyPlanPremium([FromBody] CalculatePremiumRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var plan = await _planRepository.GetByIdAsync(request.PlanId, HttpContext.RequestAborted);

        if (plan == null) return NotFound(new { error = "Plan not found" });

        var result = await _premiumCalculator.CalculatePremiumAsync(plan, request, HttpContext.RequestAborted);
        return Ok(result);
    }
}
```

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `POST` | `/api/v1/premium/calculate` | None | Calculate premium (public – plan comparison) |
| `POST` | `/api/v1/premium/my-plan` | JWT required | Calculate premium for authenticated user's context |

> **Pattern:** `[AllowAnonymous]` vs `[Authorize]` — same service, different authentication requirements on the same controller.

---

## 7. `AdminMembersController` – Role-Based Authorization

**File:** `src/backend/CMS.API/Controllers/Admin/AdminMembersController.cs`

```csharp
[AuthorizeAdmin]  // Custom attribute – Roles = "Admin,ClaimsProcessor"
[ApiController]
[Route("api/admin/members")]
public class AdminMembersController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;

    public AdminMembersController(IMemberRepository memberRepository)
    {
        _memberRepository = memberRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllMembers()
    {
        var members = await _memberRepository.GetAllAsync(HttpContext.RequestAborted);

        var result = members.Select(m => new
        {
            m.MemberId,
            m.FullName,
            m.Email,
            m.Role,
            m.DateOfBirth,
            m.ContactNumber,
            m.CreatedAt,
            ActivePlan = m.ActivePlan == null ? null : new
            {
                m.ActivePlan.PlanId,
                m.ActivePlan.Name,
                m.ActivePlan.InsuredAmount
            },
            ClaimsCount = m.Claims.Count
        });

        return Ok(result);
    }
}
```

| Method | Endpoint | Authentication | Authorization |
|---|---|---|---|
| `GET` | `/api/admin/members` | JWT required | Only `Admin` or `ClaimsProcessor` role |

### Custom `[AuthorizeAdmin]` Attribute

**File:** `src/backend/CMS.API/Attributes/AuthorizeAdminAttribute.cs`

```csharp
public class AuthorizeAdminAttribute : AuthorizeAttribute
{
    public AuthorizeAdminAttribute()
    {
        Roles = "Admin,ClaimsProcessor";
    }
}
```

---

## 8. `VerificationController` – OTP for Phone Verification

**File:** `src/backend/CMS.API/Controllers/VerificationController.cs`

```csharp
[ApiController]
[Route("api/v1/verification")]
public class VerificationController : ControllerBase
{
    private readonly IDocumentVerificationService _verificationService;

    public VerificationController(IDocumentVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    [HttpPost("send-otp")]
    [Authorize]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _verificationService.GenerateOtpAsync(request.PhoneNumber, memberId, HttpContext.RequestAborted);
        return Ok(new { success = result });
    }

    [HttpPost("verify-otp")]
    [Authorize]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var memberId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isValid = await _verificationService.VerifyOtpAsync(request.PhoneNumber, request.Otp, memberId, HttpContext.RequestAborted);
        return Ok(new { isValid });
    }
}
```

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `POST` | `/api/v1/verification/send-otp` | JWT required | Send 6-digit OTP to phone via email |
| `POST` | `/api/v1/verification/verify-otp` | JWT required | Verify OTP code (5-minute expiry) |

---

## Thin Controller Validation

| Business Logic | Found in Controller? | Found in Service? |
|---|---|---|
| Password hashing | ❌ No | ✅ `AuthService` line 52 |
| JWT generation | ❌ No | ✅ `JwtTokenGenerator` lines 21–58 |
| Plan validity check | ❌ No | ✅ `MemberService.UpdateActivePlanAsync` lines 73–93 |
| KYC status routing | ❌ No | ✅ `KycService.GetKycStatusAsync` lines 85–118 |
| Premium calculation | ❌ No | ✅ `PremiumCalculatorService.CalculatePremiumAsync` lines 27–150 |

> All controllers successfully follow the thin controller pattern — they only parse input, call services, and format output.

---

## Summary – Controller Characteristics

| Controller | Authorization | Lines of Code | Dependencies | Service Methods Called |
|---|---|---|---|---|
| `AuthController` | None | 38 | 1 | 2 |
| `MembersController` | JWT | 56 | 1 | 2 |
| `PlanController` | JWT | 48 | 1 | 2 |
| `PublicPlansController` | None | 32 | 1 | 2 |
| `KycController` | JWT | 48 | 1 | 2 |
| `PremiumController` | Mixed | 56 | 2 | 2 |
| `AdminMembersController` | Admin role | 44 | 1 | 1 |
| `VerificationController` | JWT | 48 | 1 | 2 |

> All controllers are lean, typically under 60 lines, with no business logic.

---