using System;

namespace AutoLogix.Application.Offers
{
    public class InsuranceOfferResponse
    {
        public Guid Id { get; set; }

        public Guid VehicleId { get; set; }
        public Guid InsurerUserId { get; set; }

        public Guid? OfferRequestId { get; set; }

        public string Type { get; set; } = default!;
        public decimal Price { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }

        public string? Description { get; set; }
        public string Status { get; set; } = default!;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
