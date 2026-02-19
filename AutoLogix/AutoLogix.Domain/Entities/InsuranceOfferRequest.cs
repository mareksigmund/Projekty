using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Domain.Entities
{
    public class InsuranceOfferRequest
    {
        public Guid Id { get; set; }

        // Relations
        public Guid VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = default!;

        public Guid RequestedByUserId { get; set; }
        public User RequestedByUser { get; set; } = default!;

        // Request details
        public string Type { get; set; } = default!; // OC / AC / OC_AC
        public string Status { get; set; } = "Open"; // Open / Cancelled / Fulfilled
        public string? Message { get; set; }

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}

