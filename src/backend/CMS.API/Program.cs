using CMS.API.Middleware;
using CMS.Application;
using CMS.Application.Interfaces.Services;
using CMS.Application.Services;
using CMS.Infrastructure;
using CMS.Infrastructure.Data;
using CMS.Infrastructure.Data.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
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

            // ✅🔥 THIS IS THE FIX YOU NEED
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

builder.Services.AddHttpClient<IAiVerificationService, GrokAiVerificationService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});


builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
    options.MemoryBufferThreshold = int.MaxValue;
});

var app = builder.Build();


//  DATABASE SEEDING 
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

app.MapControllers();

app.Run();