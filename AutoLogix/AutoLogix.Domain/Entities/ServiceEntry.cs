using System;

namespace AutoLogix.Domain.Entities
{
    public class ServiceEntry
    {
        public Guid Id { get; set; }

        // Relation with Vehicle (1 Vehicle -> many ServiceEntries)
        public Guid VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = default!;

        // Basic service data
        public DateTime ServiceDate { get; set; }          // Date when the service was performed
        public int? MileageAtService { get; set; }         // Vehicle mileage at the time of service (optional)

        public string Title { get; set; } = default!;      // Short title, e.g. "Oil change"
        public string? Description { get; set; }           // Detailed description of performed work

        public decimal? Cost { get; set; }                 // Service cost (optional)
        public string? WorkshopName { get; set; }          // Name of the workshop
        public string? WorkshopAddress { get; set; }       // Workshop address (optional)

        // Planned next service (for future reminders)
        public DateTime? NextServiceDate { get; set; }     // Planned next service date
        public int? NextServiceMileage { get; set; }       // Planned mileage for next service

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public string? Notes { get; set; }
    }
}
