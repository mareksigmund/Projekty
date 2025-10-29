using Learnin_Traacker.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Learnin_Traacker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
                public UserController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyUserData([FromQuery] string uid)
        {
            if (string.IsNullOrEmpty(uid))
            {
                return BadRequest("Brak UID");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.FirebaseUid == uid);


            if (user == null)
                return NotFound("Użytkownik nie istnieje");

            return Ok(user);
        }


        [HttpPut("me/displayname")]
        public async Task<IActionResult> UpdateDisplayName([FromQuery] string uid, [FromBody] UpdateDisplayNameDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.DisplayName))
                return BadRequest("DisplayName is required.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.FirebaseUid == uid);
            if (user == null)
                return NotFound();

            user.DisplayName = dto.DisplayName;
            await _context.SaveChangesAsync();

            return NoContent();
        }

    }
}
