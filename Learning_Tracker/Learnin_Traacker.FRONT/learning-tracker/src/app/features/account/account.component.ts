import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  user: any = null;
  displayName = '';
  status = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getUserData().subscribe({
      next: (data: any) => {
        this.user = data;
        this.displayName = data.displayName || '';
      },
      error: (err) => {
        console.error('Błąd pobierania danych użytkownika:', err);
        this.status = 'Nie udało się załadować danych.';
      },
    });
  }

  updateName(): void {
    if (!this.displayName.trim()) {
      this.status = 'Nick nie może być pusty.';
      return;
    }

    this.authService.updateDisplayName(this.displayName).subscribe({
      next: () => {
        this.status = 'Nick został zaktualizowany';
      },
      error: () => {
        this.status = 'Błąd podczas zapisu.';
      },
    });
  }
}
