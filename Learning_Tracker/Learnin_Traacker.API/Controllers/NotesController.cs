using Learnin_Traacker.API.Data;
using Learnin_Traacker.API.Dtos;
using Learnin_Traacker.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Learnin_Traacker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : Controller
    {

        private readonly AppDbContext _context;

        public NotesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNoteById(int id)
        {
            var note = await _context.Notes.FindAsync(id);

            if (note == null)
                return NotFound();

            return Ok(note);
        }


        [HttpPost]
        public async Task<IActionResult> CreateNote([FromBody] CreateNoteDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Invalid note data.");
            }

            var note = new Models.Note
            {
                Title = dto.Title,
                Content = dto.Content,
                Category = dto.Category,
                FirebaseUid = dto.FirebaseUid,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNoteById), new { id = note.Id }, note);
        }


        [HttpGet("user/{uid}")]
        public async Task<IActionResult> GetNotesByUser(string uid)
        {
            if (string.IsNullOrEmpty(uid))
            {
                return BadRequest("UID is required.");
            }

            var notes = await _context.Notes.Where(n => n.FirebaseUid == uid).OrderByDescending(n => n.CreatedAt).ToListAsync();
            if (notes == null || notes.Count == 0)
            {
                return NotFound("No notes found for this user.");
            }

            return Ok(notes);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(int id, [FromBody] UpdateNoteDto dto)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
            {
                return NotFound();
            }

            note.Title = dto.Title;
            note.Content = dto.Content;
            note.Category = dto.Category;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
            {
                return NotFound("Notatka nie istnieje.");
            }
            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();
            return NoContent();

        }


        [HttpGet("categories/{uid}")]
        public async Task<ActionResult<List<string>>> GetCategoriesByUser(string uid)
        {
            if (string.IsNullOrEmpty(uid))
                return BadRequest("UID is required.");

            var categories = await _context.Notes
                .Where(n => n.FirebaseUid == uid && !string.IsNullOrEmpty(n.Category))
                .Select(n => n.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }


        [HttpGet("categories/all")]
        public async Task<ActionResult<List<string>>> GetAllCategories()
        {
            var categories = await _context.Notes
                .Where(n => !string.IsNullOrEmpty(n.Category))
                .Select(n => n.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }


        [HttpGet]
        public async Task<ActionResult<List<Note>>> GetNotes([FromQuery] string uid, [FromQuery] string? category)
        {
            if (string.IsNullOrEmpty(uid))
                return BadRequest("UID is required.");

            var query = _context.Notes.Where(n => n.FirebaseUid == uid);

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(n => n.Category == category);

            var notes = await query
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notes);
        }



    }
}
