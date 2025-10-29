import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Note } from '../features/notes/note';
import { NotesService } from './notes.service';

@Injectable({
  providedIn: 'root',
})
export class NoteStoreService {
  private notesSubject = new BehaviorSubject<Note[]>([]);
  notes$: Observable<Note[]> = this.notesSubject.asObservable();

  private notesService = inject(NotesService);

  loadNotes(uid: string): void {
    this.notesService
      .getNotesByUserId(uid)
      .pipe(tap((notes) => this.notesSubject.next(notes)))
      .subscribe();
  }

  addNote(note: Note): void {
    const currentNotes = this.notesSubject.getValue();
    this.notesSubject.next([note, ...currentNotes]);
  }

  deleteNote(id: number): Observable<void> {
    return this.notesService.deleteNote(id).pipe(
      tap(() => {
        const updated = this.notesSubject.getValue().filter((n) => n.id !== id);
        this.notesSubject.next(updated);
      })
    );
  }

  updateNotes(notes: Note[]): void {
    this.notesSubject.next(notes);
  }
}
