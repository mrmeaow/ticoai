import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'priority-low' | 'priority-medium' | 'priority-high' | 'priority-critical';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: 'sm' | 'md' = 'sm';

  get badgeClass(): string {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      'priority-low': 'bg-green-100 text-green-800',
      'priority-medium': 'bg-blue-100 text-blue-800',
      'priority-high': 'bg-yellow-100 text-yellow-800',
      'priority-critical': 'bg-red-100 text-red-800',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]}`;
  }
}
