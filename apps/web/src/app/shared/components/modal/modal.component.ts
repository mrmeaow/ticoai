import { Component, Input, Output, EventEmitter, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          (click)="closed.emit($event)"
        ></div>

        <!-- Modal Panel -->
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div
            class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full"
            [class.sm:max-w-lg]="size === 'md'"
            [class.sm:max-w-xl]="size === 'lg'"
            [class.sm:max-w-sm]="size === 'sm'"
          >
            <!-- Header -->
            @if (title) {
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold leading-6 text-gray-900">{{ title }}</h3>
              </div>
            }

            <!-- Content -->
            <div class="bg-white px-4 py-6 sm:p-6">
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (showFooter !== false) {
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
                <ng-content select="[modal-footer]"></ng-content>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showFooter: boolean | null = null;
  closed = output<MouseEvent>();
}
