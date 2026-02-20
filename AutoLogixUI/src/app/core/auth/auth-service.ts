import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from './auth.store';
import { AuthResponse, LoginRequest, RegisterRequest } from './auth.models';
import { tap } from 'rxjs';

type AppRole = 'User' | 'Insurer' | 'Admin' | 'Service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private store: AuthStore) {}

  login(payload: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, payload)
      .pipe(tap((res) => this.store.setSession(res.token, res.user)));
  }

  register(payload: RegisterRequest) {
    //201 created without response body token and user
    return this.http.post<void>(`${this.baseUrl}/auth/register`, payload);
  }

  logout() {
    this.store.clearSession();
  }

  getToken(): string | null {
    return this.store.token;
  }

  getRoleFromUser(): AppRole | null {
    return (this.store.user?.role as AppRole) ?? null;
  }

  getRoleFromToken(): AppRole | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const role =
        payload?.role ??
        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        null;

      return role as AppRole | null;
    } catch {
      return null;
    }
  }

  getRole(): AppRole | null {
    return this.getRoleFromUser() ?? this.getRoleFromToken();
  }
}
