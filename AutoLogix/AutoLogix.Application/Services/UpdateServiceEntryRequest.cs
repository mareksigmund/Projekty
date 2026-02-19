using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Application.Services
{
    public class UpdateServiceEntryRequest
    {
        [Required]
        public DateTime ServiceDate { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = default!;

        [Range(0, int.MaxValue)]
        public int? MileageAtService { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Cost { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(200)]
        public string? WorkshopName { get; set; }

        [MaxLength(500)]
        public string? WorkshopAddress { get; set; }

        public DateTime? NextServiceDate { get; set; }

        [Range(0, int.MaxValue)]
        public int? NextServiceMileage { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }
    }
}
