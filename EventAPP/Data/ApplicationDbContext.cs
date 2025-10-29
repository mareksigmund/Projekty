using EventApp.Models;
using EventAPP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EventAPP.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Event> Events { get; set; }
        public DbSet<Participation> Participations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relacja Event -> Organizer
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Organizer)
                .WithMany(u => u.OrganizedEvents)
                .HasForeignKey(e => e.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacja Participation -> Event
            modelBuilder.Entity<Participation>()
                .HasOne(p => p.Event)
                .WithMany(e => e.Participations)
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacja Participation -> User
            modelBuilder.Entity<Participation>()
                .HasOne(p => p.User)
                .WithMany(u => u.Participations)  // Dodałem brakującą właściwość
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
