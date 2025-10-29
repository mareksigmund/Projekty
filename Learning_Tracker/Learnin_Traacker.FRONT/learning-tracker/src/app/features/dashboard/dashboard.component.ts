import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  userData: any;
  newDisplayName: string = '';
  hoveredCard: string | null = null;

  descriptions: Record<string, string> = {
    notes:
      'Dodawaj i edytuj notatki. Zorganizuj swoją wiedzę i rozwiązuj quizy na podstawie własnych materiałów.',
    quiz: 'Lista quizów. Możesz sprawdzić bazę pytań.',
    stats: 'Twoje statystyki skuteczności. Sprawdź, w czym jesteś dobry.',
    account: 'Zmień dane konta lub ustawienia profilu.',
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getUserData().subscribe({
      next: (data) => {
        this.userData = data;
        console.log('Dane użytkownika:', data);
      },
      error: (err) => {
        console.error('Błąd pobierania danych użytkownika:', err);
      },
    });
  }

  updateName() {
    this.authService.updateDisplayName(this.newDisplayName).subscribe({
      next: () => {
        alert('Imię zaktualizowane!');
        this.userData.displayName = this.newDisplayName;
      },
      error: (err) => console.error('Błąd:', err),
    });
  }
}
