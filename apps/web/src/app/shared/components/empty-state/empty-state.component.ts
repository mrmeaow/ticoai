import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center py-12 px-4">
      @if (icon) {
        <div class="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg [class]="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            @switch (icon) {
              @case ('inbox') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              }
              @case ('search') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              }
              @case ('document') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              }
              @default {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              }
            }
          </svg>
        </div>
      }
      <h3 class="text-lg font-medium text-gray-900 mb-1">{{ title }}</h3>
      <p class="text-gray-500 text-sm mb-4">{{ description }}</p>
      @if (actionText && actionClick) {
        <button
          (click)="actionClick.emit($event)"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {{ actionText }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'No items found';
  @Input() description = '';
  @Input() icon: 'inbox' | 'search' | 'document' = 'inbox';
  @Input() actionText = '';
  actionClick = output<MouseEvent>();

  get iconClass(): string {
    return 'w-full h-full';
  }
}
