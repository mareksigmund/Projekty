import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
  ],
})
export class LayoutComponent {
  username: string = 'Użytkownik';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getUserData().subscribe({
      next: (user: any) => {
        this.username = user.displayName || 'Użytkownik';
      },
      error: (err) => {
        console.error('Błąd podczas pobierania danych użytkownika:', err);
        this.authService.logout();
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
