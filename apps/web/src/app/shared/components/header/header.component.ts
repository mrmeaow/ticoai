import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Navigation -->
          <div class="flex items-center gap-8">
            <a routerLink="/dashboard" class="text-xl font-bold text-brand-600">
              TICOAI
            </a>
            <nav class="hidden md:flex gap-4">
              <a
                routerLink="/dashboard"
                routerLinkActive="text-brand-600 border-b-2 border-brand-600"
                class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                routerLink="/tickets"
                routerLinkActive="text-brand-600 border-b-2 border-brand-600"
                class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Tickets
              </a>
              @if (authService.isAdmin()) {
                <a
                  routerLink="/admin"
                  routerLinkActive="text-brand-600 border-b-2 border-brand-600"
                  class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Admin
                </a>
              }
            </nav>
          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            @if (authService.currentUser(); as user) {
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-600 hidden sm:block">
                  {{ user.name }}
                </span>
                <button
                  (click)="onLogout()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  Logout
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  onLogout() {
    this.authService.logout().subscribe();
  }
}
