using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Threading.Tasks;
namespace Learnin_Traacker.API.Services
{
    public class CohereService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public CohereService(IConfiguration config)
        {
            _httpClient = new HttpClient();
            _apiKey = config["Cohere:ApiKey"];
            _model = config["Cohere:Model"];
        }

        public async Task<string> GenerateQuizAsync(string noteContent, int questionCount)
        {
            //var prompt = $"Na podstawie poniższej notatki wygeneruj {questionCount} pytań quizowych z odpowiedziami w formacie JSON. Każde pytanie powinno mieć pytanie, 4 odpowiedzi i wskazanie poprawnej:\n\n\"{noteContent}\"";
            var prompt = $"Na podstawie poniższej notatki wygeneruj {questionCount} pytań quizowych z odpowiedziami w formacie JSON. Każde pytanie powinno mieć pytanie, 4 odpowiedzi i wskazanie poprawnej:\n\n\"{noteContent}\" Wygeneruj pytania quizowe w formacie JSON z kluczami question, answers, correct_answer";

            var request = new
            {
                model = _model,
                temperature = 0.3,
                max_tokens = 1024,
                prompt = prompt,
                stop_sequences = new[] { "--" }
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.PostAsync("https://api.cohere.ai/v1/generate", content);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            var result = await JsonSerializer.DeserializeAsync<JsonElement>(stream);
            var text = result.GetProperty("generations")[0].GetProperty("text").GetString();

            text= text!.Trim().Trim('`', '\n');


            return text!;
        }
    }
}
