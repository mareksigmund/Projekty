import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '../Models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations`);
  }

  getReservationById(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/reservations/${id}`);
  }

  createReservation(reservation: Reservation): Observable<Reservation> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Reservation>(`${this.apiUrl}/reservations`, reservation, { headers });
  }

  updateReservation(reservation: Reservation): Observable<Reservation> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    console.log('Sending update request with data:', reservation); // Dodaj ten log
    return this.http.put<Reservation>(`${this.apiUrl}/reservations/${reservation._id}`, reservation, { headers });
  }
  

  deleteReservation(id: string): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete<void>(`${this.apiUrl}/reservations/${id}`, { headers });
}

  getUserReservation(userId: string, restaurantId: string): Observable<Reservation> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Reservation>(`${this.apiUrl}/reservations/user/${userId}/restaurant/${restaurantId}`, { headers });
  }

  getReservationByUserAndRestaurant(userId: string, restaurantId: string): Observable<Reservation> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Reservation>(`${this.apiUrl}/reservations/user/${userId}/restaurant/${restaurantId}`, { headers });
  }

  getUserReservations(userId: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations/user/${userId}`, { headers: this.getAuthHeaders() });
  }
  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}

