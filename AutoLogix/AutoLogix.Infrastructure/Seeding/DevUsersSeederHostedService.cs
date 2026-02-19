using AutoLogix.Domain.Common;
using AutoLogix.Domain.Entities;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Infrastructure.Seeding
{
    public class DevUsersSeederHostedService: IHostedService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _config;
        private readonly ILogger<DevUsersSeederHostedService> _logger;

        public DevUsersSeederHostedService(
            IServiceProvider serviceProvider,
            IConfiguration config,
            ILogger<DevUsersSeederHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _config = config;
            _logger = logger;
        }


        public async Task StartAsync(CancellationToken cancellationToken)
        {
            var enabled = _config.GetValue<bool>("DevSeed:Enabled");
            if (!enabled)
            {
                _logger.LogInformation("Dev seed is disabled (DevSeed:Enabled=false).");
                return;
            }

            var password = _config.GetValue<string>("DevSeed:Password");
            if (string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("Dev seed enabled but DevSeed:Password is missing. Skipping.");
                return;
            }

            using var scope = _serviceProvider.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<AutoLogixDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

            await SeedUserAsync(db, hasher, "admin@autologix.dev", UserRoles.Admin, password, cancellationToken);
            await SeedUserAsync(db, hasher, "insurer@autologix.dev", UserRoles.Insurer, password, cancellationToken);
            await SeedUserAsync(db, hasher, "service@autologix.dev", UserRoles.Service, password, cancellationToken);
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        private async Task SeedUserAsync(
            AutoLogixDbContext db,
            IPasswordHasher<User> hasher,
            string email,
            string role,
            string password,
            CancellationToken ct)
        {
            var normalized = email.Trim().ToUpperInvariant();

            var exists = await db.Users.AnyAsync(u => u.EmailNormalized == normalized, ct);
            if (exists)
            {
                _logger.LogInformation("Dev user already exists: {Email}", email);
                return;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email.Trim(),
                EmailNormalized = normalized,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                FirstName = role,
                LastName = "Account"
            };

            user.PasswordHash = hasher.HashPassword(user, password);

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);

            _logger.LogInformation("Dev user created: {Email} (Role: {Role})", email, role);
        }
    }
}