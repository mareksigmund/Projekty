using AutoLogix.Application.Insurance;
using AutoLogix.Application.Services;
using AutoLogix.Domain.Common;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = UserRoles.Insurer)]
    [Route("insurer/vehicles")]
    public class InsurerVehiclesController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public InsurerVehiclesController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /insurer/vehicles/expiring?days=30&type=ANY
        [HttpGet("expiring")]
        public async Task<IActionResult> GetVehiclesWithExpiringInsurance(
            [FromQuery] int days = 30,
            [FromQuery] string type = InsuranceTypes.ANY,
            CancellationToken ct = default)
        {
            if (days < 1 || days > 365)
                return BadRequest(new { message = "days must be between 1 and 365" });

            var typeNormalized = (type ?? InsuranceTypes.ANY).Trim().ToUpperInvariant();
            if (typeNormalized is not (InsuranceTypes.ANY or InsuranceTypes.OC or InsuranceTypes.AC))
                return BadRequest(new { message = "type must be ANY, OC or AC" });

            var today = DateTime.UtcNow.Date;
            var limit = today.AddDays(days);

            var vehiclesQuery = _dbContext.Vehicles
                .AsNoTracking()
                .Where(v => v.AllowInsuranceOffers);

            vehiclesQuery = typeNormalized switch
            {
                InsuranceTypes.OC => vehiclesQuery.Where(v =>
                    v.InsuranceOcDueDate.HasValue &&
                    v.InsuranceOcDueDate.Value.Date >= today &&
                    v.InsuranceOcDueDate.Value.Date <= limit),

                InsuranceTypes.AC => vehiclesQuery.Where(v =>
                    v.InsuranceAcDueDate.HasValue &&
                    v.InsuranceAcDueDate.Value.Date >= today &&
                    v.InsuranceAcDueDate.Value.Date <= limit),

                _ => vehiclesQuery.Where(v =>
                    (v.InsuranceOcDueDate.HasValue &&
                     v.InsuranceOcDueDate.Value.Date >= today &&
                     v.InsuranceOcDueDate.Value.Date <= limit)
                    ||
                    (v.InsuranceAcDueDate.HasValue &&
                     v.InsuranceAcDueDate.Value.Date >= today &&
                     v.InsuranceAcDueDate.Value.Date <= limit))
            };

            var vehicles = await vehiclesQuery
                .Select(v => new
                {
                    v.Id,
                    v.Brand,
                    v.Model,
                    v.RegistrationNumber,
                    v.InsuranceOcDueDate,
                    v.InsuranceAcDueDate
                })
                .ToListAsync(ct);

            var result = vehicles
                .Select(v =>
                {
                    int? ocDaysLeft = null;
                    int? acDaysLeft = null;

                    if (v.InsuranceOcDueDate.HasValue)
                    {
                        var d = v.InsuranceOcDueDate.Value.Date;
                        if (d >= today && d <= limit)
                            ocDaysLeft = (int)(d - today).TotalDays;
                    }

                    if (v.InsuranceAcDueDate.HasValue)
                    {
                        var d = v.InsuranceAcDueDate.Value.Date;
                        if (d >= today && d <= limit)
                            acDaysLeft = (int)(d - today).TotalDays;
                    }

                    return typeNormalized switch
                    {
                        InsuranceTypes.OC => new InsuranceExpiringVehicleResponse
                        {
                            VehicleId = v.Id,
                            Brand = v.Brand,
                            Model = v.Model,
                            RegistrationNumber = v.RegistrationNumber,
                            OcDueDate = v.InsuranceOcDueDate,
                            OcDaysLeft = ocDaysLeft
                        },

                        InsuranceTypes.AC => new InsuranceExpiringVehicleResponse
                        {
                            VehicleId = v.Id,
                            Brand = v.Brand,
                            Model = v.Model,
                            RegistrationNumber = v.RegistrationNumber,
                            AcDueDate = v.InsuranceAcDueDate,
                            AcDaysLeft = acDaysLeft
                        },

                        _ => new InsuranceExpiringVehicleResponse
                        {
                            VehicleId = v.Id,
                            Brand = v.Brand,
                            Model = v.Model,
                            RegistrationNumber = v.RegistrationNumber,
                            OcDueDate = v.InsuranceOcDueDate,
                            OcDaysLeft = ocDaysLeft,
                            AcDueDate = v.InsuranceAcDueDate,
                            AcDaysLeft = acDaysLeft
                        }
                    };
                })
                .Where(r => r.OcDaysLeft.HasValue || r.AcDaysLeft.HasValue)
                .OrderBy(r => Math.Min(r.OcDaysLeft ?? int.MaxValue, r.AcDaysLeft ?? int.MaxValue))
                .ToList();

            return Ok(result);
        }


        // GET /insurer/vehicles/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetVehicleDetails([FromRoute] Guid id, CancellationToken ct = default)
        {
            // Insurer widzi TYLKO pojazdy z allowInsuranceOffers = true
            var v = await _dbContext.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.AllowInsuranceOffers, ct);

            if (v == null)
                return NotFound(new { message = "Vehicle not found" });

            var dto = new InsurerVehicleDetailsResponse
            {
                Id = v.Id,
                Brand = v.Brand,
                Model = v.Model,
                RegistrationNumber = v.RegistrationNumber,
                Year = v.Year,
                Mileage = v.Mileage,
                Vin = v.Vin,
                FuelType = v.FuelType,
                EngineCapacity = v.EngineCapacity,
                EnginePowerHp = v.EnginePowerHp,
                InsuranceOcDueDate = v.InsuranceOcDueDate,
                InsuranceAcDueDate = v.InsuranceAcDueDate,
                AllowInsuranceOffers = v.AllowInsuranceOffers
            };

            return Ok(dto);
        }

        // GET /insurer/vehicles/{id}/services?page=1&pageSize=10
        [HttpGet("{id:guid}/services")]
        public async Task<IActionResult> GetVehicleServices(
            [FromRoute] Guid id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            if (page < 1) return BadRequest(new { message = "page must be >= 1" });
            if (pageSize < 1 || pageSize > 100) return BadRequest(new { message = "pageSize must be between 1 and 100" });

            var vehicleExists = await _dbContext.Vehicles
                .AsNoTracking()
                .AnyAsync(v => v.Id == id && v.AllowInsuranceOffers, ct);

            if (!vehicleExists)
                return NotFound(new { message = "Vehicle not found" });

            var query = _dbContext.ServiceEntries
                .AsNoTracking()
                .Where(se => se.VehicleId == id);

            var totalCount = await query.CountAsync(ct);

            var entities = await query
                .OrderByDescending(se => se.ServiceDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            // UWAGA: tu zakładam, że masz ServiceEntryMapper.ToResponse(...)
            var items = entities.Select(ServiceEntryMapper.ToResponse).ToList();

            return Ok(new { items, totalCount, page, pageSize });
        }
    }
}