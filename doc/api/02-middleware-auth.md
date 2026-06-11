# Middleware & Authentication

## Overview

The API uses a pipeline of middleware components that process every HTTP request. Key components:

- **Global Exception Middleware** – Catches unhandled exceptions and returns consistent error responses
- **JWT Authentication Middleware** – Validates tokens and populates `HttpContext.User`
- **Authorization Middleware** – Enforces `[Authorize]` and `[AuthorizeAdmin]` attributes

---

## Middleware Pipeline Order

**File:** `src/backend/CMS.API/Program.cs`

```csharp
var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();  // 1. Catches exceptions
app.UseAuthentication();                          // 2. Validates JWT
app.UseAuthorization();                           // 3. Checks roles/policies
app.MapControllers();                             // 4. Routes to controllers

app.Run();
```

| Order | Middleware | Responsibility |
|---|---|---|
| 1st | `GlobalExceptionMiddleware` | Wraps everything – catches exceptions from downstream |
| 2nd | Authentication | Reads JWT from `Authorization` header, validates, sets `User` |
| 3rd | Authorization | Checks `[Authorize]` attributes against `User` roles |
| 4th | Endpoint / `MapControllers` | Invokes the matching controller action |

> **Order is critical:** If authentication is registered after controllers, `[Authorize]` attributes fail silently.

---

## 1. Global Exception Middleware

**File:** `src/backend/CMS.API/Middleware/GlobalExceptionMiddleware.cs`

```csharp
public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);  // Pass request to next middleware
        }
        catch (InvalidOperationException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = ex.Message
            }));
        }
        catch (Exception)
        {
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = "An unexpected error occurred."
            }));
        }
    }
}
```

| Exception Type | HTTP Status | Response Body |
|---|---|---|
| `InvalidOperationException` | `400 Bad Request` | `{ error: "message" }` |
| Any other `Exception` | `500 Internal Server Error` | `{ error: "An unexpected error occurred." }` |

### Example in Service

**File:** `src/backend/CMS.Application/Services/ClaimService.cs` — lines 61–63

```csharp
if (member.ActivePlan == null)
    throw new InvalidOperationException("Member does not have an active plan.");
```

When this exception is thrown, it propagates up through service → controller → middleware, where `GlobalExceptionMiddleware` catches it and returns `400 Bad Request`.

> **Security benefit:** Generic `500` responses for unknown exceptions prevent leaking implementation details to clients.

---

## 2. JWT Authentication Middleware

### Token Generation

**File:** `src/backend/CMS.Infrastructure/Security/JwtTokenGenerator.cs`

```csharp
public sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) Generate(Member member)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["SecretKey"]!;
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"]!);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, member.MemberId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, member.MemberId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, member.Email),
            new Claim(ClaimTypes.Role, member.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
```

### JWT Configuration

**File:** `src/backend/CMS.API/appsettings.json` — lines 13–18

```json
"Jwt": {
    "Issuer": "cms-api",
    "Audience": "cms-client",
    "SecretKey": "THIS_IS_A_SUPER_LONG_32_CHAR_SECRET_KEY_123!",
    "ExpiryMinutes": 60
}
```

### Token Validation (ASP.NET Core Built-in)

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!))
        };
    });
```

### Token Contents (Decoded Example)

```json
{
  "sub": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "john@example.com",
  "role": "Member",
  "exp": 1749876543,
  "iss": "cms-api",
  "aud": "cms-client"
}
```

---

## 3. Custom Authorization Attribute

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

When a request arrives at an `[AuthorizeAdmin]` endpoint:

1. JWT middleware extracts the `role` claim from the token
2. Authorization middleware compares the claim value against `"Admin,ClaimsProcessor"`
3. If match → request proceeds
4. If no match → returns `403 Forbidden`

---

## 4. Angular Interceptor Integration

The frontend automatically attaches the JWT token to every outgoing request.

**File:** `src/frontend/src/app/interceptors/jwt.interceptor.ts`

```typescript
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
```

**Registration** — `src/frontend/src/main.ts` line 15:

```typescript
provideHttpClient(withInterceptors([jwtInterceptor, httpErrorInterceptor]))
```

---

## Security Summary

| Concern | Implementation | File Reference |
|---|---|---|
| Password hashing | BCrypt | `PasswordHasher.cs` lines 8–16 |
| JWT generation | HMAC-SHA256 | `JwtTokenGenerator.cs` lines 21–58 |
| JWT validation | ASP.NET Core middleware | `Program.cs` |
| Role-based authorization | `[AuthorizeAdmin]` attribute | `AuthorizeAdminAttribute.cs` lines 5–10 |
| Global exception handling | Custom middleware | `GlobalExceptionMiddleware.cs` lines 15–40 |
| Token attachment (frontend) | HTTP interceptor | `jwt.interceptor.ts` lines 16–20 |
| `401` handling (frontend) | Error interceptor | `http-error.interceptor.ts` lines 14–16 |

---

## Environment-Specific Configuration

**Development** (`appsettings.Development.json`):

- Logging: `"Microsoft.AspNetCore": "Warning"`
- Detailed errors enabled

**Production** (`appsettings.json`):

- JWT secret key must be moved to environment variables or Azure Key Vault
- AI mock mode disabled: `"UseMockInDevelopment": false`
- SQL Server connection string uses secure authentication

---

## Common Authentication Errors & Responses

| Error Scenario | HTTP Status | Response Body |
|---|---|---|
| No token provided | `401 Unauthorized` | Empty (ASP.NET default) |
| Expired token | `401 Unauthorized` | Empty |
| Invalid signature | `401 Unauthorized` | Empty |
| Valid token, wrong role | `403 Forbidden` | Empty |
| Valid token, business rule violation | `400 Bad Request` | `{ error: "Specific message" }` |
| Server error | `500 Internal Server Error` | `{ error: "An unexpected error occurred." }` |

> `401` and `403` responses are intentionally generic to avoid information disclosure.