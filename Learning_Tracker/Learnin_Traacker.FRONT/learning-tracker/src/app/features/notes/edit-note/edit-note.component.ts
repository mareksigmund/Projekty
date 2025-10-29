import { Component, OnInit } from '@angular/core';
import { NotesService } from '../../../core/notes.service';
import { Note, UpdateNoteDto } from '../note';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-note',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-note.component.html',
  styleUrl: './edit-note.component.css',
})
export class EditNoteComponent implements OnInit {
  noteId!: number;
  updateNote: UpdateNoteDto = {
    title: '',
    content: '',
    category: '',
  };
  noteLoaded = false;

  constructor(
    private notesService: NotesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      console.error('Brak ID notatki w URL');
      return;
    }

    this.noteId = +idParam;

    this.notesService.getNoteById(this.noteId).subscribe({
      next: (note: Note) => {
        this.updateNote = {
          title: note.title,
          content: note.content,
          category: note.category,
        };
        this.noteLoaded = true;
      },
      error: (err) => console.error('Błąd pobierania notatki', err),
    });
  }

  save(): void {
    this.notesService.updateNote(this.noteId, this.updateNote).subscribe({
      next: () => {
        alert('Notatka zaktualizowana!');
        this.router.navigate(['/notes']);
      },
      error: (err) => console.error('Błąd zapisu notatki', err),
    });
  }

  cancel(): void {
    this.router.navigate(['/notes']);
  }
}
