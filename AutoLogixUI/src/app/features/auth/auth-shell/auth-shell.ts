import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';
import { Login } from '../login/login';
import { Register } from '../register/register';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [Login, Register],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  private router = inject(Router);
  private location = inject(Location);

  // 'login' | 'register'
  mode = signal<'login' | 'register'>('login');

  // Klasa na kartę dla animacji
  cardClass = computed(() => (this.mode() === 'login' ? 'is-login' : 'is-register'));

  constructor() {
    // Tryb na starcie + przy każdej nawigacji
    this.syncModeFromUrl();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.syncModeFromUrl();
    });
  }

  private syncModeFromUrl() {
    const url = this.router.url;
    this.mode.set(url.includes('/register') ? 'register' : 'login');
  }

  goLogin() {
    this.mode.set('login');
    this.location.go('/login');
  }

  goRegister() {
    this.mode.set('register');
    this.location.go('/register');
  }

  toggle() {
    this.mode() === 'login' ? this.goRegister() : this.goLogin();
  }
}
