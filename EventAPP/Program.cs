using EventApp.Enums;
using EventApp.Models;
using EventAPP.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Konfiguracja bazy danych
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Konfiguracja Identity
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddControllersWithViews();

var app = builder.Build();

// Tworzenie ról i u¿ytkownika admina przy pierwszym uruchomieniu
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

    // Role do dodania
    string[] roleNames = { "Admin", "Moderator", "Organizer", "User" };

    foreach (var role in roleNames)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
            Console.WriteLine($"[INFO] Dodano rolê: {role}");
        }
    }

    // Dodanie Admina, jeœli nie istnieje
    string adminEmail = "admin@eventapp.com";
    string adminPassword = "Admin123!";

    var admin = await userManager.FindByEmailAsync(adminEmail);
    if (admin == null)
    {
        var newAdmin = new User
        {
            UserName = adminEmail,
            Email = adminEmail,
            Name = "Administrator",
            Role = UserRole.Admin
        };

        var createAdminResult = await userManager.CreateAsync(newAdmin, adminPassword);
        if (createAdminResult.Succeeded)
        {
            await userManager.AddToRoleAsync(newAdmin, "Admin");
            Console.WriteLine("[INFO] Stworzono konto Admina.");
        }
        else
        {
            Console.WriteLine("[B£¥D] Nie uda³o siê stworzyæ konta Admina.");
            foreach (var error in createAdminResult.Errors)
            {
                Console.WriteLine($"[B£¥D REJESTRACJI ADMINA] {error.Description}");
            }
        }
    }
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication(); // W³¹czenie autoryzacji
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
