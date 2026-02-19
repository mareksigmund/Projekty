using System;
using System.ComponentModel.DataAnnotations;

namespace AutoLogix.Application.Offers
{
    public class CreateInsuranceOfferRequest
    {
        // Preferably provide OfferRequestId (realistic flow)
        public Guid? OfferRequestId { get; set; }

        // Optional alternative (if request is not used)
        public Guid? VehicleId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = default!; // OC / AC / OC_AC

        [Required]
        [Range(0.01, 1000000)]
        public decimal Price { get; set; }

        [Required]
        public DateTime ValidFrom { get; set; }

        [Required]
        public DateTime ValidTo { get; set; }

        [MaxLength(4000)]
        public string? Description { get; set; }
    }
}
