using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [Route("diagnostics")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly EndpointDataSource _endpoints;

        public DiagnosticsController(EndpointDataSource endpoints)
        {
            _endpoints = endpoints;
        }

        // GET /diagnostics/endpoints
        [HttpGet("endpoints")]
        public IActionResult GetEndpoints()
        {
            var list = _endpoints.Endpoints
                .OfType<RouteEndpoint>()
                .Select(e => new
                {
                    Route = e.RoutePattern.RawText,
                    Methods = e.Metadata
                        .OfType<HttpMethodMetadata>()
                        .FirstOrDefault()?.HttpMethods
                })
                .OrderBy(x => x.Route)
                .ToList();

            return Ok(list);
        }
  

    [HttpGet("info")]
        public IActionResult Info() => Ok(new
        {
            machine = Environment.MachineName,
            timeUtc = DateTime.UtcNow,
            env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
        });

    }
}
