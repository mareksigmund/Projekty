using Learnin_Traacker.API.Data;
using Learnin_Traacker.API.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Learnin_Traacker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizResultsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizResultsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SaveResult([FromBody] QuizResult result)
        {
            result.CreatedAt = DateTime.UtcNow;
            _context.QuizResults.Add(result);
            await _context.SaveChangesAsync();
            return Ok(result);
        }

        [HttpGet("user/{uid}/summary")]
        public async Task<IActionResult> GetUserSummary(string uid)
        {
            var summary = await _context.QuizResults
                .Where(r => r.FirebaseUid == uid)
                .GroupBy(r => r.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    Total = g.Sum(x => x.TotalQuestions),
                    Correct = g.Sum(x => x.CorrectAnswers),
                    Percent = g.Sum(x => x.TotalQuestions) > 0
                              ? Math.Round((double)g.Sum(x => x.CorrectAnswers) / g.Sum(x => x.TotalQuestions) * 100, 2)
                              : 0
                })
                .ToListAsync();

            return Ok(summary);
        }
    }
}