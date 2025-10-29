using System.ComponentModel.DataAnnotations;
using EventApp.Enums;
using EventAPP.Models;
using Microsoft.AspNetCore.Identity;

namespace EventApp.Models
{
    public class User : IdentityUser
    {
        [Required]
        public string Name { get; set; }

        [Required, EmailAddress]
        public override string Email { get; set; } // Email jest już w IdentityUser, ale można go nadpisać

        [Required]
        public UserRole Role { get; set; } = UserRole.User; // Domyślna rola

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Event> OrganizedEvents { get; set; } = new List<Event>(); // Jeden użytkownik -> Wiele wydarzeń

        // Dodanie nawigacji do `Participation`
        public List<Participation> Participations { get; set; } = new List<Participation>();
    }
}
