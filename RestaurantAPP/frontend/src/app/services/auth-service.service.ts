import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../Models/user.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Avatar } from '../Models/avatar.model';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  register(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        this.setCurrentUser(response.user); // Zakładamy, że backend zwraca dane użytkownika w odpowiedzi
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAvatars(): Observable<Avatar[]> {
    return this.http.get<Avatar[]>(`${this.apiUrl}/avatars`);
  }

  updateAvatar(avatarUrl: string): Observable<User> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<User>(`${this.apiUrl}/user/avatar`, { avatarUrl }, { headers }).pipe(
      tap((updatedUser: User) => {
        this.setCurrentUser(updatedUser);
      })
    );
  }
  getUserAvatar(userId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/users/${userId}/avatar`);
  }
}


