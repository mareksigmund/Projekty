using System.ComponentModel.DataAnnotations;

namespace Learnin_Traacker.API.Dtos
{
    public class CreateNoteDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string FirebaseUid { get; set; } = string.Empty;
    }

}
