using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Domain.Entities
{
    public class Vehicle
    {
        public Guid Id { get; set; }

        // realtion with user
        public Guid UserId { get; set; }
        public User User { get; set; } = default!;

        // basic info
        public string Brand { get; set; } = default!;
        public string Model { get; set; } = default!;
        public string? Version { get; set; }
        public string RegistrationNumber { get; set; } = default!;
        public string? Vin { get; set; }

        // technical specs
        public int? Year { get; set; }
        public int? Mileage { get; set; }
        public string? FuelType { get; set; }
        public int? EngineCapacity { get; set; }      
        public int? EnginePowerHp { get; set; }

        // dates/inspections
        public DateTime? FirstRegistrationDate { get; set; }
        public DateTime? TechnicalInspectionDueDate { get; set; }
        public DateTime? InsuranceOcDueDate { get; set; }
        public DateTime? InsuranceAcDueDate { get; set; }

        // metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public string? Notes { get; set; }

        // preferences
        public bool AllowInsuranceOffers { get; set; } = false;

        // relations
        public ICollection<ServiceEntry> ServiceEntries { get; set; } = new List<ServiceEntry>();

        // Insurance offers related to this vehicle
        public ICollection<InsuranceOfferRequest> InsuranceOfferRequests { get; set; } = new List<InsuranceOfferRequest>();

        // Insurance offers made for this vehicle
        public ICollection<InsuranceOffer> InsuranceOffers { get; set; } = new List<InsuranceOffer>();


    }
}
