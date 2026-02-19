using System.ComponentModel.DataAnnotations;

namespace AutoLogix.Application.Vehicle
{
    public class CreateVehicleRequest
    {
        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = default!;

        [Required]
        [StringLength(100)]
        public string Model { get; set; } = default!;

        [Required]
        [StringLength(20)]
        public string RegistrationNumber { get; set; } = default!;

        [StringLength(100)]
        public string? Version { get; set; }

        [StringLength(50)]
        public string? Vin { get; set; }

        [Range(1900, 2100)]
        public int? Year { get; set; }

        [Range(0, int.MaxValue)]
        public int? Mileage { get; set; }

        [StringLength(50)]
        public string? FuelType { get; set; }

        [Range(0, int.MaxValue)]
        public int? EngineCapacity { get; set; }

        [Range(0, int.MaxValue)]
        public int? EnginePowerHp { get; set; }

        public DateTime? FirstRegistrationDate { get; set; }
        public DateTime? TechnicalInspectionDueDate { get; set; }
        public DateTime? InsuranceOcDueDate { get; set; }
        public DateTime? InsuranceAcDueDate { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public bool AllowInsuranceOffers { get; set; } = false;

    }
}
