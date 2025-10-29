import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, Observable, of } from 'rxjs';
import { QuizQuestion } from '../features/quiz-question';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/quiz`;
  private readonly resultsApiUrl = `${environment.apiUrl}/quizresults`;

  generateQuizFromNote(
    noteId: number,
    count: number = 5
  ): Observable<QuizQuestion[]> {
    return this.http
      .post<QuizQuestion[]>(
        `${this.apiUrl}/from-note/${noteId}?count=${count}`,
        {}
      )
      .pipe(
        catchError((err) => {
          console.error('Błąd generowania quizu', err);
          return of([]);
        })
      );
  }
  getAllQuestions(): Observable<QuizQuestion[]> {
    return this.http.get<QuizQuestion[]>(`${this.apiUrl}/all`);
  }

  generateMixedQuiz(
    noteId: number,
    aiCount: number = 2,
    dbCount: number = 3
  ): Observable<QuizQuestion[]> {
    return this.http
      .post<QuizQuestion[]>(
        `${this.apiUrl}/from-mixed/${noteId}?aiCount=${aiCount}&dbCount=${dbCount}`,
        {}
      )
      .pipe(
        catchError((err) => {
          console.error('Błąd generowania quizu mieszanego', err);
          return of([]);
        })
      );
  }

  generateQuizFromDb(
    noteId: number,
    count: number = 5
  ): Observable<QuizQuestion[]> {
    return this.http
      .post<QuizQuestion[]>(
        `${this.apiUrl}/from-db/${noteId}?count=${count}`,
        {}
      )
      .pipe(
        catchError((err) => {
          console.error('Błąd generowania quizu z bazy', err);
          return of([]);
        })
      );
  }

  saveQuizResult(result: {
    firebaseUid: string;
    category: string;
    totalQuestions: number;
    correctAnswers: number;
  }) {
    return this.http.post(`${this.resultsApiUrl}`, result);
  }

  getUserQuizSummary(uid: string) {
    return this.http.get(`${this.resultsApiUrl}/user/${uid}/summary`);
  }
}
