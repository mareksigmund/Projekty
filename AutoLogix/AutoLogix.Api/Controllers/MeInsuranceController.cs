using AutoLogix.Api.Auth;
using AutoLogix.Application.Insurance;
using AutoLogix.Domain.Common;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("me/insurance")]
    public class MeInsuranceController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public MeInsuranceController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /me/insurance/expiring?days=30&type=ANY
        [HttpGet("expiring")]
        public async Task<IActionResult> GetExpiringInsurance(
            [FromQuery] int days = 30,
            [FromQuery] string type = InsuranceTypes.ANY,
            CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            if (days < 1 || days > 365)
                return BadRequest(new { message = "days must be between 1 and 365" });

            var typeNormalized = (type ?? InsuranceTypes.ANY).Trim().ToUpperInvariant();
            if (typeNormalized is not (InsuranceTypes.ANY or InsuranceTypes.OC or InsuranceTypes.AC))
                return BadRequest(new { message = "type must be ANY, OC or AC" });

            var today = DateTime.UtcNow.Date;
            var limit = today.AddDays(days);

            var vehiclesQuery = _dbContext.Vehicles
                .AsNoTracking()
                .Where(v => v.UserId == userId);

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

                    // Make response consistent with requested type
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
    }
}
