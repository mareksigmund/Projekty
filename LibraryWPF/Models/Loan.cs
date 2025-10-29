using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LibraryWPF.Models
{
    public class Loan
    {
        public int LoanId { get; set; }
        public int BookId { get; set; }
        public int UserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Aktywne";  // "Aktywne", "Przeterminowane", "Zakończone"

        // Relacje
        public Book Book { get; set; }
        public User User { get; set; }
    }
}
