import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Restaurant } from '../Models/restaurant.model';
import { User } from '../Models/user.model';

// interface Restaurant {
//   name: string;
//   description: string;
//   tables: { size: number; count: number }[];
//   rating: number;
//   images: string[];
//   menu: { name: string; description: string; price: number }[];
// }

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private apiUrl = 'http://localhost:3000/api/restaurants';
  private topRestaurantsUrl = 'http://localhost:3000/api/top-restaurants';
  private recommendationsUrl = 'http://localhost:3000/api/recommendations';
  private userRatingsUrl = 'http://localhost:3000/api/users';
  constructor(private http:HttpClient) { }

  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.apiUrl);
  }

  getTopRestaurants():Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.topRestaurantsUrl}`);
  }

  getRestaurant(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`);
  }

  getRestaurantById(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`);
  }

  getRestaurantByName(name: string): Observable<Restaurant> {
    const decodedName = name.replace(/_/g, ' ');
    return this.http.get<Restaurant>(`${this.apiUrl}/name/${decodedName}`);
  }

  rateRestaurant(id: string, rating: number, comment: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const payload = { rating, comment };
    return this.http.post(`${this.apiUrl}/${id}/rate`, payload, { headers });
  }

  getUserRating(restaurantId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${restaurantId}/rating`, { headers: this.getAuthHeaders() });
  }
  
  getUserRatings(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${restaurantId}/ratings`);
  }

  getRestaurantRecommendations(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.recommendationsUrl}/restaurants`, { headers: this.getAuthHeaders() });
  }

  getUserRecommendation(): Observable<User> {
    return this.http.get<User>(`${this.recommendationsUrl}/users`, { headers: this.getAuthHeaders() });
  }

  getUserRatingsWithRestaurants(userId: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.userRatingsUrl}/${userId}/ratings`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

}
