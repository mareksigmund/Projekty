using AutoLogix.Api.Auth;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("me")]
    public class MeController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public MeController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /me
        [HttpGet]
        public async Task<IActionResult> GetMe(CancellationToken ct)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var user = await _dbContext.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.Role,
                    u.CreatedAt,
                    u.LastLoginAt
                })
                .FirstOrDefaultAsync(ct);

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }
    }
}
