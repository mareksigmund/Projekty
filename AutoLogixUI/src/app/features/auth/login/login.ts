import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  @Output() requestRegister = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.error = null;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigateByUrl('/app/dashboard');
      },
      error: () => {
        this.error = 'Nieprawidłowy email lub hasło';
        this.loading = false;
      },
    });
  }
}
