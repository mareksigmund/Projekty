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
    [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
    [Route("me/offer-requests")]
    public class MeOfferRequestsController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public MeOfferRequestsController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // POST /me/offer-requests
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOfferRequestRequest dto, CancellationToken ct)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var type = (dto.Type ?? string.Empty).Trim().ToUpperInvariant();
            if (type is not (InsuranceTypes.OC or InsuranceTypes.AC or InsuranceTypes.OC_AC))
                return BadRequest(new { message = "Type must be OC, AC or OC_AC" });

            // Vehicle must belong to user
            var vehicle = await _dbContext.Vehicles
                .FirstOrDefaultAsync(v => v.Id == dto.VehicleId && v.UserId == userId, ct);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            // Consent required (privacy)
            if (!vehicle.AllowInsuranceOffers)
                return BadRequest(new { message = "Insurance offers are not allowed for this vehicle" });

            // Prevent spam: only one OPEN request per (vehicle,type)
            var exists = await _dbContext.InsuranceOfferRequests
                .AsNoTracking()
                .AnyAsync(r => r.VehicleId == dto.VehicleId && r.Type == type && r.Status == OfferRequestStatuses.Open, ct);

            if (exists)
                return Conflict(new { message = "An open request for this vehicle and type already exists" });

            var req = new InsuranceOfferRequest
            {
                Id = Guid.NewGuid(),
                VehicleId = dto.VehicleId,
                RequestedByUserId = userId,
                Type = type,
                Status = OfferRequestStatuses.Open,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.InsuranceOfferRequests.Add(req);
            await _dbContext.SaveChangesAsync(ct);

            return Created($"/me/offer-requests/{req.Id}", OfferRequestMapper.ToResponse(req));
        }

        // GET /me/offer-requests?status=Open
        [HttpGet]
        public async Task<IActionResult> GetMine([FromQuery] string? status = null, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var query = _dbContext.InsuranceOfferRequests
                .AsNoTracking()
                .Where(r => r.RequestedByUserId == userId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                var statusNorm = status.Trim();

                // Optional but clean: validate known statuses
                if (statusNorm is not (OfferRequestStatuses.Open or OfferRequestStatuses.Cancelled or OfferRequestStatuses.Fulfilled))
                {
                    return BadRequest(new { message = "status must be Open, Cancelled or Fulfilled" });
                }

                query = query.Where(r => r.Status == statusNorm);
            }

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);

            return Ok(items.Select(OfferRequestMapper.ToResponse));
        }

        // POST /me/offer-requests/{id}/cancel
        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> Cancel([FromRoute] Guid id, CancellationToken ct = default)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { message = "Invalid user token" });

            var req = await _dbContext.InsuranceOfferRequests
                .FirstOrDefaultAsync(r => r.Id == id && r.RequestedByUserId == userId, ct);

            if (req == null)
                return NotFound(new { message = "Offer request not found" });

            if (req.Status != OfferRequestStatuses.Open)
                return BadRequest(new { message = "Only Open requests can be cancelled" });

            req.Status = OfferRequestStatuses.Cancelled;
            req.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(ct);

            return Ok(OfferRequestMapper.ToResponse(req));
        }
    }
}
