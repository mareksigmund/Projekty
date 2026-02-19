using AutoLogix.Application.Auth;
using AutoLogix.Domain.Entities;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;
        private readonly IPasswordHasher<User> _hasher;
        private readonly ILogger<AuthController> _logger;
        private readonly IJwtProvider _jwtProvider;

        public AuthController(AutoLogixDbContext dbContext, IPasswordHasher<User> passwordHasher, ILogger<AuthController> logger, IJwtProvider jwtProvider)
        {
            _dbContext = dbContext;
            _hasher = passwordHasher;
            _logger = logger;
            _jwtProvider = jwtProvider;

        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest dtoUser, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = (dtoUser.Email ?? string.Empty).Trim();
            var emailNormalized = email.ToUpperInvariant();

            if (await _dbContext.Users.AnyAsync(u => u.EmailNormalized == emailNormalized, ct))
            {
                return Conflict(new { message = "Email is already registered" });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                EmailNormalized = emailNormalized,
                FirstName = dtoUser.FirstName,
                LastName = dtoUser.LastName,
                IsActive = true,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
            user.PasswordHash = _hasher.HashPassword(user, dtoUser.Password);

            try
            {
                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync(ct);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering new user with email {Email}", dtoUser.Email);
                return StatusCode(500, new { message = "An error occurred while registering the user" });
            }


            return Created($"/users/{user.Id}", new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.CreatedAt
            });
        }



        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest dtoUser, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = (dtoUser.Email ?? string.Empty).Trim();
            var emailNormalized = email.ToUpperInvariant();

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.EmailNormalized == emailNormalized, ct);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var verificationResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, dtoUser.Password);
            if (verificationResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var token = _jwtProvider.GenerateToken(user);

            user.LastLoginAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.LastLoginAt
                }
            });
        }

    }
}
