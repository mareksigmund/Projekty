using AutoLogix.Domain.Common;
using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Service},{UserRoles.Admin}")]
    [Route("service/vehicles")]
    public class ServiceVehiclesController : ControllerBase
    {
        private readonly AutoLogixDbContext _db;

        public ServiceVehiclesController(AutoLogixDbContext db)
        {
            _db = db;
        }

        // GET /service/vehicles/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken ct = default)
        {
            var v = await _db.Vehicles
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new ServiceVehicleDetailsResponse
                {
                    Id = x.Id.ToString(),
                    Brand = x.Brand,
                    Model = x.Model,
                    RegistrationNumber = x.RegistrationNumber,
                    Vin = x.Vin,
                    Year = x.Year,
                    Mileage = x.Mileage,
                    FuelType = x.FuelType,
                    EngineCapacity = x.EngineCapacity,
                    EnginePowerHp = x.EnginePowerHp
                })
                .FirstOrDefaultAsync(ct);

            if (v == null)
                return NotFound(new { message = "Vehicle not found" });

            return Ok(v);
        }

        // GET /service/vehicles/recent?take=5
        [HttpGet("recent")]
        public async Task<IActionResult> Recent([FromQuery] int take = 5, CancellationToken ct = default)
        {
            take = Math.Clamp(take, 1, 50);

            var items = await _db.Vehicles
                .AsNoTracking()
                .OrderByDescending(v => v.CreatedAt)
                .Take(take)
                .Select(v => new ServiceVehicleListItemResponse
                {
                    Id = v.Id.ToString(),
                    Brand = v.Brand,
                    Model = v.Model,
                    RegistrationNumber = v.RegistrationNumber,
                    Year = v.Year,
                    Mileage = v.Mileage,
                    Vin = v.Vin
                })
                .ToListAsync(ct);

            return Ok(items);
        }

        // GET /service/vehicles?query=...&page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? query = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 20 : pageSize;
            pageSize = Math.Min(pageSize, 50);

            var q = (query ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new PagedResponse<ServiceVehicleListItemResponse>
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = 0,
                    Items = new List<ServiceVehicleListItemResponse>()
                });
            }

            var qLower = q.ToLower();

            var baseQuery = _db.Vehicles.AsNoTracking().Where(v =>
                (v.RegistrationNumber != null && v.RegistrationNumber.ToLower().Contains(qLower)) ||
                (v.Vin != null && v.Vin.ToLower().Contains(qLower)) ||
                (v.Brand != null && v.Brand.ToLower().Contains(qLower)) ||
                (v.Model != null && v.Model.ToLower().Contains(qLower))
            );

            var total = await baseQuery.CountAsync(ct);

            var items = await baseQuery
                .OrderBy(v => v.Brand)
                .ThenBy(v => v.Model)
                .ThenBy(v => v.RegistrationNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(v => new ServiceVehicleListItemResponse
                {
                    Id = v.Id.ToString(),
                    Brand = v.Brand,
                    Model = v.Model,
                    RegistrationNumber = v.RegistrationNumber,
                    Vin = v.Vin,
                    Year = v.Year,
                    Mileage = v.Mileage
                })
                .ToListAsync(ct);

            return Ok(new PagedResponse<ServiceVehicleListItemResponse>
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = total,
                Items = items
            });
        }
    }

    public class ServiceVehicleListItemResponse
    {
        public string Id { get; set; } = default!;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? Vin { get; set; }
        public int? Year { get; set; }
        public int? Mileage { get; set; }
    }

    public class ServiceVehicleDetailsResponse : ServiceVehicleListItemResponse
    {
        public string? FuelType { get; set; }
        public int? EngineCapacity { get; set; }
        public int? EnginePowerHp { get; set; }
    }

    public class PagedResponse<T>
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<T> Items { get; set; } = new();
    }
}
