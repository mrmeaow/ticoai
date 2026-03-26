import { Injectable } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

let authService: AuthService;

export function provideAuthInterceptor(auth: AuthService) {
  authService = auth;
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!authService) {
    return next(req);
  }

  const isAuthRequest = req.url.startsWith(environment.apiUrl);
  const token = localStorage.getItem('access_token');

  if (!isAuthRequest || !token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next);
      }
      return throwError(() => error);
    }),
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (!authService) {
    return throwError(() => new Error('Auth service not available'));
  }

  return authService.refreshToken().pipe(
    switchMap(() => {
      const token = localStorage.getItem('access_token');
      const cloned = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(cloned);
    }),
    catchError(() => {
      localStorage.removeItem('access_token');
      // Clear user state via public method
      window.location.href = '/auth/login';
      return throwError(() => new Error('Unauthorized'));
    }),
  );
}
