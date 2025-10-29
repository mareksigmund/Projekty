namespace Learnin_Traacker.API.Models
{
    public class QuizResult
    {
        public int Id { get; set; }
        public string FirebaseUid { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}
