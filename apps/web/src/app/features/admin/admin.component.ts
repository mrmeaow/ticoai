import { Component, inject, signal } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface User {
  id: string;
  name: string;
  email: string;
  roles: { id: string; name: string }[];
  isActive: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    BadgeComponent,
    ButtonComponent,
    SpinnerComponent,
    ErrorMessageComponent,
    EmptyStateComponent,
  ],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  activeTab = 'users';
  loading = signal(false);
  error = signal<string | null>(null);

  users = signal<User[]>([
    {
      id: '1',
      name: 'System Admin',
      email: 'admin@ticoai.local',
      roles: [{ id: '1', name: 'SUPER_ADMIN' }],
      isActive: true,
    },
    {
      id: '2',
      name: 'John Agent',
      email: 'agent@ticoai.local',
      roles: [{ id: '2', name: 'AGENT' }],
      isActive: true,
    },
    {
      id: '3',
      name: 'Jane Viewer',
      email: 'viewer@ticoai.local',
      roles: [{ id: '3', name: 'VIEWER' }],
      isActive: false,
    },
  ]);

  getRoleBadgeVariant(roleName: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      SUPER_ADMIN: 'danger',
      ADMIN: 'warning',
      AGENT: 'info',
      VIEWER: 'default',
    };
    return variants[roleName] || 'default';
  }
}
