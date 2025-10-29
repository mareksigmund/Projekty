using Learnin_Traacker.API.Models;
using LearningTracker.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace Learnin_Traacker.API.Data
{
    public class AppDbContext:DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Note> Notes { get; set; } = null!;
        public DbSet<QuizQuestion> QuizQuestions { get; set; } = null!;
        public DbSet<QuizResult> QuizResults { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            var stringListConverter = new ValueConverter<List<string>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null)
            );

            modelBuilder.Entity<QuizQuestion>()
                .Property(q => q.Answers)
                .HasConversion(stringListConverter);

            base.OnModelCreating(modelBuilder);
        }

    }
}
