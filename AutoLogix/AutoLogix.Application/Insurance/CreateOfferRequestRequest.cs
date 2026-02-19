using System;
using System.ComponentModel.DataAnnotations;

namespace AutoLogix.Application.Offers
{
    public class CreateOfferRequestRequest
    {
        [Required]
        public Guid VehicleId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = default!; // OC / AC / OC_AC

        [MaxLength(2000)]
        public string? Message { get; set; }
    }
}
