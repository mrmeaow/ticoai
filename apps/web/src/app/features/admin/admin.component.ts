import { Component, inject, signal, OnInit } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { usersControllerFindAll, usersControllerActivateUser, usersControllerDeactivateUser } from '@pkg/api-sdk';

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
export class AdminComponent implements OnInit {
  activeTab = 'users';
  loading = signal(false);
  error = signal<string | null>(null);

  users = signal<User[]>([]);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    usersControllerFindAll()
      .then((response) => {
        this.users.set(response.users);
        this.loading.set(false);
      })
      .catch((err: any) => {
        this.error.set(err.message || 'Failed to load users');
        this.loading.set(false);
      });
  }

  activateUser(userId: string) {
    usersControllerActivateUser(userId)
      .then(() => this.loadUsers())
      .catch((err: any) => this.error.set(err.message || 'Failed to activate user'));
  }

  deactivateUser(userId: string) {
    usersControllerDeactivateUser(userId)
      .then(() => this.loadUsers())
      .catch((err: any) => this.error.set(err.message || 'Failed to deactivate user'));
  }

  editUser(userId: string) {
    // TODO: implement edit modal or navigation
    console.log('Edit user', userId);
  }

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
