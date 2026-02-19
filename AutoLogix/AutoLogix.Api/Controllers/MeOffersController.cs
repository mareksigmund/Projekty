using AutoLogix.Api.Auth;
using AutoLogix.Application.Offers;
using AutoLogix.Domain.Common;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
    [Route("me/offers")]
    public class MeOffersController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public MeOffersController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // GET /me/offers?status=Proposed
        [HttpGet]
        public async Task<IActionResult> GetMyOffers([FromQuery] string? status = null, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var query = _dbContext.InsuranceOffers
                .AsNoTracking()
                .Join(
                    _dbContext.Vehicles.AsNoTracking().Where(v => v.UserId == userId),
                    o => o.VehicleId,
                    v => v.Id,
                    (o, v) => o
                );

            if (!string.IsNullOrWhiteSpace(status))
            {
                var statusNorm = status.Trim();
                if (statusNorm is not (OfferStatuses.Proposed or OfferStatuses.Accepted or OfferStatuses.Rejected or OfferStatuses.Expired))
                    return BadRequest(new { message = "status must be Proposed, Accepted, Rejected or Expired" });

                query = query.Where(o => o.Status == statusNorm);
            }

            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync(ct);

            return Ok(items.Select(InsuranceOfferMapper.ToResponse));
        }

        // POST /me/offers/{id}/accept
        [HttpPost("{id:guid}/accept")]
        public async Task<IActionResult> Accept([FromRoute] Guid id, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var offer = await _dbContext.InsuranceOffers
                .FirstOrDefaultAsync(o => o.Id == id, ct);

            if (offer == null)
                return NotFound(new { message = "Offer not found" });

            // Ensure offer belongs to current user (via vehicle)
            var vehicle = await _dbContext.Vehicles
                .FirstOrDefaultAsync(v => v.Id == offer.VehicleId && v.UserId == userId, ct);

            if (vehicle == null)
                return NotFound(new { message = "Offer not found" });

            if (offer.Status != OfferStatuses.Proposed)
                return BadRequest(new { message = "Only Proposed offers can be accepted" });

            // expire check
            if (DateTime.UtcNow > offer.ValidTo)
            {
                offer.Status = OfferStatuses.Expired;
                offer.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(ct);
                return BadRequest(new { message = "Offer has expired" });
            }

            offer.Status = OfferStatuses.Accepted;
            offer.UpdatedAt = DateTime.UtcNow;

            var type = (offer.Type ?? string.Empty).Trim().ToUpperInvariant();

            if (type == InsuranceTypes.OC || type == InsuranceTypes.OC_AC)
                vehicle.InsuranceOcDueDate = offer.ValidTo;

            if (type == InsuranceTypes.AC || type == InsuranceTypes.OC_AC)
                vehicle.InsuranceAcDueDate = offer.ValidTo;


            // OPTIONAL: reject other proposed offers for the same request (or same vehicle+type)
            var otherOffersQuery = _dbContext.InsuranceOffers
                .Where(o => o.Id != offer.Id && o.Status == OfferStatuses.Proposed);

            if (offer.OfferRequestId.HasValue)
            {
                otherOffersQuery = otherOffersQuery.Where(o => o.OfferRequestId == offer.OfferRequestId);
            }
            else
            {
                
                otherOffersQuery = otherOffersQuery.Where(o => o.VehicleId == offer.VehicleId && o.Type == offer.Type);
            }

            var otherOffers = await otherOffersQuery.ToListAsync(ct);
            foreach (var o in otherOffers)
            {
                o.Status = OfferStatuses.Rejected;
                o.UpdatedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(ct);

            return Ok(InsuranceOfferMapper.ToResponse(offer));
        }


        // POST /me/offers/{id}/reject
        [HttpPost("{id:guid}/reject")]
        public async Task<IActionResult> Reject([FromRoute] Guid id, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var offer = await _dbContext.InsuranceOffers
                .FirstOrDefaultAsync(o => o.Id == id, ct);

            if (offer == null)
                return NotFound(new { message = "Offer not found" });

            var ownsVehicle = await _dbContext.Vehicles
                .AsNoTracking()
                .AnyAsync(v => v.Id == offer.VehicleId && v.UserId == userId, ct);

            if (!ownsVehicle)
                return NotFound(new { message = "Offer not found" });

            if (offer.Status != OfferStatuses.Proposed)
                return BadRequest(new { message = "Only Proposed offers can be rejected" });

            offer.Status = OfferStatuses.Rejected;
            offer.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(ct);

            return Ok(InsuranceOfferMapper.ToResponse(offer));
        }
    }
}
