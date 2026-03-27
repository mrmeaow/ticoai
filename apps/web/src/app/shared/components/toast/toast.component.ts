import { Component, Input, Output, EventEmitter, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fixed bottom-4 right-4 z-50 space-y-2">
        @for (toast of toasts; track toast.id) {
          <div
            [class]="toastClass(toast.type)"
            role="alert"
            class="flex items-center w-full max-w-xs p-4 rounded-lg shadow-lg"
          >
            @if (showIcon) {
              <div class="flex-shrink-0">
                @switch (toast.type) {
                  @case ('success') {
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  @case ('error') {
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  @case ('warning') {
                    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                  @case ('info') {
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                }
              </div>
            }
            <div class="ml-3 text-sm font-normal text-gray-900">{{ toast.message }}</div>
            <button
              type="button"
              class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
              (click)="dismiss(toast.id)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class ToastComponent {
  @Input() visible = false;
  @Input() showIcon = true;
  dismissed = output<string>();

  toasts: { id: string; message: string; type: ToastType }[] = [];

  show(message: string, type: ToastType = 'info', duration = 5000) {
    const id = Math.random().toString(36).substr(2, 9);
    this.toasts.push({ id, message, type });

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.dismissed.emit(id);
  }

  success(message: string, duration = 5000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 5000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 5000) {
    this.show(message, 'info', duration);
  }

  toastClass(type: ToastType): string {
    const baseClasses = 'bg-white shadow-lg border-l-4';
    const typeClasses = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500',
    };
    return `${baseClasses} ${typeClasses[type]}`;
  }
}
