using AutoLogix.Api.Auth;
using AutoLogix.Application.Offers;
using AutoLogix.Domain.Common;
using AutoLogix.Domain.Entities;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Insurer},{UserRoles.Admin}")]
    [Route("insurer/offers")]
    public class InsurerOffersController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public InsurerOffersController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /insurer/offers?status=Proposed
        [HttpGet]
        public async Task<IActionResult> GetMyOffers([FromQuery] string status = OfferStatuses.Proposed, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var insurerId))
                return Unauthorized(new { message = "Invalid user token" });

            var statusNorm = (status ?? OfferStatuses.Proposed).Trim();

            if (statusNorm is not (OfferStatuses.Proposed or OfferStatuses.Accepted or OfferStatuses.Rejected or OfferStatuses.Expired))
            {
                return BadRequest(new { message = "status must be Proposed, Accepted, Rejected or Expired" });
            }

            var items = await _dbContext.InsuranceOffers
                .AsNoTracking()
                .Where(o => o.InsurerUserId == insurerId && o.Status == statusNorm)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync(ct);

            return Ok(items.Select(InsuranceOfferMapper.ToResponse));
        }

        // POST /insurer/offers
        [HttpPost]
        public async Task<IActionResult> CreateOffer([FromBody] CreateInsuranceOfferRequest dto, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var insurerId))
                return Unauthorized(new { message = "Invalid user token" });

            var type = (dto.Type ?? string.Empty).Trim().ToUpperInvariant();
            if (type is not (InsuranceTypes.OC or InsuranceTypes.AC or InsuranceTypes.OC_AC))
                return BadRequest(new { message = "Type must be OC, AC or OC_AC" });

            if (dto.ValidTo <= dto.ValidFrom)
                return BadRequest(new { message = "ValidTo must be after ValidFrom" });

            // Determine vehicleId (prefer OfferRequestId)
            Guid vehicleId;

            InsuranceOfferRequest? request = null;

            if (dto.OfferRequestId.HasValue)
            {
                request = await _dbContext.InsuranceOfferRequests
                    .FirstOrDefaultAsync(r => r.Id == dto.OfferRequestId.Value, ct);

                if (request == null)
                    return NotFound(new { message = "Offer request not found" });

                if (request.Status != OfferRequestStatuses.Open)
                    return BadRequest(new { message = "Offer request is not open" });

                vehicleId = request.VehicleId;
            }
            else if (dto.VehicleId.HasValue)
            {
                vehicleId = dto.VehicleId.Value;
            }
            else
            {
                return BadRequest(new { message = "Provide OfferRequestId or VehicleId" });
            }

            // Vehicle must allow insurance offers (privacy)
            var vehicle = await _dbContext.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == vehicleId, ct);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            if (!vehicle.AllowInsuranceOffers)
                return BadRequest(new { message = "Insurance offers are not allowed for this vehicle" });

            // Create offer
            var offer = new InsuranceOffer
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                InsurerUserId = insurerId,
                OfferRequestId = dto.OfferRequestId,
                Type = type,
                Price = dto.Price,
                ValidFrom = dto.ValidFrom,
                ValidTo = dto.ValidTo,
                Description = dto.Description,
                Status = OfferStatuses.Proposed,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.InsuranceOffers.Add(offer);

            // Mark request as fulfilled (MVP: first offer fulfills request)
            if (request != null)
            {
                request.Status = OfferRequestStatuses.Fulfilled;
                request.UpdatedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(ct);

            return Created($"/insurer/offers/{offer.Id}", InsuranceOfferMapper.ToResponse(offer));
        }
    }
}
