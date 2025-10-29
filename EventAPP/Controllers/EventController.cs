using EventApp.Enums;
using EventApp.Models;
using EventAPP.Data;
using EventAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventAPP.Controllers
{
    public class EventController : Controller
    {
        private readonly ApplicationDbContext _context;

        public EventController(ApplicationDbContext context)
        {
            _context = context;
        }

        // PRZEGLĄDANIE WYDARZEŃ (Dostępne dla wszystkich)
        // PRZEGLĄDANIE WYDARZEŃ (Dostępne dla wszystkich)
        public async Task<IActionResult> Index()
        {
            var events = await _context.Events
                .Include(e => e.Organizer)
                .ToListAsync();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var userParticipations = await _context.Participations
                .Where(p => p.UserId == userId)
                .Select(p => p.EventId)
                .ToListAsync();

            ViewBag.UserId = userId;
            ViewBag.UserParticipations = userParticipations;

            return View(events);
        }


        // SZCZEGÓŁY WYDARZENIA (Dostępne dla wszystkich)
        public async Task<IActionResult> Details(int id)
        {
            var eventDetails = await _context.Events
                .Include(e => e.Organizer)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (eventDetails == null || (eventDetails.Status != EventStatus.Planned && !User.Identity.IsAuthenticated))
            {
                return NotFound();
            }

            return View(eventDetails);
        }

        // DODAWANIE WYDARZENIA (Tylko dla organizatora lub admina)
        [Authorize(Roles = "Organizer,Admin")]
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [Authorize(Roles = "Organizer,Admin")]
        public async Task<IActionResult> Create(Event model)
        {
            ModelState.Clear();

            var organizerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(organizerId))
            {
                return View(model);
            }

            var organizerExists = await _context.Users.AnyAsync(u => u.Id == organizerId);
            if (!organizerExists)
            {
                return View(model);
            }

            model.OrganizerId = organizerId;

            if (ModelState.IsValid)
            {
                model.CreatedAt = DateTime.UtcNow;
                _context.Events.Add(model);
                await _context.SaveChangesAsync();

                TempData["SuccessMessage"] = "Wydarzenie dodane pomyślnie!";
                return RedirectToAction("Index");
            }

            return View(model);
        }

        // EDYCJA WYDARZENIA (Admin = pełne uprawnienia / Organizator = tylko swoje / Moderator = tylko swoje)
        [Authorize(Roles = "Organizer,Admin,Moderator")]
        public async Task<IActionResult> Edit(int id)
        {
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound();
            }

            if (User.IsInRole("Admin") ||
                (User.IsInRole("Organizer") && eventItem.OrganizerId == User.FindFirstValue(ClaimTypes.NameIdentifier)) ||
                (User.IsInRole("Moderator") && eventItem.OrganizerId == User.FindFirstValue(ClaimTypes.NameIdentifier)))
            {
                return View(eventItem);
            }

            return Forbid();
        }

        [HttpPost]
        [Authorize(Roles = "Organizer,Admin,Moderator")]
        public async Task<IActionResult> Edit(int id, Event model)
        {
            var eventItem = await _context.Events.FindAsync(id);
            if (eventItem == null)
            {
                return NotFound();
            }

            if (User.IsInRole("Admin") ||
                (User.IsInRole("Organizer") && eventItem.OrganizerId == User.FindFirstValue(ClaimTypes.NameIdentifier)) ||
                (User.IsInRole("Moderator") && eventItem.OrganizerId == User.FindFirstValue(ClaimTypes.NameIdentifier)))
            {
                eventItem.Title = model.Title;
                eventItem.Date = model.Date;
                eventItem.Location = model.Location;
                eventItem.MaxParticipants = model.MaxParticipants;
                eventItem.Description = model.Description;
                eventItem.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                TempData["SuccessMessage"] = "Wydarzenie zaktualizowano pomyślnie!";
                return RedirectToAction("Index");
            }

            return Forbid();
        }


        // USUWANIE WYDARZENIA (Admin = pełne uprawnienia / Organizator = tylko swoje / Moderator = tylko swoje)
        [Authorize(Roles = "Organizer,Admin,Moderator")]
        public async Task<IActionResult> Delete(int id)
        {
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound();
            }

            if (User.IsInRole("Admin") ||
                (User.IsInRole("Organizer") && eventItem.OrganizerId == User.FindFirstValue(ClaimTypes.NameIdentifier)) ||
                (User.IsInRole("Moderator") && eventItem.OrganizerId == User.FindFirstValue(ClaimTypes.NameIdentifier)))
            {
                _context.Events.Remove(eventItem);
                await _context.SaveChangesAsync();
                TempData["SuccessMessage"] = "Wydarzenie usunięto pomyślnie!";
                return RedirectToAction("Index");
            }

            return Forbid();
        }


        // ZAPISYWANIE SIĘ NA WYDARZENIE (Dostępne dla zalogowanych użytkowników)
        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> SignUp(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var eventItem = await _context.Events
                .Include(e => e.Participations)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (eventItem == null)
            {
                TempData["ErrorMessage"] = "Wydarzenie nie istnieje.";
                return RedirectToAction("Index");
            }

            if (eventItem.Participations.Any(p => p.UserId == userId))
            {
                TempData["ErrorMessage"] = "Jesteś już zapisany na to wydarzenie.";
                return RedirectToAction("Index");
            }

            if (eventItem.CurrentParticipants >= eventItem.MaxParticipants)
            {
                TempData["ErrorMessage"] = "Brak wolnych miejsc na to wydarzenie.";
                return RedirectToAction("Index");
            }

            // Zapisanie użytkownika
            var participation = new Participation
            {
                EventId = id,
                UserId = userId
            };

            eventItem.CurrentParticipants++;
            _context.Participations.Add(participation);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Pomyślnie zapisano na wydarzenie!";
            return RedirectToAction("Index");
        }
    }
}
