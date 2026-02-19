using AutoLogix.Domain.Entities;

namespace AutoLogix.Application.Offers
{
    public static class OfferRequestMapper
    {
        public static OfferRequestResponse ToResponse(InsuranceOfferRequest e)
        {
            return new OfferRequestResponse
            {
                Id = e.Id,
                VehicleId = e.VehicleId,
                Type = e.Type,
                Status = e.Status,
                Message = e.Message,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            };
        }
    }
}
