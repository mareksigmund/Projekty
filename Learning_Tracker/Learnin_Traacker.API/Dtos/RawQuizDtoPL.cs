using System.Text.Json.Serialization;

public class RawQuizDtoPL
{
    [JsonPropertyName("pytanie")]
    public string Question { get; set; }

    [JsonPropertyName("odpowiedzi")]
    public List<string> Answers { get; set; }

    [JsonPropertyName("poprawna_odpowiedz")]
    public string CorrectAnswer { get; set; }
}
