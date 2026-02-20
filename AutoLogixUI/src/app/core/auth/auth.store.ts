import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser } from './auth.models';

const TOKEN_KEY = 'autologix_token';
const USER_KEY = 'autologix_user';
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private tokenSubject = new BehaviorSubject<string | null>(sessionStorage.getItem(TOKEN_KEY));
  token$ = this.tokenSubject.asObservable();

  private userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  user$ = this.userSubject.asObservable();

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  setSession(token: string, user: AuthUser) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.tokenSubject.next(token);
    this.userSubject.next(user);
  }

  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }

  private readUser(): AuthUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
