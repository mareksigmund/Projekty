// src/app/components/register/register.component.ts

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/Models/user.model';
import { Address } from 'src/app/Models/address.model';
import { AuthServiceService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent{
  user: User = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: undefined
  };

  address: Address = {
    street: '',
    city: '',
    state: '',
    zip: ''
  };
  loginData = {
    email: '',
    password: ''
  };

  showOptional = false;
  isLoginMode = false;
  returnUrl: string = '';

  constructor(private authService: AuthServiceService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.isLoginMode = data['isLoginMode'] || false;
    });

    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
    });
  }

  register(): void {
    this.user.address = this.address;
    this.authService.register(this.user).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => console.error('Error registering user', err)
    });
  }

  login(): void {
    this.authService.login(this.loginData).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: err => console.error('Error logging in', err)
    });
  }

  toggleOptional(): void {
    this.showOptional = !this.showOptional;
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.showOptional = false; // Reset the showOptional state
  }
}