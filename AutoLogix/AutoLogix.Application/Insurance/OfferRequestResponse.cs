using System;

namespace AutoLogix.Application.Offers
{
    public class OfferRequestResponse
    {
        public Guid Id { get; set; }
        public Guid VehicleId { get; set; }

        public string Type { get; set; } = default!;
        public string Status { get; set; } = default!;
        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
