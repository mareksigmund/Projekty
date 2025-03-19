import { Component, OnInit } from '@angular/core';
import { Avatar } from 'src/app/Models/avatar.model';
import { Reservation } from 'src/app/Models/reservation.model';
import { User } from 'src/app/Models/user.model';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit{
  user: User | null = null;
  avatars: Avatar[] = [];
  isVisible = false;
  reservations: any[] = [];
  carouselPosition = 0;

  constructor(
    private authService: AuthServiceService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.authService.getAvatars().subscribe(
      (data) => {
        this.avatars = data;
      },
      (error) => {
        console.error('Error fetching avatars:', error);
      }
    );
    this.loadReservations();
  }

  selectAvatar(avatarUrl: string): void {
    this.authService.updateAvatar(avatarUrl).subscribe(
      (updatedUser: User) => {
        console.log('Avatar updated successfully');
        this.user = updatedUser; // Update local user object
      },
      (error) => {
        console.error('Error updating avatar:', error);
      }
    );
  }

  changeVisibility(): void {
    this.isVisible = !this.isVisible;
  }

  loadReservations(): void {
    if (this.user && this.user._id) {
      this.reservationService.getUserReservations(this.user._id).subscribe(
        (data: Reservation[]) => {
          this.reservations = data;
        },
        (error: any) => {
          console.error('Error fetching reservations:', error);
        }
      );
    }
  }

  next(): void {
    const containerWidth = 270; // Width of each reservation item including margin
    const visibleItems = 3; // Number of visible items
    if (this.carouselPosition > -(this.reservations.length - visibleItems) * containerWidth) {
      this.carouselPosition -= containerWidth;
      this.updateCarousel();
    }
  }

  prev(): void {
    const containerWidth = 270; // Width of each reservation item including margin
    if (this.carouselPosition < 0) {
      this.carouselPosition += containerWidth;
      this.updateCarousel();
    }
  }

  private updateCarousel(): void {
    const carousel = document.querySelector('.carousel') as HTMLElement;
    carousel.style.transform = `translateX(${this.carouselPosition}px)`;
  }
}