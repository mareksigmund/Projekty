using System;

namespace LibraryWPF.Models
{
    public class Reservation
    {
        public int ReservationId { get; set; }
        public int BookId { get; set; }
        public int UserId { get; set; }
        public DateTime ReservationDate { get; set; }
        public string Status { get; set; } = "Oczekująca"; // Domyślny status

        public Book Book { get; set; }
        public User User { get; set; }
    }
}
