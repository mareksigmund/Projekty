import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateNoteDto, Note, UpdateNoteDto } from '../features/notes/note';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { QuizQuestion } from '../features/quiz-question';
@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notes`;

  getNotesByUserId(uid: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/user/${uid}`);
  }

  createNote(note: CreateNoteDto): Observable<Note> {
    return this.http.post<Note>(this.apiUrl, note);
  }

  updateNote(id: number, note: UpdateNoteDto): Observable<Note> {
    return this.http.put<Note>(`${this.apiUrl}/${id}`, note);
  }

  getNoteById(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getCategories(uid: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories/${uid}`);
  }

  getNotesByCategory(uid: string, category: string): Observable<Note[]> {
    return this.http.get<Note[]>(
      `${this.apiUrl}?uid=${uid}&category=${category}`
    );
  }

  getAllCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories/all`);
  }
}
