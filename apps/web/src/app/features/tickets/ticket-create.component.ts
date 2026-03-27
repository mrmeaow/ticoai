import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [RouterLink, FormsModule, InputComponent, ButtonComponent, ErrorMessageComponent],
  templateUrl: './ticket-create.component.html',
})
export class TicketCreateComponent {
  private ticketService = inject(TicketService);
  authService = inject(AuthService);
  private router = inject(Router);

  title = '';
  description = '';
  priority = 'MEDIUM';
  assigneeId = '';
  submitted = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  // Mock agents list for dropdown
  agents = signal<{ id: string; name: string }[]>([
    { id: '1', name: 'John Agent' },
    { id: '2', name: 'Jane Agent' },
  ]);

  onSubmit() {
    this.submitted.set(true);

    if (!this.title.trim() || !this.description.trim()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const ticketData: { title: string; description: string; priority?: string; assigneeId?: string } = {
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
    };

    if (this.assigneeId && this.authService.isAdmin()) {
      ticketData.assigneeId = this.assigneeId;
    }

    this.ticketService.createTicket(ticketData).subscribe({
      next: (ticket) => {
        this.router.navigate(['/tickets', ticket.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || 'Failed to create ticket. Please try again.');
      },
    });
  }

  cancel() {
    this.router.navigate(['/tickets']);
  }
}
