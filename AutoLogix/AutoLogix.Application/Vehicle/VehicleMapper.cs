using AutoLogix.Domain.Entities;

namespace AutoLogix.Application.Vehicle
{
    public static class VehicleMapper
    {
        public static VehicleResponse ToResponse(AutoLogix.Domain.Entities.Vehicle v)
        {
            return new VehicleResponse
            {
                Id = v.Id,
                UserId = v.UserId,
                Brand = v.Brand,
                Model = v.Model,
                Version = v.Version,
                RegistrationNumber = v.RegistrationNumber,
                Vin = v.Vin,
                Year = v.Year,
                Mileage = v.Mileage,
                FuelType = v.FuelType,
                EngineCapacity = v.EngineCapacity,
                EnginePowerHp = v.EnginePowerHp,
                FirstRegistrationDate = v.FirstRegistrationDate,
                TechnicalInspectionDueDate = v.TechnicalInspectionDueDate,
                InsuranceOcDueDate = v.InsuranceOcDueDate,
                InsuranceAcDueDate = v.InsuranceAcDueDate,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt,
                Notes = v.Notes,
                AllowInsuranceOffers = v.AllowInsuranceOffers,
            };
        }
    }
}
