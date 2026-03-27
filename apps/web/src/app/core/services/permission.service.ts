import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private authService = inject(AuthService);

  private userPermissions = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    // For now, return all permissions based on role
    // In production, this should come from the JWT payload or API
    const rolePermissions: Record<string, string[]> = {
      SUPER_ADMIN: [
        'tickets:create', 'tickets:read', 'tickets:update', 'tickets:delete', 'tickets:assign',
        'messages:create', 'messages:read',
        'ai:execute', 'ai:read',
        'users:create', 'users:read', 'users:update', 'users:delete',
        'roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:assign',
        'dashboard:read',
        'admin:tickets', 'admin:users',
      ],
      ADMIN: [
        'tickets:create', 'tickets:read', 'tickets:update', 'tickets:assign',
        'messages:create', 'messages:read',
        'ai:execute', 'ai:read',
        'users:create', 'users:read', 'users:update',
        'roles:read', 'roles:assign',
        'dashboard:read',
        'admin:tickets', 'admin:users',
      ],
      AGENT: [
        'tickets:create', 'tickets:read', 'tickets:update',
        'messages:create', 'messages:read',
        'ai:execute', 'ai:read',
        'users:read',
        'dashboard:read',
      ],
      VIEWER: [
        'tickets:read',
        'messages:read',
        'ai:read',
        'dashboard:read',
      ],
    };

    const permissions = new Set<string>();
    user.roles.forEach(role => {
      const rolePerms = rolePermissions[role.name] || [];
      rolePerms.forEach(perm => permissions.add(perm));
    });

    return Array.from(permissions);
  });

  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  hasAnyPermissions(permissions: string[]): boolean {
    return permissions.some(perm => this.hasPermission(perm));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(perm => this.hasPermission(perm));
  }
}
