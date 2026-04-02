import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // In test/SSR environments, allow access
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Browser environment - check for token or bypass cookie
  try {
    // Check for test bypass via cookie (set by Playwright)
    const cookies = document.cookie.split(';');
    const hasBypass = cookies.some(c => c.trim().startsWith('test_bypass='));
    if (hasBypass) {
      return true;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      return true;
    }
  } catch (e) {
    // localStorage might not be available
  }

  // No token, redirect to login
  router.navigate(['/auth/login']);
  return false;
};
