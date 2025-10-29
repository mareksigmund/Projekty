using Learnin_Traacker.API.Data;
using Learnin_Traacker.API.Dtos;
using Learnin_Traacker.API.Models;
using Learnin_Traacker.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Learnin_Traacker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizController : Controller
    {
        private readonly AppDbContext _context;

        public QuizController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("generate-cohere")]
        public async Task<IActionResult> GenerateFromCohere([FromServices] CohereService ai, [FromQuery] string note, [FromQuery] int count = 5)
        {
            var result = await ai.GenerateQuizAsync(note, count);
            return Ok(result);
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveQuestions([FromBody] List<QuizQuestionDto> dtos)
        {
            if (dtos == null || dtos.Count == 0)
                return BadRequest("Brak danych do zapisania");

            var questions = dtos.Select(dto => new QuizQuestion
            {
                Question = dto.Question,
                Answers = dto.Answers,
                CorrectAnswer = dto.CorrectAnswer,
                Category = dto.Category,
                SourceType = dto.SourceType
            }).ToList();

            _context.QuizQuestions.AddRange(questions);
            await _context.SaveChangesAsync();

            return Ok("Zapisano pytania.");
        }


        //   [HttpPost("from-note/{noteId}")]
        //   public async Task<IActionResult> GenerateQuizFromNote(
        //[FromRoute] int noteId,
        //[FromQuery] int count,
        //[FromServices] CohereService ai)
        //   {
        //       try
        //       {
        //           var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == noteId);
        //           if (note == null)
        //               return NotFound("Nie znaleziono notatki.");

        //           var generatedText = await ai.GenerateQuizAsync(note.Content, count);
        //           if (string.IsNullOrWhiteSpace(generatedText))
        //               return BadRequest("Nie udało się wygenerować żadnych danych.");

        //           Console.WriteLine("🔵 Wygenerowany tekst z Cohere:");
        //           Console.WriteLine(generatedText);

        //           // Szukamy fragmentu JSON (listy pytań)
        //           int startIndex = generatedText.IndexOf('[');
        //           int endIndex = generatedText.LastIndexOf(']');

        //           if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex)
        //               return BadRequest("Odpowiedź AI nie zawiera poprawnego formatu JSON.");

        //           string jsonFragment = generatedText.Substring(startIndex, endIndex - startIndex + 1).Trim();

        //           Console.WriteLine("🟢 Fragment JSON:");
        //           Console.WriteLine(jsonFragment);

        //           var options = new JsonSerializerOptions
        //           {
        //               PropertyNameCaseInsensitive = true
        //           };

        //           var rawDtos = JsonSerializer.Deserialize<List<RawQuizDto>>(jsonFragment, options);

        //           if (rawDtos == null || rawDtos.Count == 0)
        //               return BadRequest("Nie udało się sparsować pytań quizowych.");

        //           Console.WriteLine("✅ Surowe pytania:");
        //           foreach (var r in rawDtos)
        //           {
        //               Console.WriteLine($"Pytanie: {r.Question}");
        //               Console.WriteLine($"Odpowiedzi: {string.Join(", ", r.Answers ?? new())}");
        //               Console.WriteLine($"Poprawna: {r.CorrectAnswer}");
        //           }

        //           var quizQuestions = rawDtos
        //               .Where(dto => !string.IsNullOrWhiteSpace(dto.Question)
        //                          && dto.Answers != null
        //                          && dto.Answers.Any()
        //                          && !string.IsNullOrWhiteSpace(dto.CorrectAnswer))
        //               .Select(dto => new QuizQuestion
        //               {
        //                   Question = dto.Question,
        //                   Answers = dto.Answers,
        //                   CorrectAnswer = dto.CorrectAnswer,
        //                   Category = note.Category,
        //                   SourceType = "AI"
        //               })
        //               .ToList();

        //           if (quizQuestions.Count == 0)
        //               return BadRequest("Nie wygenerowano żadnych poprawnych pytań quizowych.");


        //           foreach (var dto in rawDtos)
        //           {
        //               Console.WriteLine($"Pytanie: {dto.Question}");
        //               Console.WriteLine($"Odpowiedzi: {string.Join(", ", dto.Answers)}");
        //               Console.WriteLine($"Poprawna: {dto.CorrectAnswer}");
        //           }

        //           _context.QuizQuestions.AddRange(quizQuestions);
        //           await _context.SaveChangesAsync();

        //           return Ok(quizQuestions);
        //       }
        //       catch (JsonException jex)
        //       {
        //           Console.WriteLine("❌ Błąd JSON:");
        //           Console.WriteLine(jex.Message);
        //           return StatusCode(500, $"Błąd parsowania JSON: {jex.Message}");
        //       }
        //       catch (Exception ex)
        //       {
        //           Console.WriteLine("❌ Błąd ogólny:");
        //           Console.WriteLine(ex.Message);
        //           return StatusCode(500, $"Błąd serwera: {ex.Message}");
        //       }
        //   }


        [HttpPost("from-note/{noteId}")]
        public async Task<IActionResult> GenerateQuizFromNote(
            [FromRoute] int noteId,
            [FromQuery] int count,
            [FromServices] CohereService ai)
        {
            try
            {
                var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == noteId);
                if (note == null)
                    return NotFound("Nie znaleziono notatki.");

                var existingQuestions = await _context.QuizQuestions
                    .Where(q => q.Category == note.Category)
                    .Select(q => q.Question)
                    .ToListAsync();

                var generatedText = await ai.GenerateQuizAsync(note.Content, count + 5);
                if (string.IsNullOrWhiteSpace(generatedText))
                    return BadRequest("Nie udało się wygenerować żadnych danych.");

                Console.WriteLine("\ud83d\udd35 Wygenerowany tekst z Cohere:");
                Console.WriteLine(generatedText);

                int startIndex = generatedText.IndexOf('[');
                int endIndex = generatedText.LastIndexOf(']');
                if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex)
                    return BadRequest("Odpowiedź AI nie zawiera poprawnego formatu JSON.");

                string jsonFragment = generatedText.Substring(startIndex, endIndex - startIndex + 1).Trim();
                Console.WriteLine("\ud83d\udfe2 Fragment JSON:");
                Console.WriteLine(jsonFragment);

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                List<RawQuizDto>? rawDtos = null;
                try { rawDtos = JsonSerializer.Deserialize<List<RawQuizDto>>(jsonFragment, options); } catch { }
                if (rawDtos == null || rawDtos.Count == 0)
                {
                    try
                    {
                        var plDtos = JsonSerializer.Deserialize<List<RawQuizDtoPL>>(jsonFragment, options);
                        if (plDtos != null)
                        {
                            rawDtos = plDtos.Select(pl => new RawQuizDto
                            {
                                Question = pl.Question,
                                Answers = pl.Answers,
                                CorrectAnswer = pl.CorrectAnswer
                            }).ToList();
                        }
                    }
                    catch { }
                }

                if (rawDtos == null || rawDtos.Count == 0)
                    return BadRequest("Nie udało się sparsować pytań quizowych z żadnego formatu.");

                Console.WriteLine("\u2705 Surowe pytania:");
                foreach (var dto in rawDtos)
                {
                    Console.WriteLine($"Pytanie: {dto.Question}");
                    Console.WriteLine($"Odpowiedzi: {string.Join(", ", dto.Answers ?? new())}");
                    Console.WriteLine($"Poprawna: {dto.CorrectAnswer}");
                }

                var quizQuestions = rawDtos
                    .Where(dto =>
                        !string.IsNullOrWhiteSpace(dto.Question) &&
                        dto.Answers != null &&
                        dto.Answers.Any() &&
                        !string.IsNullOrWhiteSpace(dto.CorrectAnswer) &&
                        !existingQuestions.Contains(dto.Question))
                    .Select(dto => new QuizQuestion
                    {
                        Question = dto.Question,
                        Answers = dto.Answers,
                        CorrectAnswer = dto.CorrectAnswer,
                        Category = note.Category,
                        SourceType = "AI"
                    })
                    .Take(count) 
                    .ToList();


                if (quizQuestions.Count == 0)
                    return BadRequest("Nie wygenerowano unikalnych pytań quizowych (wszystkie już istnieją).");

                _context.QuizQuestions.AddRange(quizQuestions);
                await _context.SaveChangesAsync();

                return Ok(quizQuestions);
            }
            catch (JsonException jex)
            {
                Console.WriteLine("\u274c Błąd JSON:");
                Console.WriteLine(jex.Message);
                return StatusCode(500, $"Błąd parsowania JSON: {jex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine("\u274c Błąd ogólny:");
                Console.WriteLine(ex.Message);
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }

        [HttpPost("from-db/{noteId}")]
        public async Task<IActionResult> GenerateQuizFromDatabase(
    [FromRoute] int noteId,
    [FromQuery] int count = 5)
        {
            var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == noteId);
            if (note == null)
                return NotFound("Nie znaleziono notatki.");

            var questions = await _context.QuizQuestions
                .Where(q => q.Category == note.Category)
                .OrderBy(r => Guid.NewGuid())
                .Take(count)
                .ToListAsync();

            if (questions.Count == 0)
                return NotFound("Brak pytań z tej kategorii.");

            return Ok(questions); // tylko zwracamy, nic nie zapisujemy
        }


        [HttpPost("from-mixed/{noteId}")]
        public async Task<IActionResult> GenerateMixedQuiz(
            [FromRoute] int noteId,
            [FromServices] CohereService ai,
            [FromQuery] int aiCount = 2,
            [FromQuery] int dbCount = 3)
        {
            var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == noteId);
            if (note == null)
                return NotFound("Nie znaleziono notatki.");

            var existing = await _context.QuizQuestions
                .Where(q => q.Category == note.Category)
                .Select(q => q.Question.Trim().ToLower()) 
                .ToListAsync();

            // Generujemy więcej niż potrzeba, by zwiększyć szansę na unikalne
            var generatedText = await ai.GenerateQuizAsync(note.Content, aiCount + 5);
            if (string.IsNullOrWhiteSpace(generatedText))
                return BadRequest("Nie udało się wygenerować danych z AI.");

            int startIndex = generatedText.IndexOf('[');
            int endIndex = generatedText.LastIndexOf(']');
            if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex)
                return BadRequest("Zły format JSON z AI.");

            var jsonFragment = generatedText.Substring(startIndex, endIndex - startIndex + 1);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            List<RawQuizDto>? rawDtos = null;
            try { rawDtos = JsonSerializer.Deserialize<List<RawQuizDto>>(jsonFragment, options); } catch { }
            if (rawDtos == null || rawDtos.Count == 0)
            {
                try
                {
                    var plDtos = JsonSerializer.Deserialize<List<RawQuizDtoPL>>(jsonFragment, options);
                    rawDtos = plDtos?.Select(pl => new RawQuizDto
                    {
                        Question = pl.Question,
                        Answers = pl.Answers,
                        CorrectAnswer = pl.CorrectAnswer
                    }).ToList();
                }
                catch { }
            }

            if (rawDtos == null || rawDtos.Count == 0)
                return BadRequest("Nie udało się sparsować pytań z AI.");

            var aiQuestions = rawDtos
                .Where(dto =>
                    !string.IsNullOrWhiteSpace(dto.Question) &&
                    dto.Answers != null &&
                    dto.Answers.Any() &&
                    !string.IsNullOrWhiteSpace(dto.CorrectAnswer) &&
                    !existing.Contains(dto.Question.Trim().ToLower()))
                .Take(aiCount)
                .Select(dto => new QuizQuestion
                {
                    Question = dto.Question,
                    Answers = dto.Answers,
                    CorrectAnswer = dto.CorrectAnswer,
                    Category = note.Category,
                    SourceType = "AI"
                }).ToList();

            // Loguj ile zostało po filtrze
            Console.WriteLine($" Wygenerowano unikalnych AI pytań: {aiQuestions.Count}");

            // Losujemy z bazy
            var dbQuestions = await _context.QuizQuestions
                .Where(q => q.Category == note.Category)
                .OrderBy(r => Guid.NewGuid())
                .Take(dbCount)
                .ToListAsync();

            var finalQuiz = aiQuestions.Concat(dbQuestions).ToList();

            if (finalQuiz.Count == 0)
                return NotFound("Nie udało się przygotować żadnych pytań.");

            if (aiQuestions.Count > 0)
            {
                _context.QuizQuestions.AddRange(aiQuestions);
                await _context.SaveChangesAsync();
            }

            return Ok(finalQuiz);
        }


        [HttpPost("check")]
        public async Task<IActionResult> CheckAnswers([FromBody] List<QuizAnswerDto> answers)
        {
            if (answers == null || !answers.Any())
                return BadRequest("Brak odpowiedzi do sprawdzenia.");


            var ids = answers.Select(a => a.QuestionId).ToList();
            var questions = await _context.QuizQuestions
                .Where(q => ids.Contains(q.Id))
                .ToListAsync();

            var results = answers.Select(a =>
            {
                var q = questions.FirstOrDefault(q => q.Id == a.QuestionId);
                return new
                {
                    QuestionId = a.QuestionId,
                    SelectedAnswer = a.SelectedAnswer,
                    CorrectAnswer = q?.CorrectAnswer,
                    IsCorrect = q != null && q.CorrectAnswer == a.SelectedAnswer
                };
            });

            return Ok(results);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllQuestions()
        {
            var questions = await _context.QuizQuestions.OrderByDescending(q => q.CreatedAt).ToListAsync();
            return Ok(questions);
        }



    }
}