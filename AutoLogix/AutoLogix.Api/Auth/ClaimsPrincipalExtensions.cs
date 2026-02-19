using System.Security.Claims;

namespace AutoLogix.Api.Auth
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TryGetUserId(this ClaimsPrincipal user, out Guid userId)
        {
            userId = Guid.Empty;

            var claim = user.Claims.FirstOrDefault(c => c.Type == "userId")
                        ?? user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);

            return claim != null && Guid.TryParse(claim.Value, out userId);
        }
    }
}
