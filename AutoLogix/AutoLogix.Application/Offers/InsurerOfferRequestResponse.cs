using System;

namespace AutoLogix.Application.Offers
{
    public class InsurerOfferRequestResponse
    {
        public Guid Id { get; set; }
        public Guid VehicleId { get; set; }

        public string VehicleBrand { get; set; } = default!;
        public string VehicleModel { get; set; } = default!;
        public string VehicleRegistrationNumber { get; set; } = default!;

        public string Type { get; set; } = default!;
        public string Status { get; set; } = default!;
        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
