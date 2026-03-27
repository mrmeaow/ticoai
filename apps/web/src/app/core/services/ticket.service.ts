import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignee?: { id: string; name: string };
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  private ticketsSignal = signal<Ticket[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private totalSignal = signal(0);
  private hasMoreSignal = signal(false);
  private nextCursorSignal = signal<string | undefined>(undefined);

  tickets = this.ticketsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  total = this.totalSignal.asReadonly();
  hasMore = this.hasMoreSignal.asReadonly();
  nextCursor = this.nextCursorSignal.asReadonly();

  loadTickets(filters: TicketFilters = {}) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const params: any = { ...filters };
    if (params.cursor === undefined) delete params.cursor;
    if (params.limit === undefined) params.limit = 20;

    return this.http.get<TicketsResponse>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.ticketsSignal.set(data.tickets);
        this.totalSignal.set(data.total);
        this.hasMoreSignal.set(data.hasMore);
        this.nextCursorSignal.set(data.nextCursor);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.error?.message || 'Failed to load tickets');
        this.loadingSignal.set(false);
      },
    });
  }

  loadMore() {
    const cursor = this.nextCursorSignal();
    if (!cursor) return;

    this.loadingSignal.set(true);
    this.http.get<TicketsResponse>(this.apiUrl, {
      params: { cursor, limit: 20 },
    }).subscribe({
      next: (data) => {
        this.ticketsSignal.update(current => [...current, ...data.tickets]);
        this.hasMoreSignal.set(data.hasMore);
        this.nextCursorSignal.set(data.nextCursor);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.error?.message || 'Failed to load more tickets');
        this.loadingSignal.set(false);
      },
    });
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(data: { title: string; description: string; priority?: string; assigneeId?: string }): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, data);
  }

  updateTicket(id: string, data: Partial<Ticket>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}`, data);
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
