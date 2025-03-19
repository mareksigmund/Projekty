using EventApp.Models;
using EventAPP.Data;
using EventAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventApp.Controllers
{
    [Authorize(Roles = "Admin,Moderator,Organizer")]
    public class ParticipationController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ParticipationController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin, Moderator, Organizer")]
        public async Task<IActionResult> ManageParticipations()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            IQueryable<Participation> participations = _context.Participations
                .Include(p => p.Event)
                .Include(p => p.User);

            if (User.IsInRole("Organizer"))
            {
                participations = participations.Where(p => p.Event.OrganizerId == userId);
            }

            return View(await participations.ToListAsync());
        }



        [HttpPost]
        public async Task<IActionResult> RemoveParticipation(int id)
        {
            var participation = await _context.Participations.FindAsync(id);
            if (participation == null)
            {
                TempData["ErrorMessage"] = "Nie znaleziono zapisu.";
                return RedirectToAction("ManageParticipations");
            }

            _context.Participations.Remove(participation);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Zapis został usunięty.";
            return RedirectToAction("ManageParticipations");
        }
    }
}
