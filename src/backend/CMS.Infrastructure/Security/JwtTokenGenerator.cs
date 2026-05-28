using CMS.Application.Interfaces.Security;
using CMS.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JwtClaim = System.Security.Claims.Claim;

namespace CMS.Infrastructure.Security;

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

        //var claims = new[]
        //{
        //    new JwtClaim(JwtRegisteredClaimNames.Sub, member.MemberId.ToString()),
        //    new JwtClaim(JwtRegisteredClaimNames.Email, member.Email),
        //    new JwtClaim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

        //    // ✅ ADD THIS (CRITICAL FIX)
        //    new JwtClaim(System.Security.Claims.ClaimTypes.Role, member.Role)
        //};
        var claims = new[]
        {
            new JwtClaim(JwtRegisteredClaimNames.Sub, member.MemberId.ToString()),
            new JwtClaim(JwtRegisteredClaimNames.Email, member.Email),
            new JwtClaim(ClaimTypes.Role, member.Role),          // 👈 ADD THIS
            new JwtClaim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey));

        var creds = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
