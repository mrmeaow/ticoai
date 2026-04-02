import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, switchMap, map, ReplaySubject, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { setAuthToken, configureSdk } from '@pkg/api-sdk';

export interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = computed(() => !!this.currentUserSignal());
  private loadingSignal = signal(true);
  private userLoaded$ = new ReplaySubject<User | null>(1);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = this.isAuthenticatedSignal;
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    configureSdk(environment.apiUrl);
    this.updateToken(localStorage.getItem('access_token'));
    this.loadUser().subscribe();
  }

  /** Returns a Promise that resolves when the initial user load completes */
  waitForUserLoad(): Promise<User | null> {
    // If already loaded (loading is false), resolve immediately
    if (!this.loadingSignal()) {
      return Promise.resolve(this.currentUserSignal());
    }
    // Otherwise wait for the next userLoaded$ emission
    return new Promise((resolve) => {
      this.userLoaded$.pipe(take(1)).subscribe(resolve);
    });
  }

  private updateToken(token: string | null) {
    setAuthToken(token);
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthTokens>(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.accessToken);
          this.updateToken(response.accessToken);
        }),
        switchMap((response) =>
          this.loadUser().pipe(map(() => response)),
        ),
      );
  }

  register(email: string, password: string, name: string) {
    return this.http
      .post<AuthTokens>(`${this.apiUrl}/auth/register`, { email, password, name })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.accessToken);
          this.updateToken(response.accessToken);
        }),
        switchMap((response) =>
          this.loadUser().pipe(map(() => response)),
        ),
      );
  }

  logout() {
    return this.http
      .post(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          localStorage.removeItem('access_token');
          this.updateToken(null);
          this.currentUserSignal.set(null);
          this.router.navigate(['/auth/login']);
        }),
      );
  }

  refreshToken() {
    return this.http
      .post<AuthTokens>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.accessToken);
        }),
      );
  }

  private loadUser(): Observable<User | null> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.currentUserSignal.set(null);
      this.updateToken(null);
      this.loadingSignal.set(false);
      this.userLoaded$.next(null);
      return of(null);
    }

    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.loadingSignal.set(false);
        this.userLoaded$.next(user);
      }),
      catchError((err) => {
        this.currentUserSignal.set(null);
        localStorage.removeItem('access_token');
        this.updateToken(null);
        this.loadingSignal.set(false);
        this.userLoaded$.next(null);
        return of(null);
      }),
    );
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
