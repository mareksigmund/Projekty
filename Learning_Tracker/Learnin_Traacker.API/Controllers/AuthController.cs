using FirebaseAdmin.Auth;
using Learnin_Traacker.API.Data;
using Learnin_Traacker.API.Dtos;
using LearningTracker.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Learnin_Traacker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("firebase-login")]
        public async Task<IActionResult> FirebaseLogin([FromBody] TokenDto dto)
        {
            try
            {
                var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(dto.IdToken);
                var uid = decoded.Uid;
                var email = decoded.Claims["email"]?.ToString() ?? "unknown";
                var user = _context.Users.FirstOrDefault(u => u.FirebaseUid == uid);
                if (user == null)
                {
                    user = new User
                    {
                        FirebaseUid = uid,
                        Email = email,
                        RegisteredAt = DateTime.UtcNow,
                        LastLogin = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                }
                else
                {
                    user.LastLogin = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "OK", userId = user.Id });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
        }
    }
}
