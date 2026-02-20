import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth-service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
  @Output() requestLogin = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  success: string | null = null;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: [''],
    lastName: [''],
  });

  submit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    const raw = this.form.getRawValue();

    // firstName/lastName opcional - send null if empty
    const payload = {
      email: raw.email,
      password: raw.password,
      firstName: raw.firstName?.trim() ? raw.firstName.trim() : null,
      lastName: raw.lastName?.trim() ? raw.lastName.trim() : null,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.success = 'Konto utworzone. Możesz się zalogować.';
        this.loading = false;

        //opctional: automatic redirect after 1s
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: (err) => {
        //MVP: one message. Later we will split into details from ASP.NET errors
        this.error = 'Nie udało się zarejestrować. Sprawdź dane lub czy email nie jest zajęty.';
        this.loading = false;
      },
    });
  }
}
