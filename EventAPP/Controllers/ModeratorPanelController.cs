using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventApp.Controllers
{
    [Authorize(Roles = "Moderator")]
    public class ModeratorPanelController : Controller
    {
        public IActionResult Index()
        {
            var userName = User.Identity.Name;
            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            ViewBag.UserName = userName;
            ViewBag.UserRole = userRole;

            return View();
        }
    }
}
