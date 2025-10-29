namespace LearningTracker.Api.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string FirebaseUid { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // Rozbudowa
        public string? DisplayName { get; set; }
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime LastLogin { get; set; } = DateTime.UtcNow;
    }

}
