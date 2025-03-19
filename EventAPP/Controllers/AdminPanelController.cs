using EventApp.Enums;
using EventApp.Models;
using EventAPP.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventApp.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminPanelController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;

        public AdminPanelController(UserManager<User> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        public IActionResult Index()
        {
            var userName = User.Identity.Name;
            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            ViewBag.UserName = userName;
            ViewBag.UserRole = userRole;

            return View();
        }

        [HttpGet]
        public async Task<IActionResult> SystemStats()
        {
            ViewBag.TotalUsers = await _userManager.Users.CountAsync();
            ViewBag.TotalEvents = await _context.Events.CountAsync();
            ViewBag.TotalParticipations = await _context.Participations.CountAsync(); // <- Poprawiono na poprawne zliczanie
            return View();
        }


        // Lista użytkowników
        [HttpGet]
        public async Task<IActionResult> ManageUsers()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var users = await _userManager.Users
                .Where(u => u.Id != currentUserId)
                .ToListAsync();

            return View(users);
        }

        // Edycja roli użytkownika
        [HttpGet]
        public async Task<IActionResult> EditUserRole(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var roles = new[] { "User", "Moderator", "Organizer" };
            ViewBag.Roles = roles;

            return View(user);
        }

        [HttpPost]
        public async Task<IActionResult> EditUserRole(string id, string selectedRole)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, selectedRole);

            if (Enum.TryParse(selectedRole, out UserRole newRole))
            {
                user.Role = newRole;
            }
            else
            {
                TempData["ErrorMessage"] = "Wystąpił błąd podczas przypisywania roli.";
                return RedirectToAction("ManageUsers");
            }

            await _userManager.UpdateAsync(user);
            TempData["SuccessMessage"] = "Rola użytkownika została zaktualizowana.";
            return RedirectToAction("ManageUsers");
        }

        [HttpPost]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            await _userManager.DeleteAsync(user);

            TempData["SuccessMessage"] = "Użytkownik został usunięty.";
            return RedirectToAction("ManageUsers");
        }

        [HttpGet]
        public IActionResult CreateUser()
        {
            ViewBag.Roles = new[] { "User", "Moderator", "Organizer" };
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser(string email, string password, string selectedRole, string name)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password) ||
                string.IsNullOrEmpty(selectedRole) || string.IsNullOrEmpty(name))
            {
                TempData["ErrorMessage"] = "Wszystkie pola są wymagane.";
                ViewBag.Roles = new[] { "User", "Moderator", "Organizer" };
                return View();
            }

            var user = new User
            {
                UserName = email,
                Email = email,
                Name = name,
                Role = Enum.Parse<UserRole>(selectedRole)
            };

            var result = await _userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, selectedRole);
                TempData["SuccessMessage"] = "Użytkownik został pomyślnie utworzony.";
                return RedirectToAction("ManageUsers");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error.Description);
            }

            ViewBag.Roles = new[] { "User", "Moderator", "Organizer" };
            return View();
        }
    }
}
