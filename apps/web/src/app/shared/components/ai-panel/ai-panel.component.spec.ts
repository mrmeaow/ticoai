import { render, screen, fireEvent } from '@testing-library/angular/zoneless';
import { inputBinding, outputBinding } from '@angular/core';
import { AiPanelComponent, AiActionType, AiActionResult } from './ai-panel.component';

describe('AiPanelComponent', () => {
  describe('rendering', () => {
    it('should render the AI panel with title', async () => {
      await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      expect(screen.getByText('AI Assistant')).toBeTruthy();
    });

    it('should render the subtitle', async () => {
      await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      expect(screen.getByText('Powered by LM Studio')).toBeTruthy();
    });

    it('should have gradient background styling', async () => {
      const { container } = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const panel = container.querySelector('.bg-gradient-to-br');
      expect(panel).toBeTruthy();
    });

    it('should have purple theme border', async () => {
      const { container } = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const panel = container.querySelector('.border-purple-200');
      expect(panel).toBeTruthy();
    });

    it('should render the lightning bolt icon', async () => {
      const { container } = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const iconContainer = container.querySelector('.bg-purple-600');
      expect(iconContainer).toBeTruthy();
    });
  });

  describe('action buttons', () => {
    it('should render Summarize button', async () => {
      await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      expect(screen.getByText('Summarize')).toBeTruthy();
    });

    it('should render Detect Priority button', async () => {
      await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      expect(screen.getByText('Detect Priority')).toBeTruthy();
    });

    it('should render Suggest Reply button', async () => {
      await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      expect(screen.getByText('Suggest Reply')).toBeTruthy();
    });

    it('should render all three action buttons in a grid', async () => {
      const { container } = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
      const buttons = grid?.querySelectorAll('app-button');
      expect(buttons?.length).toBe(3);
    });
  });

  describe('action emission', () => {
    it('should emit actionRequested with summarize type when Summarize is clicked', async () => {
      const handleAction = vi.fn();
      await render(AiPanelComponent, {
        bindings: [
          inputBinding('ticketId', () => 'ticket-123'),
          outputBinding('actionRequested', handleAction),
        ],
      });
      fireEvent.click(screen.getByText('Summarize'));
      expect(handleAction).toHaveBeenCalledWith({ type: 'summarize', ticketId: 'ticket-123' });
    });

    it('should emit actionRequested with detect-priority type when Detect Priority is clicked', async () => {
      const handleAction = vi.fn();
      await render(AiPanelComponent, {
        bindings: [
          inputBinding('ticketId', () => 'ticket-456'),
          outputBinding('actionRequested', handleAction),
        ],
      });
      fireEvent.click(screen.getByText('Detect Priority'));
      expect(handleAction).toHaveBeenCalledWith({ type: 'detect-priority', ticketId: 'ticket-456' });
    });

    it('should emit actionRequested with suggest-reply type when Suggest Reply is clicked', async () => {
      const handleAction = vi.fn();
      await render(AiPanelComponent, {
        bindings: [
          inputBinding('ticketId', () => 'ticket-789'),
          outputBinding('actionRequested', handleAction),
        ],
      });
      fireEvent.click(screen.getByText('Suggest Reply'));
      expect(handleAction).toHaveBeenCalledWith({ type: 'suggest-reply', ticketId: 'ticket-789' });
    });

    it('should not emit actionRequested when ticketId is empty', async () => {
      const handleAction = vi.fn();
      await render(AiPanelComponent, {
        bindings: [
          inputBinding('ticketId', () => ''),
          outputBinding('actionRequested', handleAction),
        ],
      });
      fireEvent.click(screen.getByText('Summarize'));
      expect(handleAction).not.toHaveBeenCalled();
    });

    it('should emit exactly once per click', async () => {
      const handleAction = vi.fn();
      await render(AiPanelComponent, {
        bindings: [
          inputBinding('ticketId', () => 'ticket-1'),
          outputBinding('actionRequested', handleAction),
        ],
      });
      fireEvent.click(screen.getByText('Summarize'));
      fireEvent.click(screen.getByText('Detect Priority'));
      expect(handleAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('processing state', () => {
    it('should show Processing badge when action is active', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'processing');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Processing')).toBeTruthy();
    });

    it('should show spinner in badge when processing', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'processing');
      fixture.fixture.detectChanges();

      const spinner = document.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should show "Processing your request..." text in result area', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'processing');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Processing your request...')).toBeTruthy();
    });

    it('should show Processing badge when action is pending', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('detect-priority', 'pending');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Processing')).toBeTruthy();
    });

    it('should show "Processing your request..." text when pending', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('suggest-reply', 'pending');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Processing your request...')).toBeTruthy();
    });

    it('should not show Processing badge when idle', async () => {
      await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      expect(screen.queryByText('Processing')).toBeFalsy();
    });
  });

  describe('completed state', () => {
    it('should show result when action is completed', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'completed', 'This is the summary of the ticket.');
      fixture.fixture.detectChanges();

      expect(screen.getByText('This is the summary of the ticket.')).toBeTruthy();
    });

    it('should show completed result with purple border', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'completed', 'Summary text');
      fixture.fixture.detectChanges();

      const resultContainer = document.querySelector('.border-purple-200');
      expect(resultContainer).toBeTruthy();
    });

    it('should show action label for completed result', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'completed', 'Summary result');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Summary')).toBeTruthy();
    });

    it('should show success badge for completed status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'completed', 'Done');
      fixture.fixture.detectChanges();

      expect(screen.getByText('completed')).toBeTruthy();
    });

    it('should show completed result for detect-priority', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('detect-priority', 'completed', 'High priority');
      fixture.fixture.detectChanges();

      expect(screen.getByText('High priority')).toBeTruthy();
      expect(screen.getByText('Priority Detection')).toBeTruthy();
    });

    it('should show completed result for suggest-reply', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('suggest-reply', 'completed', 'Here is a suggested reply.');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Here is a suggested reply.')).toBeTruthy();
      expect(screen.getByText('Suggested Reply')).toBeTruthy();
    });

    it('should not show Processing badge when completed', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'completed', 'Done');
      fixture.fixture.detectChanges();

      expect(screen.queryByText('Processing')).toBeFalsy();
    });
  });

  describe('failed state', () => {
    it('should show error when action fails', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'failed', undefined, 'AI service unavailable');
      fixture.fixture.detectChanges();

      expect(screen.getByText('AI service unavailable')).toBeTruthy();
    });

    it('should show error with red text styling', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'failed', undefined, 'Connection timeout');
      fixture.fixture.detectChanges();

      const errorText = screen.getByText('Connection timeout');
      expect(errorText.classList.contains('text-red-600')).toBe(true);
    });

    it('should show failed result with red border', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'failed', undefined, 'Error occurred');
      fixture.fixture.detectChanges();

      const resultContainer = document.querySelector('.border-red-200');
      expect(resultContainer).toBeTruthy();
    });

    it('should show danger badge for failed status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'failed', undefined, 'Error');
      fixture.fixture.detectChanges();

      expect(screen.getByText('failed')).toBeTruthy();
    });

    it('should not show Processing badge when failed', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'failed', undefined, 'Error');
      fixture.fixture.detectChanges();

      expect(screen.queryByText('Processing')).toBeFalsy();
    });
  });

  describe('updateResult method', () => {
    it('should update result for summarize action', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('summarize', 'completed', 'Summary text');
      fixture.fixture.detectChanges();

      const results = component.results();
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('summarize');
      expect(results[0].status).toBe('completed');
      expect(results[0].result).toBe('Summary text');
    });

    it('should update result for detect-priority action', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('detect-priority', 'completed', 'High');
      fixture.fixture.detectChanges();

      const results = component.results();
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('detect-priority');
      expect(results[0].result).toBe('High');
    });

    it('should update result for suggest-reply action', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('suggest-reply', 'completed', 'Reply text');
      fixture.fixture.detectChanges();

      const results = component.results();
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('suggest-reply');
      expect(results[0].result).toBe('Reply text');
    });

    it('should store error in result when failed', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('summarize', 'failed', undefined, 'Something went wrong');
      fixture.fixture.detectChanges();

      const results = component.results();
      expect(results[0].error).toBe('Something went wrong');
      expect(results[0].status).toBe('failed');
    });

    it('should track multiple results independently', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('summarize', 'completed', 'Summary');
      component.updateResult('detect-priority', 'failed', undefined, 'Error');
      fixture.fixture.detectChanges();

      const results = component.results();
      expect(results.length).toBe(2);

      const summary = results.find(r => r.type === 'summarize');
      const priority = results.find(r => r.type === 'detect-priority');

      expect(summary?.status).toBe('completed');
      expect(summary?.result).toBe('Summary');
      expect(priority?.status).toBe('failed');
      expect(priority?.error).toBe('Error');
    });

    it('should update existing result type when called again', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('summarize', 'processing');
      fixture.fixture.detectChanges();
      expect(component.results()[0].status).toBe('processing');

      component.updateResult('summarize', 'completed', 'Final summary');
      fixture.fixture.detectChanges();
      expect(component.results().length).toBe(1);
      expect(component.results()[0].status).toBe('completed');
      expect(component.results()[0].result).toBe('Final summary');
    });
  });

  describe('hasActiveJob method', () => {
    it('should return false when no actions are active', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.hasActiveJob()).toBe(false);
    });

    it('should return true when an action is pending', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'pending');

      expect(component.hasActiveJob()).toBe(true);
    });

    it('should return true when an action is processing', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('detect-priority', 'processing');

      expect(component.hasActiveJob()).toBe(true);
    });

    it('should return false when an action is completed', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'completed', 'Done');

      expect(component.hasActiveJob()).toBe(false);
    });

    it('should return false when an action is failed', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;
      component.updateResult('summarize', 'failed', undefined, 'Error');

      expect(component.hasActiveJob()).toBe(false);
    });
  });

  describe('getActionLabel method', () => {
    it('should return "Summary" for summarize type', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getActionLabel('summarize')).toBe('Summary');
    });

    it('should return "Priority Detection" for detect-priority type', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getActionLabel('detect-priority')).toBe('Priority Detection');
    });

    it('should return "Suggested Reply" for suggest-reply type', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getActionLabel('suggest-reply')).toBe('Suggested Reply');
    });
  });

  describe('getResultBadge method', () => {
    it('should return "default" for idle status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getResultBadge('idle')).toBe('default');
    });

    it('should return "info" for pending status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getResultBadge('pending')).toBe('info');
    });

    it('should return "info" for processing status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getResultBadge('processing')).toBe('info');
    });

    it('should return "success" for completed status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getResultBadge('completed')).toBe('success');
    });

    it('should return "danger" for failed status', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      expect(component.getResultBadge('failed')).toBe('danger');
    });
  });

  describe('onAction integration', () => {
    it('should set action to pending and emit when onAction is called', async () => {
      const handleAction = vi.fn();
      const fixture = await render(AiPanelComponent, {
        bindings: [
          inputBinding('ticketId', () => 'ticket-1'),
          outputBinding('actionRequested', handleAction),
        ],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      fireEvent.click(screen.getByText('Summarize'));
      fixture.fixture.detectChanges();

      expect(handleAction).toHaveBeenCalledWith({ type: 'summarize', ticketId: 'ticket-1' });
      expect(component.hasActiveJob()).toBe(true);
      expect(component.results()[0].status).toBe('pending');
    });
  });

  describe('multiple simultaneous results', () => {
    it('should render both completed and failed results', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('summarize', 'completed', 'Summary result');
      component.updateResult('detect-priority', 'failed', undefined, 'Priority error');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Summary result')).toBeTruthy();
      expect(screen.getByText('Priority error')).toBeTruthy();
      expect(screen.getByText('Summary')).toBeTruthy();
      expect(screen.getByText('Priority Detection')).toBeTruthy();
    });

    it('should render processing and completed results together', async () => {
      const fixture = await render(AiPanelComponent, {
        bindings: [inputBinding('ticketId', () => 'test-id')],
      });
      const component = fixture.fixture.componentInstance as AiPanelComponent;

      component.updateResult('summarize', 'completed', 'Done');
      component.updateResult('suggest-reply', 'processing');
      fixture.fixture.detectChanges();

      expect(screen.getByText('Done')).toBeTruthy();
      expect(screen.getByText('Processing your request...')).toBeTruthy();
      expect(component.hasActiveJob()).toBe(true);
    });
  });
});
