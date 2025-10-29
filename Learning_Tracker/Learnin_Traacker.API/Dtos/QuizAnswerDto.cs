namespace Learnin_Traacker.API.Dtos
{
    public class QuizAnswerDto
    {
        public int QuestionId { get; set; }
        public string SelectedAnswer { get; set; } = string.Empty;
    }

}
