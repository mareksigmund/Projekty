namespace AutoLogix.Application.Insurance
{
    public class InsurerVehicleDetailsResponse
    {
        public Guid Id { get; set; }

        public string Brand { get; set; } = default!;
        public string Model { get; set; } = default!;
        public string RegistrationNumber { get; set; } = default!;

        public int? Year { get; set; }
        public int? Mileage { get; set; }

        public string? Vin { get; set; }
        public string? FuelType { get; set; }
        public int? EngineCapacity { get; set; }
        public int? EnginePowerHp { get; set; }

        public DateTime? InsuranceOcDueDate { get; set; }
        public DateTime? InsuranceAcDueDate { get; set; }

        public bool AllowInsuranceOffers { get; set; }
    }
}
