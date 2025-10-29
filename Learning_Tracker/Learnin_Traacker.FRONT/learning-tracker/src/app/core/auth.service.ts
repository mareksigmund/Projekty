import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { signOut } from 'firebase/auth';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  private readonly loginEndpoint = `${this.apiUrl}/auth/firebase-login`;

  isLoginMode = true;

  async loginOrRegister(email: string, password: string): Promise<void> {
    try {
      // Logowanie lub rejestracja przez Firebase Auth
      if (this.isLoginMode) {
        await signInWithEmailAndPassword(this.auth, email, password);
      } else {
        await createUserWithEmailAndPassword(this.auth, email, password);
      }

      // Pobranie ID tokena i wysłanie go do backendu .NET
      const token = await this.auth.currentUser?.getIdToken();
      const uid = this.auth.currentUser?.uid;

      if (!token || !uid) throw new Error('Brak tokena lub UID');

      localStorage.setItem('userId', uid);
      
      await this.http.post(this.loginEndpoint, { idToken: token }).toPromise();

      // Przejście do ekranu po zalogowaniu
      this.router.navigate(['/dashboard']);
    } catch (error) {
      throw error;
    }
  }

  // Metoda do wylogowania użytkownika
  async logout(): Promise<void> {
    await signOut(this.auth);
    localStorage.removeItem('userId'); // lub inne dane które zapisujesz
    localStorage.removeItem('user');   // jeśli zapisujesz obiekt
    this.router.navigate(['/']);
  }

  // Metoda do pobierania danych użytkownika
  getUserData(){

    const uid = localStorage.getItem('userId');

     if (!uid) {
    throw new Error('Brak UID w localStorage');
    }
    return this.http.get(`${this.apiUrl}/User/me?uid=${uid}`);
  }


  // Metoda do aktualizacji nazwy użytkownika
  updateDisplayName(displayName: string) {
  const uid = localStorage.getItem('userId');
  if (!uid) {
    throw new Error('Brak UID w localStorage');
  }
return this.http.put(`${this.apiUrl}/User/me/displayname?uid=${uid}`, {
  displayName: displayName
});

}


 
  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  get modeLabel(): string {
    return this.isLoginMode ? 'Logowanie' : 'Rejestracja';
  }

  get currentMode(): boolean {
    return this.isLoginMode;
  }
}
