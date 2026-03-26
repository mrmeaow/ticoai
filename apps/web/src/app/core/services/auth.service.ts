import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: { id: string; name: string }[];
}

export interface AuthTokens {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = computed(() => !!this.currentUserSignal());

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = this.isAuthenticatedSignal;

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthTokens>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.accessToken);
          this.loadUser();
        }),
      );
  }

  register(email: string, password: string, name: string) {
    return this.http
      .post<AuthTokens>(`${this.apiUrl}/register`, { email, password, name })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.accessToken);
          this.loadUser();
        }),
      );
  }

  logout() {
    return this.http
      .post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          localStorage.removeItem('access_token');
          this.currentUserSignal.set(null);
          this.router.navigate(['/auth/login']);
        }),
      );
  }

  refreshToken() {
    return this.http
      .post<AuthTokens>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.accessToken);
        }),
      );
  }

  private loadUser() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.currentUserSignal.set(null);
      return;
    }

    this.http.get<User>(`${this.apiUrl}/me`).subscribe({
      next: (user) => this.currentUserSignal.set(user),
      error: () => {
        this.currentUserSignal.set(null);
        localStorage.removeItem('access_token');
      },
    });
  }

  hasRole(roleNames: string[]): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    return user.roles.some((r) => roleNames.includes(r.name));
  }

  isAdmin(): boolean {
    return this.hasRole(['SUPER_ADMIN', 'ADMIN']);
  }
}
