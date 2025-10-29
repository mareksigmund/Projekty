using EventApp.Enums;
using EventApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventAPP.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AccountController(UserManager<User> userManager, SignInManager<User> signInManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
        }

        // Widok rejestracji
        public IActionResult Register() => View();

        [HttpPost]
        public async Task<IActionResult> Register(string name, string email, string password)
        {
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                ModelState.AddModelError("", "Wszystkie pola są wymagane.");
                return View();
            }

            // Sprawdzenie, czy użytkownik o podanym emailu już istnieje
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                ModelState.AddModelError("", "Konto z podanym adresem email już istnieje.");
                return View();
            }

            var user = new User { UserName = email, Email = email, Name = name, Role = UserRole.User };

            // Tworzenie użytkownika z automatycznym haszowaniem hasła
            var result = await _userManager.CreateAsync(user, password);

            if (result.Succeeded)
            {
                var roleResult = await _userManager.AddToRoleAsync(user, UserRole.User.ToString());

                if (!roleResult.Succeeded)
                {
                    Console.WriteLine($"[BŁĄD] Nie udało się przypisać roli User do {email}");
                    ModelState.AddModelError("", "Wystąpił problem z przypisaniem roli użytkownika.");
                    return View();
                }

                Console.WriteLine($"[INFO] Pomyślnie zarejestrowano użytkownika: {email} z rolą {UserRole.User}");
                return RedirectToAction("Login"); //Przekierowanie do logowania
            }

            // Logowanie błędów ASP.NET Identity
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"[BŁĄD REJESTRACJI] {error.Description}");
                ModelState.AddModelError("", error.Description);
            }

            return View();
        }



        // Widok logowania
        public IActionResult Login() => View();

        [HttpPost]
        public async Task<IActionResult> Login(string email, string password)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                ModelState.AddModelError("", "Email i hasło są wymagane.");
                return View();
            }

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                ModelState.AddModelError("", "Nieprawidłowy login lub hasło.");
                return View();
            }

            var result = await _signInManager.PasswordSignInAsync(user, password, isPersistent: false, lockoutOnFailure: false);
            if (!result.Succeeded)
            {
                ModelState.AddModelError("", "Nieprawidłowy login lub hasło.");
                return View();
            }

            var roles = await _userManager.GetRolesAsync(user);

            if (roles == null || roles.Count == 0)
            {
                Console.WriteLine($"[BŁĄD] Użytkownik {email} nie ma przypisanej żadnej roli.");
                ModelState.AddModelError("", "Brak uprawnień. Skontaktuj się z administratorem.");
                return View();
            }

            Console.WriteLine($"[INFO] Użytkownik {email} zalogował się z rolą: {string.Join(", ", roles)}");

            if (roles.Contains("Admin"))
                return RedirectToAction("Index", "AdminPanel");
            if (roles.Contains("Moderator"))
                return RedirectToAction("Index", "ModeratorPanel");
            if (roles.Contains("Organizer"))
                return RedirectToAction("Index", "OrganizerPanel");

            return RedirectToAction("Index", "UserPanel");
        }


        // Wylogowanie użytkownika
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }


        public IActionResult AccessDenied()
        {
            return View();
        }

    }
}
