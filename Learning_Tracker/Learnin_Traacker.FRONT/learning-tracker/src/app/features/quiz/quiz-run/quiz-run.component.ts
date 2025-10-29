import { Component, OnInit } from '@angular/core';
import { QuizQuestion } from '../../quiz-question';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../core/quiz.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quiz-run',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-run.component.html',
  styleUrl: './quiz-run.component.css',
})
export class QuizRunComponent implements OnInit {
  mode: 'ai' | 'db' | 'mixed' = 'ai';
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  selectedAnswers: string[] = [];
  score = 0;
  quizFinished = false;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const noteId = Number(this.route.snapshot.paramMap.get('noteId'));
    const fullUrl = this.router.url;

    let quiz$: Observable<QuizQuestion[]>;

    if (fullUrl.includes('run-mixed')) {
      this.mode = 'mixed';
      quiz$ = this.quizService.generateMixedQuiz(noteId);
    } else if (fullUrl.includes('run-db')) {
      this.mode = 'db';
      quiz$ = this.quizService.generateQuizFromDb(noteId);
    } else {
      this.mode = 'ai';
      quiz$ = this.quizService.generateQuizFromNote(noteId);
    }

    quiz$.subscribe({
      next: (data) => {
        this.questions = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Nie udało się pobrać pytań.';
        this.isLoading = false;
        console.error('Błąd pobierania pytań', err);
      },
    });
  }
  selectAnswer(answer: string): void {
    const correct = this.questions[this.currentQuestionIndex].correctAnswer;
    if (answer === correct) this.score++;
    this.selectedAnswers.push(answer);
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      this.finishQuiz();
    }
  }

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentQuestionIndex];
  }

  get modeLabel(): string {
    switch (this.mode) {
      case 'db':
        return 'Quiz z bazy danych';
      case 'mixed':
        return 'Quiz mieszany (AI + baza)';
      default:
        return 'Quiz generowany przez AI';
    }
  }

  get sourceLabel(): string {
    const type = this.currentQuestion?.sourceType?.toLowerCase();
    if (type === 'ai') return '🤖 AI';
    if (type === 'manual') return '✍️ Ręcznie';
    return '📁 Baza';
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goNotes(): void {
    this.router.navigate(['/notes']);
  }

  finishQuiz() {
    this.quizFinished = true;

    const uid = localStorage.getItem('userId');
    if (!uid) {
      console.error('Brak UID do zapisania wyniku');
      return;
    }

    const category = this.questions[0]?.category || 'Nieznana';

    this.quizService
      .saveQuizResult({
        firebaseUid: uid,
        category: category,
        totalQuestions: this.questions.length,
        correctAnswers: this.score,
      })
      .subscribe({
        next: () => console.log('Wynik quizu zapisany'),
        error: (err) => console.error('Błąd zapisu wyniku', err),
      });
  }
}
