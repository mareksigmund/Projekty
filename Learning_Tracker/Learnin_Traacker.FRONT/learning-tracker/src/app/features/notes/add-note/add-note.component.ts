import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotesService } from '../../../core/notes.service';
import { CreateNoteDto, Note } from '../note';
import { FormsModule } from '@angular/forms';
import { NoteStoreService } from '../../../core/note-store.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-note',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-note.component.html',
  styleUrl: './add-note.component.css',
})
export class AddNoteComponent implements OnInit {
  note: CreateNoteDto = {
    title: '',
    content: '',
    category: '',
    firebaseUid: '',
  };

  categories: string[] = [];
  showNewCategoryField = false;
  newCategory = '';

  constructor(
    private notesService: NotesService,
    private noteStore: NoteStoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notesService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = [...data, '➕ Dodaj nową kategorię'];
      },
      error: (err) => console.error('Błąd pobierania kategorii', err),
    });
  }

  onCategoryChange(): void {
    if (this.note.category === '➕ Dodaj nową kategorię') {
      this.showNewCategoryField = true;
      this.note.category = ''; // wyczyść tymczasowo
    } else {
      this.showNewCategoryField = false;
    }
  }

  addNote() {
    const uid = localStorage.getItem('userId');
    if (!uid) {
      console.error('Brak UID użytkownika');
      return;
    }

    const newNote = { ...this.note, firebaseUid: uid };

    this.notesService.createNote(newNote).subscribe({
      next: (created) => {
        this.noteStore.addNote(created);
        this.router.navigate(['/notes']);
        alert('Notatka utworzona!');
        this.note = { title: '', content: '', category: '', firebaseUid: uid };
      },
      error: (err) => console.error('Błąd podczas tworzenia notatki', err),
    });
  }

  cancel() {
    this.note = {
      title: '',
      content: '',
      category: '',
      firebaseUid: '',
    };
    window.history.back();
  }
}
