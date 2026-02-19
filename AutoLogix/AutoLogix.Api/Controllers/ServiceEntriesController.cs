using AutoLogix.Api.Auth;
using AutoLogix.Application.Services;
using AutoLogix.Domain.Common;
using AutoLogix.Domain.Entities;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("vehicles/{vehicleId:guid}/services")]
    public class ServiceEntriesController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public ServiceEntriesController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /vehicles/{vehicleId}/services?page=1&pageSize=10
        [HttpGet]
        public async Task<IActionResult> GetServiceEntries(
            [FromRoute] Guid vehicleId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            if (page < 1) return BadRequest(new { message = "page must be >= 1" });
            if (pageSize < 1 || pageSize > 100) return BadRequest(new { message = "pageSize must be between 1 and 100" });

            var isServiceOrAdmin = User.IsInRole(UserRoles.Service) || User.IsInRole(UserRoles.Admin);

            bool vehicleExists;
            if (isServiceOrAdmin)
            {
                vehicleExists = await _dbContext.Vehicles.AsNoTracking().AnyAsync(v => v.Id == vehicleId, ct);
            }
            else
            {
                if (!User.TryGetUserId(out var userId))
                    return Unauthorized(new { message = "Invalid user token" });

                vehicleExists = await _dbContext.Vehicles.AsNoTracking()
                    .AnyAsync(v => v.Id == vehicleId && v.UserId == userId, ct);
            }

            if (!vehicleExists)
                return NotFound(new { message = "Vehicle not found" });

            var query = _dbContext.ServiceEntries
                .AsNoTracking()
                .Where(se => se.VehicleId == vehicleId);

            var totalCount = await query.CountAsync(ct);

            var entities = await query
                .OrderByDescending(se => se.ServiceDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var items = entities.Select(ServiceEntryMapper.ToResponse).ToList();
            return Ok(new { items, totalCount, page, pageSize });
        }

        // GET /vehicles/{vehicleId}/services/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetServiceEntryById(
            [FromRoute] Guid vehicleId,
            [FromRoute] Guid id,
            CancellationToken ct = default)
        {
            var isServiceOrAdmin = User.IsInRole(UserRoles.Service) || User.IsInRole(UserRoles.Admin);

            bool vehicleExists;
            if (isServiceOrAdmin)
            {
                vehicleExists = await _dbContext.Vehicles.AsNoTracking().AnyAsync(v => v.Id == vehicleId, ct);
            }
            else
            {
                if (!User.TryGetUserId(out var userId))
                    return Unauthorized(new { message = "Invalid user token" });

                vehicleExists = await _dbContext.Vehicles.AsNoTracking()
                    .AnyAsync(v => v.Id == vehicleId && v.UserId == userId, ct);
            }

            if (!vehicleExists)
                return NotFound(new { message = "Vehicle not found" });

            var entry = await _dbContext.ServiceEntries
                .AsNoTracking()
                .FirstOrDefaultAsync(se => se.Id == id && se.VehicleId == vehicleId, ct);

            if (entry == null)
                return NotFound(new { message = "Service entry not found" });

            return Ok(ServiceEntryMapper.ToResponse(entry));
        }

        // POST /vehicles/{vehicleId}/services
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.Service},{UserRoles.Admin}")]
        public async Task<IActionResult> CreateServiceEntry(
            [FromRoute] Guid vehicleId,
            [FromBody] CreateServiceEntryRequest dto,
            CancellationToken ct = default)
        {
            var vehicleExists = await _dbContext.Vehicles
                .AsNoTracking()
                .AnyAsync(v => v.Id == vehicleId, ct);

            if (!vehicleExists)
                return NotFound(new { message = "Vehicle not found" });

            var entry = new ServiceEntry
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                ServiceDate = dto.ServiceDate,
                MileageAtService = dto.MileageAtService,
                Title = dto.Title,
                Description = dto.Description,
                Cost = dto.Cost,
                WorkshopName = dto.WorkshopName,
                WorkshopAddress = dto.WorkshopAddress,
                NextServiceDate = dto.NextServiceDate,
                NextServiceMileage = dto.NextServiceMileage,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.ServiceEntries.Add(entry);
            await _dbContext.SaveChangesAsync(ct);

            return CreatedAtAction(
                nameof(GetServiceEntryById),
                new { vehicleId, id = entry.Id },
                ServiceEntryMapper.ToResponse(entry));
        }

        // PUT /vehicles/{vehicleId}/services/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.Service},{UserRoles.Admin}")]
        public async Task<IActionResult> UpdateServiceEntry(
            [FromRoute] Guid vehicleId,
            [FromRoute] Guid id,
            [FromBody] UpdateServiceEntryRequest dto,
            CancellationToken ct = default)
        {
            var vehicleExists = await _dbContext.Vehicles
                .AsNoTracking()
                .AnyAsync(v => v.Id == vehicleId, ct);

            if (!vehicleExists)
                return NotFound(new { message = "Vehicle not found" });

            var entry = await _dbContext.ServiceEntries
                .FirstOrDefaultAsync(se => se.Id == id && se.VehicleId == vehicleId, ct);

            if (entry == null)
                return NotFound(new { message = "Service entry not found" });

            entry.ServiceDate = dto.ServiceDate;
            entry.MileageAtService = dto.MileageAtService;
            entry.Title = dto.Title;
            entry.Description = dto.Description;
            entry.Cost = dto.Cost;
            entry.WorkshopName = dto.WorkshopName;
            entry.WorkshopAddress = dto.WorkshopAddress;
            entry.NextServiceDate = dto.NextServiceDate;
            entry.NextServiceMileage = dto.NextServiceMileage;
            entry.Notes = dto.Notes;
            entry.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(ct);

            return Ok(ServiceEntryMapper.ToResponse(entry));
        }

        // DELETE /vehicles/{vehicleId}/services/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.Service},{UserRoles.Admin}")]
        public async Task<IActionResult> DeleteServiceEntry(
            [FromRoute] Guid vehicleId,
            [FromRoute] Guid id,
            CancellationToken ct = default)
        {
            var vehicleExists = await _dbContext.Vehicles
                .AsNoTracking()
                .AnyAsync(v => v.Id == vehicleId, ct);

            if (!vehicleExists)
                return NotFound(new { message = "Vehicle not found" });

            var entry = await _dbContext.ServiceEntries
                .FirstOrDefaultAsync(se => se.Id == id && se.VehicleId == vehicleId, ct);

            if (entry == null)
                return NotFound(new { message = "Service entry not found" });

            _dbContext.ServiceEntries.Remove(entry);
            await _dbContext.SaveChangesAsync(ct);

            return NoContent();
        }
    }
}
