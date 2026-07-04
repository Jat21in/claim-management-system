using CMS.API.Middleware;
using CMS.Application;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Infrastructure;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Data.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// JWT Authentication
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["SecretKey"]!)
            ),

            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier
        };
    });

// Register layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://localhost:5173",
                "https://salmon-desert-0e09f5300.7.azurestaticapps.net",
                "https://yourdomain.com"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// AI Verification HTTP Client
builder.Services.AddHttpClient<IAiVerificationService, GrokAiVerificationService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// File Upload Limits
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024;
    options.MemoryBufferThreshold = int.MaxValue;
});

builder.Services.AddLogging();

var app = builder.Build();

// Serve uploaded files
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

var membersPath = Path.Combine(uploadsPath, "Members");
if (!Directory.Exists(membersPath))
{
    Directory.CreateDirectory(membersPath);
}

var claimsPath = Path.Combine(uploadsPath, "Claims");
if (!Directory.Exists(claimsPath))
{
    Directory.CreateDirectory(claimsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=86400");
    }
});

// Database Seeding - with retry
var maxRetries = 5;
var retryDelay = TimeSpan.FromSeconds(5);

for (int i = 0; i < maxRetries; i++)
{
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CmsDbContext>();
            Console.WriteLine($"🔄 Attempt {i + 1} of {maxRetries} to connect to database...");

            // Test connection
            await dbContext.Database.CanConnectAsync();

            await PlanSeeder.SeedAsync(dbContext);
            Console.WriteLine("✅ Database seeded successfully.");
            break;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Database attempt {i + 1} failed: {ex.Message}");
        if (i == maxRetries - 1)
        {
            Console.WriteLine("❌ All database connection attempts failed. Continuing without database...");
        }
        else
        {
            Console.WriteLine($"🔄 Waiting {retryDelay.TotalSeconds} seconds before retry...");
            await Task.Delay(retryDelay);
        }
    }
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();