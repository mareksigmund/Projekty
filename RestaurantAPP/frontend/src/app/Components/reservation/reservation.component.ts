import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reservation } from 'src/app/Models/reservation.model';
import { Restaurant, Table } from 'src/app/Models/restaurant.model';
import { AuthServiceService } from 'src/app/services/auth-service.service';
import { ReservationService } from 'src/app/services/reservation.service';
import { RestaurantService } from 'src/app/services/restaurant.service';
import * as moment from 'moment';
@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {
  restaurant: Restaurant | null = null;
  reservation: Reservation = {
    userId: '',
    restaurantId: '',
    date: '',
    time: '',
    seats: 0
  };
  availableTables: Table[] = [];
  existingReservation: Reservation | null = null;
  isLoggedIn: boolean = false;
  editReservation: Reservation = { ...this.reservation }; // Kopia rezerwacji do edycji
  minDate: string = moment().add(1, 'days').format('YYYY-MM-DD'); // Minimum one day in advance
  editReservationMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private restaurantService: RestaurantService,
    private authService: AuthServiceService,
    public router: Router
  ) { }

  ngOnInit(): void {
    const restaurantId = this.route.snapshot.paramMap.get('id');
    this.isLoggedIn = this.authService.isAuthenticated();
    if (restaurantId) {
      this.loadRestaurant(restaurantId);
      if (this.isLoggedIn) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser) {
          this.reservation.userId = currentUser._id;
          this.checkExistingReservation(currentUser._id, restaurantId);
        }
      }
    }
  }

  loadRestaurant(id: string): void {
    this.restaurantService.getRestaurantById(id).subscribe(
      (restaurant) => {
        this.restaurant = restaurant;
        this.reservation.restaurantId = restaurant._id;
        this.availableTables = restaurant.availableTables;
        console.log('Available tables:', this.availableTables); // Dodaj ten log
      },
      (error) => {
        console.error('Error fetching restaurant:', error);
      }
    );
  }
  
  

  submitReservation(): void {
    this.reservationService.createReservation(this.reservation).subscribe(
      (response) => {
        console.log('Reservation created:', response);
        this.existingReservation = response;
      },
      (error) => {
        console.error('Error creating reservation:', error);
      }
    );
  }

  submitEditReservation(): void {
    if (this.existingReservation && this.isDateValid(this.editReservation.date)) {
      console.log('Available tables before finding:', this.availableTables);
      console.log('Edit reservation seats:', this.editReservation.seats);
  
      // Upewnij się, że porównujemy liczby
      const seats = Number(this.editReservation.seats); // Konwersja na liczbę
      const selectedTable = this.availableTables.find(table => table.size === seats);
      console.log('Selected table:', selectedTable);
  
      if (selectedTable && selectedTable.count > 0) {
        this.editReservation.seats = seats; // Upewnij się, że przesyłamy liczbę
        console.log('Edit reservation data:', this.editReservation);
  
        this.reservationService.updateReservation(this.editReservation).subscribe(
          (response) => {
            console.log('Reservation updated:', response);
            alert('Reservation updated successfully!');
            this.existingReservation = response;
            this.loadRestaurant(this.existingReservation.restaurantId); // Ponowne załadowanie restauracji, aby zaktualizować dostępne stoliki
            this.editReservationMode = false;
          },
          (error) => {
            console.error('Error updating reservation:', error);
            alert('Error updating reservation.');
          }
        );
      } else {
        alert('No available tables for the specified number of seats.');
      }
    } else {
      alert('Reservation cannot be updated less than a day in advance.');
    }
  }
  
  
  
  


  
  

  checkExistingReservation(userId: string, restaurantId: string): void {
    this.reservationService.getReservationByUserAndRestaurant(userId, restaurantId).subscribe(
      (reservation) => {
        this.existingReservation = reservation;
        this.editReservation = { ...reservation }; // Kopia istniejącej rezerwacji do edycji
      },
      (error) => {
        if (error.status === 404) {
          this.existingReservation = null;
        } else {
          console.error('Error checking existing reservation:', error);
        }
      }
    );
  }

  cancelReservation(): void {
    if (this.existingReservation && this.isDateValid(this.existingReservation.date)) {
      const reservationId = this.existingReservation._id as string;
      this.reservationService.deleteReservation(reservationId).subscribe(
        () => {
          console.log('Reservation cancelled');
          alert('Reservation cancelled successfully!');
          this.existingReservation = null;
          this.router.navigate(['/']);
        },
        (error) => {
          console.error('Error cancelling reservation:', error);
          alert('Error cancelling reservation.');
        }
      );
    } else {
      alert('Reservation cannot be cancelled less than a day in advance.');
    }
  }
  

  isDateValid(date: string): boolean {
    return moment(date).isAfter(moment().add(1, 'days'));
  }
}