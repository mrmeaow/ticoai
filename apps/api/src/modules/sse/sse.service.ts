import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, share, takeUntil } from 'rxjs/operators';

export interface SseJobResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

interface SseClient {
  jobId: string;
  subject: Subject<SseJobResult>;
  disconnect$: Subject<void>;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private clients: Map<string, SseClient> = new Map();

  addClient(jobId: string): Observable<SseJobResult> {
    const existingClient = this.clients.get(jobId);
    if (existingClient) {
      this.logger.warn(
        `Client already subscribed to job ${jobId}, reusing subscription`,
      );
      return existingClient.subject.asObservable().pipe(
        filter((message) => message !== null),
        share(),
      );
    }

    const subject = new Subject<SseJobResult>();
    const disconnect$ = new Subject<void>();
    const client: SseClient = { jobId, subject, disconnect$ };

    this.clients.set(jobId, client);
    this.logger.log(
      `Client subscribed to job ${jobId}. Total clients: ${this.clients.size}`,
    );

    return subject.asObservable().pipe(
      filter((message) => message !== null),
      takeUntil(disconnect$),
      share(),
    );
  }

  removeClient(jobId: string): void {
    const client = this.clients.get(jobId);
    if (client) {
      client.disconnect$.next();
      client.disconnect$.complete();
      client.subject.complete();
      this.clients.delete(jobId);
      this.logger.log(
        `Client unsubscribed from job ${jobId}. Remaining clients: ${this.clients.size}`,
      );
    }
  }

  notify(jobId: string, data: SseJobResult): void {
    const client = this.clients.get(jobId);
    if (client) {
      this.logger.log(
        `Notifying client of job ${jobId} status: ${data.status}`,
      );
      client.subject.next(data);

      // Auto-disconnect on final states
      if (data.status === 'completed' || data.status === 'failed') {
        this.removeClient(jobId);
      }
    } else {
      this.logger.debug(
        `No client subscribed to job ${jobId}, result will be available on next poll`,
      );
    }
  }

  hasClient(jobId: string): boolean {
    return this.clients.has(jobId);
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
