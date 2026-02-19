using AutoLogix.Domain.Entities;

namespace AutoLogix.Application.Offers
{
    public static class InsuranceOfferMapper
    {
        public static InsuranceOfferResponse ToResponse(InsuranceOffer e)
        {
            return new InsuranceOfferResponse
            {
                Id = e.Id,
                VehicleId = e.VehicleId,
                InsurerUserId = e.InsurerUserId,
                OfferRequestId = e.OfferRequestId,
                Type = e.Type,
                Price = e.Price,
                ValidFrom = e.ValidFrom,
                ValidTo = e.ValidTo,
                Description = e.Description,
                Status = e.Status,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            };
        }
    }
}
