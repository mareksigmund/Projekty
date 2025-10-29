using EventApp.Models;
using EventAPP.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventApp.Controllers
{
    [Authorize(Roles = "User")]
    public class UserPanelController : Controller
    {
        private readonly ApplicationDbContext _context;

        public UserPanelController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var userEvents = await _context.Participations
                .Where(p => p.UserId == userId)
                .Include(p => p.Event)
                .ThenInclude(e => e.Organizer)
                .Select(p => p.Event)
                .ToListAsync();

            ViewBag.UserName = User.Identity.Name;
            ViewBag.UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            return View(userEvents);
        }

        [HttpPost]
        public async Task<IActionResult> CancelParticipation(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var participation = await _context.Participations
                .FirstOrDefaultAsync(p => p.EventId == id && p.UserId == userId);

            if (participation == null)
            {
                TempData["ErrorMessage"] = "Nie możesz zrezygnować z wydarzenia, na które nie jesteś zapisany.";
                return RedirectToAction("Index");
            }

            _context.Participations.Remove(participation);

            var eventItem = await _context.Events.FindAsync(id);
            if (eventItem != null)
            {
                eventItem.CurrentParticipants--; // Zmniejszamy liczbę zapisanych uczestników
            }

            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = $"Zrezygnowano z wydarzenia: {eventItem?.Title ?? "Nieznane wydarzenie"}";
            return RedirectToAction("Index");
        }
    }
}
