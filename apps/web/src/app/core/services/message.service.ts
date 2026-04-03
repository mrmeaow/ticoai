import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Message {
  id: string;
  ticketId: string;
  senderId?: string;
  sender?: { id: string; name: string };
  role: 'AGENT' | 'CUSTOMER' | 'AI';
  content: string;
  isAi: boolean;
  createdAt: string;
}

export interface CreateMessageDto {
  content: string;
  ticketId: string;
  senderId: string;
  role?: 'AGENT' | 'CUSTOMER' | 'AI';
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private messagesSignal = signal<Message[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  messages = this.messagesSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  loadMessages(ticketId: string) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Message[]>(`${this.apiUrl}/tickets/${ticketId}/messages`).subscribe({
      next: (data) => {
        this.messagesSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.error?.message || 'Failed to load messages');
        this.loadingSignal.set(false);
      },
    });
  }

  createMessage(ticketId: string, content: string, senderId: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/tickets/${ticketId}/messages`, {
      content,
      senderId,
      role: 'AGENT',
    });
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tickets/${messageId}/messages/${messageId}`);
  }

  addMessage(message: Message) {
    this.messagesSignal.update(messages => [...messages, message]);
  }

  clearMessages() {
    this.messagesSignal.set([]);
  }
}
