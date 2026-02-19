using System;

namespace AutoLogix.Application.Vehicle
{
    public class VehicleResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }

        public string Brand { get; set; } = default!;
        public string Model { get; set; } = default!;
        public string? Version { get; set; }
        public string RegistrationNumber { get; set; } = default!;
        public string? Vin { get; set; }
        public int? Year { get; set; }
        public int? Mileage { get; set; }
        public string? FuelType { get; set; }
        public int? EngineCapacity { get; set; }
        public int? EnginePowerHp { get; set; }

        public DateTime? FirstRegistrationDate { get; set; }
        public DateTime? TechnicalInspectionDueDate { get; set; }
        public DateTime? InsuranceOcDueDate { get; set; }
        public DateTime? InsuranceAcDueDate { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Notes { get; set; }

        public bool AllowInsuranceOffers { get; set; }
    }
}
