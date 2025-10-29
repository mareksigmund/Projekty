﻿namespace Learnin_Traacker.API.Models
{
    public class Note
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Category { get; set; }
        public DateTime CreatedAt { get; set; }
        public string FirebaseUid { get; set; }



    }
}
