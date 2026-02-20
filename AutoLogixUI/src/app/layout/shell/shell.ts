import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, MatToolbarModule, MatButtonModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private auth = inject(AuthService);
  private router = inject(Router);

  roleLabel = computed(() => {
    const r = this.auth.getRole();
    if (r === 'User') return 'Użytkownik';
    if (r === 'Insurer') return 'Ubezpieczyciel';
    if (r === 'Service') return 'Serwis';
    if (r === 'Admin') return 'Admin';
    return '—';
  });

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
