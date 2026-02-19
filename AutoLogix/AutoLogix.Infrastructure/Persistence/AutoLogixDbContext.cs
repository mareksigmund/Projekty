using AutoLogix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;


namespace AutoLogix.Infrastructure.Persistence
{
    public class AutoLogixDbContext : DbContext
    {
        public AutoLogixDbContext(DbContextOptions<AutoLogixDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<ServiceEntry> ServiceEntries { get; set; }
        public DbSet<InsuranceOfferRequest> InsuranceOfferRequests { get; set; }
        public DbSet<InsuranceOffer> InsuranceOffers { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.EmailNormalized)
                      .IsUnique();

                entity.Property(u => u.Email)
                      .HasMaxLength(256)
                      .IsRequired();

                entity.Property(u => u.EmailNormalized)
                      .HasMaxLength(256)
                      .IsRequired();

                entity.Property(u => u.PasswordHash)
                      .HasMaxLength(512)
                      .IsRequired();

                entity.Property(u => u.FirstName)
                      .HasMaxLength(100);

                entity.Property(u => u.LastName)
                      .HasMaxLength(100);

                entity.Property(u => u.Role)
                      .HasMaxLength(50)
                      .IsRequired();

                entity.Property(u => u.RowVersion)
                      .IsRowVersion();

                entity.Property(u => u.IsActive)
                      .HasDefaultValue(true);
            });

            // ServiceEntry entity configuration
            modelBuilder.Entity<ServiceEntry>(entity =>
            {
                entity.Property(e => e.Title)
                      .HasMaxLength(200)
                      .IsRequired();

                entity.Property(e => e.Description)
                      .HasMaxLength(2000);

                entity.Property(e => e.WorkshopName)
                      .HasMaxLength(200);

                entity.Property(e => e.WorkshopAddress)
                      .HasMaxLength(500);

                entity.Property(e => e.Notes)
                      .HasMaxLength(2000);

                entity.Property(e => e.Cost)
                      .HasPrecision(12, 2);

                entity.HasOne(e => e.Vehicle)
                      .WithMany(v => v.ServiceEntries)
                      .HasForeignKey(e => e.VehicleId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // InsuranceOfferRequest entity configuration

            modelBuilder.Entity<InsuranceOfferRequest>(entity =>
            {
                entity.Property(e => e.Type)
                      .HasMaxLength(20)
                      .IsRequired();

                entity.Property(e => e.Status)
                      .HasMaxLength(20)
                      .IsRequired();

                entity.Property(e => e.Message)
                      .HasMaxLength(2000);

                entity.HasOne(e => e.Vehicle)
                      .WithMany(v => v.InsuranceOfferRequests)
                      .HasForeignKey(e => e.VehicleId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.RequestedByUser)
                      .WithMany(u => u.InsuranceOfferRequests)
                      .HasForeignKey(e => e.RequestedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Index for faster filtering
                entity.HasIndex(e => new { e.VehicleId, e.Status });
            });
            // InsuranceOffer entity configuration
            modelBuilder.Entity<InsuranceOffer>(entity =>
            {
                entity.Property(e => e.Type)
                      .HasMaxLength(20)
                      .IsRequired();

                entity.Property(e => e.Status)
                      .HasMaxLength(20)
                      .IsRequired();

                entity.Property(e => e.Description)
                      .HasMaxLength(4000);

                entity.Property(e => e.Price)
                      .HasPrecision(12, 2);

                entity.HasOne(e => e.Vehicle)
                      .WithMany(v => v.InsuranceOffers)
                      .HasForeignKey(e => e.VehicleId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.InsurerUser)
                      .WithMany(u => u.InsuranceOffers)
                      .HasForeignKey(e => e.InsurerUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.OfferRequest)
                      .WithMany()
                      .HasForeignKey(e => e.OfferRequestId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => new { e.VehicleId, e.Status });
                entity.HasIndex(e => new { e.InsurerUserId, e.Status });
            });


        }
    }
}
