using EventApp.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventAPP.Models
{
    public class Participation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Event")]
        public int EventId { get; set; }
        public Event Event { get; set; }  // Nawigacja do wydarzenia

        [Required]
        [ForeignKey("User")]
        public string UserId { get; set; }
        public User User { get; set; }    // Nawigacja do użytkownika

        [Required]
        public string Status { get; set; } = "Zapisany"; // Domyślny status to "Zapisany"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
