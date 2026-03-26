import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { name: string };
  createdAt: string;
}

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Tickets</h2>
          <a
            routerLink="/tickets/new"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
          >
            New Ticket
          </a>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (ticket of tickets(); track ticket.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <a [routerLink]="['/tickets', ticket.id]" class="text-primary hover:underline">
                      {{ ticket.title }}
                    </a>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {{ ticket.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-2 py-1 text-xs rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': ticket.priority === 'LOW',
                        'bg-blue-100 text-blue-800': ticket.priority === 'MEDIUM',
                        'bg-yellow-100 text-yellow-800': ticket.priority === 'HIGH',
                        'bg-red-100 text-red-800': ticket.priority === 'CRITICAL'
                      }"
                    >
                      {{ ticket.priority }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {{ ticket.assignee?.name || 'Unassigned' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {{ ticket.createdAt | date:'short' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class TicketListComponent implements OnInit {
  private http = inject(HttpClient);
  tickets = signal<Ticket[]>([]);

  ngOnInit() {
    this.http.get<{ tickets: Ticket[] }>(`${environment.apiUrl}/tickets`).subscribe({
      next: (data) => this.tickets.set(data.tickets),
      error: (err) => console.error('Failed to load tickets', err),
    });
  }
}
