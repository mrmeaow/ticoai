import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, share, takeUntil, filter } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AiJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AiJobResult {
  status: AiJobStatus;
  result?: string;
  error?: string;
}

export interface AiActionResponse {
  jobId: string;
  resultId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`;
  private sseUrl = `${environment.apiUrl}/sse/jobs`;

  private activeSubscriptions = new Map<string, Subject<void>>();

  summarize(ticketId: string): Observable<AiActionResponse> {
    return this.http.post<AiActionResponse>(`${this.apiUrl}/summarize`, { ticketId });
  }

  detectPriority(ticketId: string): Observable<AiActionResponse> {
    return this.http.post<AiActionResponse>(`${this.apiUrl}/detect-priority`, { ticketId });
  }

  suggestReply(ticketId: string): Observable<AiActionResponse> {
    return this.http.post<AiActionResponse>(`${this.apiUrl}/suggest-reply`, { ticketId });
  }

  subscribeToJob(jobId: string): Observable<AiJobResult> {
    const eventSource = new EventSource(`${this.sseUrl}/${jobId}`);
    const subject = new Subject<AiJobResult>();
    const disconnect$ = new Subject<void>();

    eventSource.onmessage = (event) => {
      try {
        const data: AiJobResult = JSON.parse(event.data);
        subject.next(data);
        if (data.status === 'completed' || data.status === 'failed') {
          this.closeSseConnection(eventSource, jobId);
          subject.complete();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      this.closeSseConnection(eventSource, jobId);
      subject.error(new Error('SSE connection error'));
    };

    this.activeSubscriptions.set(jobId, disconnect$);

    return subject.asObservable().pipe(
      takeUntil(disconnect$),
      filter((message) => message !== null),
      share(),
    );
  }

  unsubscribeFromJob(jobId: string): void {
    const disconnect$ = this.activeSubscriptions.get(jobId);
    if (disconnect$) {
      disconnect$.next();
      disconnect$.complete();
      this.activeSubscriptions.delete(jobId);
    }
  }

  private closeSseConnection(eventSource: EventSource, jobId: string): void {
    eventSource.close();
    const disconnect$ = this.activeSubscriptions.get(jobId);
    if (disconnect$) {
      disconnect$.next();
      disconnect$.complete();
      this.activeSubscriptions.delete(jobId);
    }
  }

  cleanup(): void {
    this.activeSubscriptions.forEach((disconnect$) => {
      disconnect$.next();
      disconnect$.complete();
    });
    this.activeSubscriptions.clear();
  }
}
