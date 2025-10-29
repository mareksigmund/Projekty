import { Component, OnInit } from '@angular/core';
import { QuizQuestion } from '../quiz-question';
import { QuizService } from '../../core/quiz.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-list.component.html',
  styleUrl: './quiz-list.component.css',
})
export class QuizListComponent implements OnInit {
  questions: QuizQuestion[] = [];
  filteredQuestions: QuizQuestion[] = [];
  categories: string[] = [];
  selectedCategory = '';
  page = 1;
  pageSize = 10;

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    this.quizService.getAllQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        this.filteredQuestions = [...data];
        this.categories = [
          ...new Set(
            data.map((q) => q.category).filter((cat): cat is string => !!cat)
          ),
        ];
      },
      error: (err) => console.error('Błąd pobierania pytań:', err),
    });
  }

  filterQuestions() {
    this.filteredQuestions = this.selectedCategory
      ? this.questions.filter((q) => q.category === this.selectedCategory)
      : [...this.questions];

    this.page = 1;
  }

  get paginatedQuestions(): QuizQuestion[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredQuestions.slice(start, start + this.pageSize);
  }
}
