import { Component, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';
import { SpinnerComponent } from '../spinner/spinner.component';

export type AiActionType = 'summarize' | 'detect-priority' | 'suggest-reply';

export interface AiActionResult {
  type: AiActionType;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ButtonComponent, SpinnerComponent],
  template: `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900">AI Assistant</h3>
            <p class="text-xs text-gray-500">Powered by LM Studio</p>
          </div>
        </div>
        @if (hasActiveJob()) {
          <app-badge variant="info">
            <svg class="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing
          </app-badge>
        }
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <app-button variant="secondary" size="sm" [disabled]="hasActiveJob()" (clicked)="onAction('summarize')">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summarize
        </app-button>

        <app-button variant="secondary" size="sm" [disabled]="hasActiveJob()" (clicked)="onAction('detect-priority')">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Detect Priority
        </app-button>

        <app-button variant="secondary" size="sm" [disabled]="hasActiveJob()" (clicked)="onAction('suggest-reply')">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 2v-2z" />
          </svg>
          Suggest Reply
        </app-button>
      </div>

      @for (result of results(); track result.type) {
        <div class="mt-3 p-3 bg-white rounded-lg border" [class.border-purple-200]="result.status === 'completed'" [class.border-red-200]="result.status === 'failed'">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-700 uppercase tracking-wide">{{ getActionLabel(result.type) }}</span>
            <app-badge [variant]="getResultBadge(result.status)">
              @switch (result.status) {
                @case ('pending') {
                  <svg class="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
                @case ('processing') {
                  <svg class="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
              }
              {{ result.status }}
            </app-badge>
          </div>

          @if (result.status === 'completed' && result.result) {
            <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ result.result }}</p>
          }

          @if (result.status === 'failed' && result.error) {
            <p class="text-sm text-red-600">{{ result.error }}</p>
          }

          @if (result.status === 'pending' || result.status === 'processing') {
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <app-spinner [size]="16" color="brand" />
              <span>Processing your request...</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AiPanelComponent {
  @Input() ticketId = '';
  actionRequested = output<{ type: AiActionType; ticketId: string }>();

  results = signal<AiActionResult[]>([]);
  private resultsMap = new Map<AiActionType, AiActionResult>();

  onAction(type: AiActionType) {
    if (!this.ticketId) return;
    this.resultsMap.set(type, { type, status: 'pending' });
    this.updateResults();
    this.actionRequested.emit({ type, ticketId: this.ticketId });
  }

  updateResult(type: AiActionType, status: AiActionResult['status'], result?: string, error?: string) {
    const current = this.resultsMap.get(type) || { type, status: 'idle' };
    this.resultsMap.set(type, { ...current, status, result, error });
    this.updateResults();
  }

  private updateResults() {
    this.results.set(Array.from(this.resultsMap.values()));
  }

  hasActiveJob(): boolean {
    return Array.from(this.resultsMap.values()).some(r => r.status === 'pending' || r.status === 'processing');
  }

  getActionLabel(type: AiActionType): string {
    const labels: Record<AiActionType, string> = {
      'summarize': 'Summary',
      'detect-priority': 'Priority Detection',
      'suggest-reply': 'Suggested Reply',
    };
    return labels[type];
  }

  getResultBadge(status: AiActionResult['status']): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'priority-low' | 'priority-medium' | 'priority-high' | 'priority-critical' {
    const variants: Record<AiActionResult['status'], any> = {
      idle: 'default',
      pending: 'info',
      processing: 'info',
      completed: 'success',
      failed: 'danger',
    };
    return variants[status];
  }
}
