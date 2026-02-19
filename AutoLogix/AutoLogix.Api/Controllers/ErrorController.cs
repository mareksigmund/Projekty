using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AutoLogix.Api.Controllers
{
    [ApiController]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class ErrorController : ControllerBase
    {
        [Route("/error")]
        [HttpGet]
        public IActionResult Error()
        {
            // Optional: log exceptionFeature?.Error
            return Problem(
                title: "An unexpected error occurred.",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
}
