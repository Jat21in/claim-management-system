using CMS.API.Middleware;
using CMS.Application;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Infrastructure;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Data.Seed;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
});

// ✅ CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "http://localhost:5173",
                "https://salmon-desert-0e09f5300.7.azurestaticapps.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ✅ AI Verification HTTP Client
builder.Services.AddHttpClient<IAiVerificationService, GrokAiVerificationService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// =====================================================
// ✅ HANGFIRE CONFIGURATION - THIS WAS MISSING!
// =====================================================
builder.Services.AddHangfire(config =>
    config.UseSqlServerStorage(
        builder.Configuration.GetConnectionString("CmsDatabase"),
        new SqlServerStorageOptions
        {
            PrepareSchemaIfNecessary = true,  // ← This creates tables!
            QueuePollInterval = TimeSpan.FromSeconds(15)
        }));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Environment.ProcessorCount;
    options.Queues = new[] { "default", "critical", "background" };
});

// ✅ Add IRecurringJobManager registration
builder.Services.AddSingleton<IRecurringJobManager, RecurringJobManager>();

// File Upload Limits
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
    options.MemoryBufferThreshold = int.MaxValue;
});

builder.Services.AddLogging();

var app = builder.Build();

// ✅ Serve uploaded files
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// ✅ DATABASE SEEDING
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CmsDbContext>();
    await PlanSeeder.SeedAsync(dbContext);
}

// Swagger (only in dev)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Middleware order
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// =====================================================
// ✅ HANGFIRE DASHBOARD
// =====================================================
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "ClaimCore - Job Dashboard",
    StatsPollingInterval = 2000
});

// =====================================================
// ✅ REGISTER RECURRING JOBS
// =====================================================
var enableRecurringJobs = builder.Configuration.GetValue<bool>("Hangfire:EnableRecurringJobs", true);

if (enableRecurringJobs)
{
    using (var scope = app.Services.CreateScope())
    {
        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
        var gracePeriodService = scope.ServiceProvider.GetRequiredService<IGracePeriodService>();
        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();

        // Clear existing jobs first (prevents duplicates on restart)
        recurringJobManager.RemoveIfExists("check-overdue-payments");
        recurringJobManager.RemoveIfExists("send-grace-reminders");
        recurringJobManager.RemoveIfExists("check-lapsed-policies");

        // ✅ Job 1: Check overdue payments - Daily at 12:00 AM
        recurringJobManager.AddOrUpdate(
            "check-overdue-payments",
            () => gracePeriodService.CheckAndUpdateOverduePaymentsAsync(CancellationToken.None),
            Cron.Daily);

        // ✅ Job 2: Send grace period reminders - Daily at 9:00 AM
        recurringJobManager.AddOrUpdate(
            "send-grace-reminders",
            () => gracePeriodService.SendGracePeriodRemindersAsync(CancellationToken.None),
            Cron.Daily(9));

        // ✅ Job 3: Check lapsed policies - Daily at 1:00 AM
        recurringJobManager.AddOrUpdate(
            "check-lapsed-policies",
            () => paymentService.CheckOverduePaymentsAndLapsePoliciesAsync(CancellationToken.None),
            Cron.Daily(1));

        Console.WriteLine("Hangfire recurring jobs registered successfully!");
    }
}
else
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation(" Hangfire recurring jobs are DISABLED via environment variable.");
}

app.MapControllers();

app.Run();