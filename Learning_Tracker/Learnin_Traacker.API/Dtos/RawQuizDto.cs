using System.Text.Json.Serialization;

namespace Learnin_Traacker.API.Dtos
{
    public class RawQuizDto
    {
        [JsonPropertyName("question")]
        public string Question { get; set; } = string.Empty;

        [JsonPropertyName("answers")]
        public List<string> Answers { get; set; } = new();

        [JsonPropertyName("correct_answer")]
        public string CorrectAnswer { get; set; } = string.Empty;
    }
}
