using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Application.Services
{
    public class ServiceEntryResponse
    {
        public Guid Id { get; set; }
        public Guid VehicleId { get; set; }

        public DateTime ServiceDate { get; set; }
        public int? MileageAtService { get; set; }

        public string Title { get; set; } = default!;
        public string? Description { get; set; }

        public decimal? Cost { get; set; }
        public string? WorkshopName { get; set; }
        public string? WorkshopAddress { get; set; }

        public DateTime? NextServiceDate { get; set; }
        public int? NextServiceMileage { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Notes { get; set; }
    }
}
