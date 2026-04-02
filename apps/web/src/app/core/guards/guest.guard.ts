import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // In SSR, allow access to auth pages
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Browser environment - check if user is authenticated
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      // User has token, redirect to dashboard
      router.navigate(['/dashboard']);
      return false;
    }
  } catch (e) {
    // localStorage might not be available
  }

  // No token, allow access to login/register
  return true;
};
