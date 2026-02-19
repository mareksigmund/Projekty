using System;

namespace AutoLogix.Domain.Entities
{
    public class InsuranceOffer
    {
        public Guid Id { get; set; }

        // Relations
        public Guid VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = default!;

        public Guid InsurerUserId { get; set; }
        public User InsurerUser { get; set; } = default!;

        // Optional: link to request that triggered the offer
        public Guid? OfferRequestId { get; set; }
        public InsuranceOfferRequest? OfferRequest { get; set; }

        // Offer details
        public string Type { get; set; } = default!;      // OC / AC / OC_AC
        public decimal Price { get; set; }                // required
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }

        public string? Description { get; set; }          // terms/notes for user
        public string Status { get; set; } = "Proposed";  // Proposed / Accepted / Rejected / Expired

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
