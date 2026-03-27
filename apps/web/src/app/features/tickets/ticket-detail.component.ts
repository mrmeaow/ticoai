import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { AiService, type AiJobResult } from '../../core/services/ai.service';
import { AiPanelComponent, type AiActionType } from '../../shared/components/ai-panel/ai-panel.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, AiPanelComponent],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  readonly ticketService = inject(TicketService);
  readonly messageService = inject(MessageService);
  readonly authService = inject(AuthService);
  private aiService = inject(AiService);

  messageContent = '';
  sending = signal(false);
  localError = signal<string | null>(null);
  currentJobId = signal<string | null>(null);

  loading = this.ticketService.loading;
  error = this.ticketService.error;
  ticket = this.ticketService.currentTicket;
  currentUserId = '';
  ticketId = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.localError.set('Ticket ID is required');
      return;
    }

    this.ticketId = id;

    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId = user.id;
    }

    this.ticketService.loadTicketById(id);
    this.messageService.loadMessages(id);
  }

  ngOnDestroy() {
    if (this.currentJobId()) {
      this.aiService.unsubscribeFromJob(this.currentJobId()!);
    }
    this.aiService.cleanup();
  }

  onAiAction(event: { type: AiActionType; ticketId: string }) {
    const { type, ticketId } = event;

    let request$: any;
    switch (type) {
      case 'summarize':
        request$ = this.aiService.summarize(ticketId);
        break;
      case 'detect-priority':
        request$ = this.aiService.detectPriority(ticketId);
        break;
      case 'suggest-reply':
        request$ = this.aiService.suggestReply(ticketId);
        break;
    }

    request$.subscribe({
      next: (response: { jobId: string; resultId: string }) => {
        this.currentJobId.set(response.jobId);
        this.subscribeToJobUpdates(response.jobId, type);
      },
      error: (err: unknown) => {
        const aiPanel = document.querySelector('app-ai-panel') as any;
        if (aiPanel) {
          aiPanel.updateResult(type, 'failed', undefined, err instanceof Error ? err.message : 'Failed to process AI request');
        }
      },
    });
  }

  private subscribeToJobUpdates(jobId: string, type: AiActionType) {
    this.aiService.subscribeToJob(jobId).subscribe({
      next: (data: AiJobResult) => {
        const aiPanel = document.querySelector('app-ai-panel') as any;
        if (aiPanel) {
          aiPanel.updateResult(type, data.status, data.result, data.error);
        }

        if (data.status === 'completed' || data.status === 'failed') {
          this.currentJobId.set(null);
        }
      },
      error: (err) => {
        console.error('SSE subscription error:', err);
        const aiPanel = document.querySelector('app-ai-panel') as any;
        if (aiPanel) {
          aiPanel.updateResult(type, 'failed', undefined, 'Connection lost');
        }
        this.currentJobId.set(null);
      },
    });
  }

  onSubmit() {
    const content = this.messageContent;
    const ticketId = this.route.snapshot.paramMap.get('id');

    if (!content.trim() || !ticketId || !this.currentUserId) {
      return;
    }

    this.sending.set(true);
    this.localError.set(null);

    this.messageService.createMessage(ticketId, content, this.currentUserId).subscribe({
      next: (message) => {
        this.messageService.addMessage(message);
        this.messageContent = '';
        this.sending.set(false);
      },
      error: (err) => {
        this.localError.set(err.error?.message || 'Failed to send message');
        this.sending.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      OPEN: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
      RESOLVED: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
      CLOSED: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/10',
    };
    return classes[status] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/10';
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      LOW: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
      MEDIUM: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
      HIGH: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
      CRITICAL: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10',
    };
    return classes[priority] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/10';
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
