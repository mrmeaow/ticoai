import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, share } from 'rxjs/operators';

interface SseClient {
  id: string;
  subject: Subject<any>;
}

@Injectable()
export class SseService {
  private clients: Map<string, SseClient> = new Map();

  addClient(jobId: string): Observable<any> {
    const subject = new Subject<any>();
    const client: SseClient = { id: jobId, subject };

    this.clients.set(jobId, client);

    return subject.asObservable().pipe(
      filter((message) => message !== null),
      share(),
    );
  }

  removeClient(jobId: string): void {
    const client = this.clients.get(jobId);
    if (client) {
      client.subject.complete();
      this.clients.delete(jobId);
    }
  }

  notify(jobId: string, data: any): void {
    const client = this.clients.get(jobId);
    if (client) {
      client.subject.next(data);
      this.removeClient(jobId);
    }
  }

  hasClient(jobId: string): boolean {
    return this.clients.has(jobId);
  }
}
