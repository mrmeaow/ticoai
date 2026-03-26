import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  recent: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-900">TICOAI</h1>
            </div>
            <div class="flex items-center space-x-4">
              @if (authService.currentUser(); as user) {
                <span class="text-sm text-gray-600">{{ user.name }}</span>
              }
              <button
                (click)="logout()"
                class="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        @if (stats(); as s) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-6 rounded-lg shadow">
              <dt class="text-sm font-medium text-gray-500">Total Tickets</dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">{{ s.total }}</dd>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <dt class="text-sm font-medium text-gray-500">Open</dt>
              <dd class="mt-1 text-3xl font-semibold text-blue-600">{{ s.open }}</dd>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <dt class="text-sm font-medium text-gray-500">In Progress</dt>
              <dd class="mt-1 text-3xl font-semibold text-yellow-600">{{ s.inProgress }}</dd>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <dt class="text-sm font-medium text-gray-500">High Priority</dt>
              <dd class="mt-1 text-3xl font-semibold text-red-600">{{ s.highPriority }}</dd>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Recent Tickets</h3>
            </div>
            <div class="p-6">
              @if (s.recent.length > 0) {
                <ul class="divide-y divide-gray-200">
                  @for (ticket of s.recent; track ticket.id) {
                    <li class="py-4">
                      <a [routerLink]="['/tickets', ticket.id]" class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-primary">{{ ticket.title }}</p>
                          <p class="text-sm text-gray-500">{{ ticket.status }}</p>
                        </div>
                        <span class="text-sm text-gray-400">{{ ticket.priority }}</span>
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-gray-500 text-center py-4">No tickets yet</p>
              }
            </div>
          </div>

          <div class="mt-6">
            <a
              routerLink="/tickets"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
            >
              View All Tickets
            </a>
          </div>
        } @else {
          <div class="text-center py-8">
            <p class="text-gray-500">Loading dashboard...</p>
          </div>
        }
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private http = inject(HttpClient);

  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard`).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Failed to load dashboard', err),
    });
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
