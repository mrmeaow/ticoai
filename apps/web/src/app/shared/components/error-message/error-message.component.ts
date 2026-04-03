import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message) {
      <div [class]="errorClass">
        @if (dismissible) {
          <button
            (click)="dismissed.emit($event)"
            class="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        }
        <div class="flex items-start">
          @if (showIcon) {
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          <span>{{ message }}</span>
        </div>
      </div>
    }
  `,
})
export class ErrorMessageComponent {
  @Input() message = '';
  @Input() variant: 'error' | 'warning' = 'error';
  @Input() dismissible = false;
  @Input() showIcon = true;
  dismissed = output<MouseEvent>();

  get errorClass(): string {
    const baseClasses = 'px-4 py-3 rounded-lg relative';
    
    const variantClasses = {
      error: 'bg-red-50 border border-red-200 text-red-600',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-600',
    };

    return `${baseClasses} ${variantClasses[this.variant]}`;
  }
}
