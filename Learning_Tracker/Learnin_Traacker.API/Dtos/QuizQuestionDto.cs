namespace Learnin_Traacker.API.Dtos
{
    public class QuizQuestionDto
    {
        public string Question { get; set; } = string.Empty;
        public List<string> Answers { get; set; } = new();
        public string CorrectAnswer { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? SourceType { get; set; }
    }
}
