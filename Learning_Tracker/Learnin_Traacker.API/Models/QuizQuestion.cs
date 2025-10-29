namespace Learnin_Traacker.API.Models
{
    public class QuizQuestion
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public List<string> Answers { get; set; } = new();
        public string CorrectAnswer { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? SourceType { get; set; } = "AI"; 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
