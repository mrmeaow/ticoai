import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
