using AutoLogix.Api.Auth;
using AutoLogix.Application.Vehicle;
using AutoLogix.Domain.Common;
using AutoLogix.Domain.Entities;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
    [Route("vehicles")]
    [Authorize]
    public class VehiclesController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public VehiclesController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /vehicles?page=1&pageSize=10
        [HttpGet]
        public async Task<IActionResult> GetVehicles(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            if (page < 1) return BadRequest(new { message = "page must be >= 1" });
            if (pageSize < 1 || pageSize > 100) return BadRequest(new { message = "pageSize must be between 1 and 100" });

            var query = _dbContext.Vehicles
                .AsNoTracking()
                .Where(v => v.UserId == userId);

            var totalCount = await query.CountAsync(ct);

            var vehicles = await query
                .OrderByDescending(v => v.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var items = vehicles.Select(VehicleMapper.ToResponse).ToList();

            return Ok(new { items, totalCount, page, pageSize });
        }

        // GET /vehicles/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetVehicleById([FromRoute] Guid id, CancellationToken ct)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var vehicle = await _dbContext.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId, ct);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            return Ok(VehicleMapper.ToResponse(vehicle));
        }

        // POST /vehicles
        [HttpPost]
        public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleRequest dto, CancellationToken ct)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Brand = dto.Brand,
                Model = dto.Model,
                Version = dto.Version,
                RegistrationNumber = dto.RegistrationNumber,
                Vin = dto.Vin,
                Year = dto.Year,
                Mileage = dto.Mileage,
                FuelType = dto.FuelType,
                EngineCapacity = dto.EngineCapacity,
                EnginePowerHp = dto.EnginePowerHp,
                FirstRegistrationDate = dto.FirstRegistrationDate,
                TechnicalInspectionDueDate = dto.TechnicalInspectionDueDate,
                InsuranceOcDueDate = dto.InsuranceOcDueDate,
                InsuranceAcDueDate = dto.InsuranceAcDueDate,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                AllowInsuranceOffers = dto.AllowInsuranceOffers,
            };

            _dbContext.Vehicles.Add(vehicle);
            await _dbContext.SaveChangesAsync(ct);

            return CreatedAtAction(
                nameof(GetVehicleById),
                new { id = vehicle.Id },
                VehicleMapper.ToResponse(vehicle));
        }

        // PUT /vehicles/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateVehicle([FromRoute] Guid id, [FromBody] UpdateVehicleRequest dto, CancellationToken ct)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var vehicle = await _dbContext.Vehicles
                .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId, ct);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            vehicle.Brand = dto.Brand;
            vehicle.Model = dto.Model;
            vehicle.RegistrationNumber = dto.RegistrationNumber;
            vehicle.Version = dto.Version;
            vehicle.Vin = dto.Vin;
            vehicle.Year = dto.Year;
            vehicle.Mileage = dto.Mileage;
            vehicle.FuelType = dto.FuelType;
            vehicle.EngineCapacity = dto.EngineCapacity;
            vehicle.EnginePowerHp = dto.EnginePowerHp;
            vehicle.FirstRegistrationDate = dto.FirstRegistrationDate;
            vehicle.TechnicalInspectionDueDate = dto.TechnicalInspectionDueDate;
            vehicle.InsuranceOcDueDate = dto.InsuranceOcDueDate;
            vehicle.InsuranceAcDueDate = dto.InsuranceAcDueDate;
            vehicle.Notes = dto.Notes;
            vehicle.UpdatedAt = DateTime.UtcNow;
            vehicle.AllowInsuranceOffers = dto.AllowInsuranceOffers;

            await _dbContext.SaveChangesAsync(ct);

            return Ok(VehicleMapper.ToResponse(vehicle));
        }

        // DELETE /vehicles/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteVehicle([FromRoute] Guid id, CancellationToken ct)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var vehicle = await _dbContext.Vehicles
                .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId, ct);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            _dbContext.Vehicles.Remove(vehicle);
            await _dbContext.SaveChangesAsync(ct);

            return NoContent();
        }
    }
}
