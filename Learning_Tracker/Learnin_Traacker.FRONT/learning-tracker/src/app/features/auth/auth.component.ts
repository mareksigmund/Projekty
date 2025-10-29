import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  email = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(public authService: AuthService) {}

  async submit() {
    this.error = '';
    try {
      await this.authService.loginOrRegister(this.email, this.password);
    } catch (err: any) {
      this.error = err.message;
    }
  }

  toggleMode() {
    this.authService.toggleMode();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
