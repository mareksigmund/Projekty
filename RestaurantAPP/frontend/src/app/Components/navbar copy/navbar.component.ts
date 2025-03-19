import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(public authService: AuthServiceService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    alert('You have been logged out successfully.');
    this.router.navigate(['/']);
  }
}