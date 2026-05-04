using CMS.Domain.Entities;

namespace CMS.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) Generate(Member member);
}
