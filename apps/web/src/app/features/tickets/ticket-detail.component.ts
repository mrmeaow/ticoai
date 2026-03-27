import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly ticketService = inject(TicketService);
  readonly messageService = inject(MessageService);
  readonly authService = inject(AuthService);

  messageContent = '';
  sending = signal(false);
  localError = signal<string | null>(null);

  loading = this.ticketService.loading;
  error = this.ticketService.error;
  ticket = this.ticketService.currentTicket;
  currentUserId = '';

  ngOnInit() {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (!ticketId) {
      this.localError.set('Ticket ID is required');
      return;
    }

    // Get current user ID
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId = user.id;
    }

    // Load ticket and messages
    this.ticketService.loadTicketById(ticketId);
    this.messageService.loadMessages(ticketId);
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
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-yellow-100 text-yellow-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
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
