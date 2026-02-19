using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Application.Insurance
{
    public class InsuranceExpiringVehicleResponse
    {
        public Guid VehicleId { get; set; }

        public string Brand { get; set; } = default!;
        public string Model { get; set; } = default!;
        public string RegistrationNumber { get; set; } = default!;

        public DateTime? OcDueDate { get; set; }
        public int? OcDaysLeft { get; set; }

        public DateTime? AcDueDate { get; set; }
        public int? AcDaysLeft { get; set; }
    }
}
