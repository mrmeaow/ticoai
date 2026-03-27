import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="spinnerClass" [style.width.px]="size" [style.height.px]="size">
      <svg class="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  `,
})
export class SpinnerComponent {
  @Input() size = 24;
  @Input() color: 'brand' | 'white' | 'gray' = 'brand';

  get spinnerClass(): string {
    const baseClasses = 'inline-block animate-spin';
    
    const colorClasses = {
      brand: 'text-brand-500',
      white: 'text-white',
      gray: 'text-gray-500',
    };

    return `${baseClasses} ${colorClasses[this.color]}`;
  }
}
