using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EventApp.Enums;
using EventAPP.Models;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace EventApp.Models
{
    public class Event
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Tytuł jest wymagany.")]
        [MaxLength(100, ErrorMessage = "Tytuł nie może przekraczać 100 znaków.")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Data wydarzenia jest wymagana.")]
        [DataType(DataType.DateTime, ErrorMessage = "Nieprawidłowy format daty.")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Miejsce wydarzenia jest wymagane.")]
        [MaxLength(200, ErrorMessage = "Miejsce nie może przekraczać 200 znaków.")]
        public string Location { get; set; }

        [Required(ErrorMessage = "Status wydarzenia jest wymagany.")]
        public EventStatus Status { get; set; } = EventStatus.Planned;

        [Required(ErrorMessage = "Opis wydarzenia jest wymagany.")]
        [MaxLength(500, ErrorMessage = "Opis nie może przekraczać 500 znaków.")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Limit uczestników jest wymagany.")]
        [Range(1, 10000, ErrorMessage = "Limit uczestników musi być większy niż 0.")]
        public int MaxParticipants { get; set; }

        [ForeignKey("Organizer")]
        public string OrganizerId { get; set; }


        public User? Organizer { get; set; } 

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [DataType(DataType.DateTime)]
        public DateTime? UpdatedAt { get; set; }

        // Dodanie nawigacji do `Participation`
        public List<Participation> Participations { get; set; } = new List<Participation>();

        [Required]
        public int CurrentParticipants { get; set; } = 0;

    }
}
