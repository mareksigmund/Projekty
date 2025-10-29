import { Component, OnInit } from '@angular/core';
import { NoteStoreService } from '../../../core/note-store.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Note } from '../note';
import { Router, RouterModule } from '@angular/router';
import { NotesService } from '../../../core/notes.service';
import { QuizService } from '../../../core/quiz.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class NotesListComponent implements OnInit {
  notes$: Observable<Note[]>;
  categories: string[] = [];
  selectedCategory = 'Wszystkie';

  constructor(
    private noteStore: NoteStoreService,
    private notesService: NotesService,
    private quizService: QuizService,
    private router: Router
  ) {
    this.notes$ = this.noteStore.notes$;
  }

  ngOnInit(): void {
    const uid =
      typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    if (uid) {
      this.noteStore.loadNotes(uid);
      this.notesService.getCategories(uid).subscribe({
        next: (data) => (this.categories = ['Wszystkie', ...data]),
        error: (err) => console.error('Błąd ładowania kategorii', err),
      });
    }
  }
  deleteNote(id: number) {
    if (confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
      this.noteStore.deleteNote(id).subscribe({
        next: () => alert('Notatka została usunięta!'),
        error: (err) => console.error('Błąd podczas usuwania notatki', err),
      });
    }
  }

  openPreview(id: number) {
    this.router.navigate(['/notes', id]);
  }

  filterByCategory(): void {
    const uid = localStorage.getItem('userId');
    if (!uid) return;

    if (this.selectedCategory === 'Wszystkie') {
      this.noteStore.loadNotes(uid);
    } else {
      this.notesService
        .getNotesByCategory(uid, this.selectedCategory)
        .subscribe({
          next: (notes) => this.noteStore.updateNotes(notes),
          error: (err) => console.error('Błąd filtrowania notatek', err),
        });
    }
  }
}
