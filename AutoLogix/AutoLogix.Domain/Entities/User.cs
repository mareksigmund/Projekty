using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        // basic login info
        public string Email { get; set; } = default!;
        public string EmailNormalized { get; set; } = default!;
        public string PasswordHash { get; set; } = default!;

        // user info (optional)
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }


        // status / role
        public bool IsActive { get; set; } = true;
        public string Role { get; set; } = "User";

        // audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }

        // versioning (protection against write conflicts)
        public byte[]? RowVersion { get; set; }



        // realtion 1..* to vehicles (the user may have several vehicles)

        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        // relation 1..* to insurance offers made by the user (as insurer)
        public ICollection<InsuranceOfferRequest> InsuranceOfferRequests { get; set; } = new List<InsuranceOfferRequest>();
        // relation 1..* to insurance offers made by the user (as insurer)
        public ICollection<InsuranceOffer> InsuranceOffers { get; set; } = new List<InsuranceOffer>();

    }
}
