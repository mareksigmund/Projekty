using AutoLogix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        private readonly AutoLogixDbContext _dbContext;

        public HealthController(AutoLogixDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetHealth([FromQuery] bool db = false)
        {
            var timestamp = DateTime.UtcNow;

            if (!db)
            {
                return Ok(new { status = "OK", timestamp });
            }

            try
            {
                var dbIsHealthy = await _dbContext.Database.CanConnectAsync();
                if (dbIsHealthy)
                {
                    return Ok(new { status = "OK", database = "healthy", timestamp });
                }
                else
                {
                    return StatusCode(503, new { status = "Database is unhealthy", timestamp });
                }
            }
            catch (Exception)
            {
                return StatusCode(503, new { status = "Database is unhealthy", timestamp });
            }
        }
    }
}
