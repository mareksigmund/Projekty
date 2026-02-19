using AutoLogix.Application.Offers;
using AutoLogix.Domain.Common;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Insurer},{UserRoles.Admin}")]
    [Route("insurer/offer-requests")]
    public class InsurerOfferRequestsController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public InsurerOfferRequestsController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /insurer/offer-requests?status=Open
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] string status = OfferRequestStatuses.Open,
            CancellationToken ct = default)
        {
            var statusNorm = (status ?? OfferRequestStatuses.Open).Trim();

            // Basic validation (keeps API contract clean)
            if (statusNorm is not (OfferRequestStatuses.Open or OfferRequestStatuses.Cancelled or OfferRequestStatuses.Fulfilled))
            {
                return BadRequest(new
                {
                    message = "status must be Open, Cancelled or Fulfilled"
                });
            }

            // Only requests for vehicles with consent
            var query = _dbContext.InsuranceOfferRequests
                .AsNoTracking()
                .Where(r => r.Status == statusNorm)
                .Join(
                    _dbContext.Vehicles.AsNoTracking().Where(v => v.AllowInsuranceOffers),
                    r => r.VehicleId,
                    v => v.Id,
                    (r, v) => new { r, v }
                );

            var items = await query
                .OrderByDescending(x => x.r.CreatedAt)
                .Select(x => new InsurerOfferRequestResponse
                {
                    Id = x.r.Id,
                    VehicleId = x.v.Id,

                    VehicleBrand = x.v.Brand,
                    VehicleModel = x.v.Model,
                    VehicleRegistrationNumber = x.v.RegistrationNumber,

                    Type = x.r.Type,
                    Status = x.r.Status,
                    Message = x.r.Message,
                    CreatedAt = x.r.CreatedAt,
                    UpdatedAt = x.r.UpdatedAt
                })
                .ToListAsync(ct);

            return Ok(items);
        }
    }
}
