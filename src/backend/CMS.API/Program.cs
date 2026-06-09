using CMS.API.Middleware;
using CMS.Application;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Infrastructure;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Data.Seed;

using Hangfire;
using Hangfire.Dashboard;
using Hangfire.SqlServer;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

using System.Net;
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

            // ✅ FIX
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier
        };
    });

// Register layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:4200")
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

// ✅ Hangfire Configuration
builder.Services.AddHangfire(config =>
    config.UseSqlServerStorage(
        builder.Configuration.GetConnectionString("CmsDatabase"),
        new SqlServerStorageOptions
        {
            PrepareSchemaIfNecessary = true,
            QueuePollInterval = TimeSpan.FromSeconds(15)
        }));

builder.Services.AddHangfireServer();

// ✅ File Upload Limits
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
    options.MemoryBufferThreshold = int.MaxValue;
});

var app = builder.Build();

// ✅ Serve uploaded files
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "Uploads")),
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

// ✅ Recurring Background Jobs

RecurringJob.AddOrUpdate<IGracePeriodService>(
    "check-overdue-payments",
    service => service.CheckAndUpdateOverduePaymentsAsync(CancellationToken.None),
    Cron.Daily);

RecurringJob.AddOrUpdate<IGracePeriodService>(
    "send-grace-reminders",
    service => service.SendGracePeriodRemindersAsync(CancellationToken.None),
    Cron.Daily(9));

RecurringJob.AddOrUpdate<IPaymentService>(
    "check-lapsed-policies",
    service => service.CheckOverduePaymentsAndLapsePoliciesAsync(CancellationToken.None),
    Cron.Daily(1));

app.MapControllers();



app.Run();
