import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QuizService } from '../../core/quiz.service';
import { AuthService } from '../../core/auth.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent implements OnInit {
  stats: {
    category: string;
    total: number;
    correct: number;
    percent: number;
  }[] = [];

  totalQuestions: number = 0;
  totalCorrect: number = 0;
  overallPercent: number = 0;
  bestCategory: string = '';
  worstCategory: string = '';

  isLoading = true;
  error: string | null = null;

  // Wykres kołowy
  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: 'pie' = 'pie';

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Skuteczność wg kategorii',
      },
    },
  };

  constructor(
    private quizService: QuizService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const uid = localStorage.getItem('userId');
    if (!uid) {
      this.error = 'Brak UID użytkownika.';
      this.isLoading = false;
      return;
    }

    this.quizService.getUserQuizSummary(uid).subscribe({
      next: (data: any) => {
        this.stats = data;
        this.pieChartLabels = data.map((d: any) => d.category);
        this.pieChartData = data.map((d: any) => d.percent);

        // Podsumowanie globalne
        this.totalQuestions = data.reduce(
          (sum: number, d: any) => sum + d.total,
          0
        );
        this.totalCorrect = data.reduce(
          (sum: number, d: any) => sum + d.correct,
          0
        );
        this.overallPercent = this.totalQuestions
          ? Math.round((this.totalCorrect / this.totalQuestions) * 100)
          : 0;

        // Najlepsza i najgorsza kategoria
        this.bestCategory =
          [...data].sort((a, b) => b.percent - a.percent)[0]?.category || '';
        this.worstCategory =
          [...data].sort((a, b) => a.percent - b.percent)[0]?.category || '';

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Błąd pobierania statystyk', err);
        this.error = 'Nie udało się pobrać statystyk.';
        this.isLoading = false;
      },
    });
  }
}
