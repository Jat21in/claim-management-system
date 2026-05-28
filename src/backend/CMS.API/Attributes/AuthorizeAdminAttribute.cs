using Microsoft.AspNetCore.Authorization;

namespace CMS.API.Attributes;

public class AuthorizeAdminAttribute : AuthorizeAttribute
{
    public AuthorizeAdminAttribute()
    {
        Roles = "Admin,ClaimsProcessor";
    }
}