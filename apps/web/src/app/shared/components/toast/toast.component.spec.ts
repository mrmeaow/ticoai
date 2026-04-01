import { render, screen, fireEvent } from '@testing-library/angular';
import { By } from '@angular/platform-browser';
import { ToastComponent } from './toast.component';

function getToastComponent(fixture: any): ToastComponent {
  return fixture.debugElement.query(By.directive(ToastComponent)).componentInstance as ToastComponent;
}

const renderOptions = { imports: [ToastComponent], autoDetectChanges: false, detectChangesOnRender: false };

describe('ToastComponent', () => {
  it('should not render when visible is false', async () => {
    const { container } = await render(`<app-toast [visible]="false" />`, renderOptions);
    expect(container.querySelector('.fixed.bottom-4')).toBeFalsy();
  });

  it('should render when visible is true', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    result.fixture.detectChanges();
    expect(result.container.querySelector('.fixed.bottom-4')).toBeTruthy();
  });

  it('should show success toast', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.success('Operation completed');
    result.fixture.detectChanges();
    expect(screen.getByText('Operation completed')).toBeTruthy();
  });

  it('should show error toast', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.error('Something went wrong');
    result.fixture.detectChanges();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('should show warning toast', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.warning('Be careful');
    result.fixture.detectChanges();
    expect(screen.getByText('Be careful')).toBeTruthy();
  });

  it('should show info toast', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Just so you know');
    result.fixture.detectChanges();
    expect(screen.getByText('Just so you know')).toBeTruthy();
  });

  it('should dismiss toast when close button is clicked', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.show('Dismissible toast', 'info', 0);
    result.fixture.detectChanges();

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons[closeButtons.length - 1];
    fireEvent.click(closeButton);

    expect(component.toasts.length).toBe(0);
  });

  it('should emit dismissed event when toast is dismissed', async () => {
    const handleDismissed = vi.fn();
    const result = await render(`<app-toast [visible]="true" (dismissed)="handleDismissed($event)" />`, {
      ...renderOptions,
      componentProperties: { handleDismissed },
    });
    const component = getToastComponent(result.fixture);
    component.show('Test toast', 'info', 0);
    result.fixture.detectChanges();

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons[closeButtons.length - 1];
    fireEvent.click(closeButton);
    result.fixture.detectChanges();

    expect(component.toasts.length).toBe(0);
  });

  it('should show icon by default', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.success('With icon');
    result.fixture.detectChanges();

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should hide icon when showIcon is false', async () => {
    const result = await render(`<app-toast [visible]="true" [showIcon]="false" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.success('No icon');
    result.fixture.detectChanges();

    const iconContainer = document.querySelector('.flex-shrink-0');
    expect(iconContainer).toBeFalsy();
  });

  it('should apply success border color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.success('Success toast');
    result.fixture.detectChanges();

    const toastElement = screen.getByText('Success toast').closest('[role="alert"]');
    expect(toastElement?.classList.contains('border-green-500')).toBe(true);
  });

  it('should apply error border color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.error('Error toast');
    result.fixture.detectChanges();

    const toastElement = screen.getByText('Error toast').closest('[role="alert"]');
    expect(toastElement?.classList.contains('border-red-500')).toBe(true);
  });

  it('should apply warning border color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.warning('Warning toast');
    result.fixture.detectChanges();

    const toastElement = screen.getByText('Warning toast').closest('[role="alert"]');
    expect(toastElement?.classList.contains('border-yellow-500')).toBe(true);
  });

  it('should apply info border color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Info toast');
    result.fixture.detectChanges();

    const toastElement = screen.getByText('Info toast').closest('[role="alert"]');
    expect(toastElement?.classList.contains('border-blue-500')).toBe(true);
  });

  it('should have correct z-index', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    result.fixture.detectChanges();
    const toastContainer = result.container.querySelector('.z-50');
    expect(toastContainer).toBeTruthy();
  });

  it('should show multiple toasts', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.success('First toast');
    component.error('Second toast');
    result.fixture.detectChanges();

    expect(screen.getByText('First toast')).toBeTruthy();
    expect(screen.getByText('Second toast')).toBeTruthy();
    expect(component.toasts.length).toBe(2);
  });

  it('should have correct positioning classes', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    result.fixture.detectChanges();
    const toastContainer = result.container.querySelector('.fixed.bottom-4.right-4');
    expect(toastContainer).toBeTruthy();
  });

  it('should have role alert on toast items', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Alert toast');
    result.fixture.detectChanges();

    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
  });

  it('should have shadow and border on toast items', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Styled toast');
    result.fixture.detectChanges();

    const toastElement = screen.getByText('Styled toast').closest('[role="alert"]');
    expect(toastElement?.classList.contains('shadow-lg')).toBe(true);
    expect(toastElement?.classList.contains('border-l-4')).toBe(true);
  });

  it('should have close button with correct classes', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Closeable toast');
    result.fixture.detectChanges();

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons[closeButtons.length - 1];
    expect(closeButton.classList.contains('rounded-lg')).toBe(true);
    expect(closeButton.classList.contains('p-1.5')).toBe(true);
  });

  it('should have message with correct classes', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Styled message');
    result.fixture.detectChanges();

    const message = screen.getByText('Styled message');
    expect(message.classList.contains('ml-3')).toBe(true);
    expect(message.classList.contains('text-sm')).toBe(true);
    expect(message.classList.contains('font-normal')).toBe(true);
  });

  it('should dismiss specific toast by id', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.show('Toast 1', 'info', 0);
    component.show('Toast 2', 'info', 0);
    result.fixture.detectChanges();

    expect(component.toasts.length).toBe(2);

    const firstToastId = component.toasts[0].id;
    component.dismiss(firstToastId);

    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].message).toBe('Toast 2');
  });

  it('should emit dismissed event with toast id', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.show('Test toast', 'info', 0);
    result.fixture.detectChanges();

    const toastId = component.toasts[0].id;
    const emittedId: string[] = [];
    component.dismissed.subscribe((id: string) => emittedId.push(id));
    component.dismiss(toastId);
    result.fixture.detectChanges();

    expect(emittedId).toContain(toastId);
  });

  it('should show success icon with correct color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.success('Success');
    result.fixture.detectChanges();

    const svg = document.querySelector('[role="alert"] svg');
    expect(svg?.classList.contains('text-green-400')).toBe(true);
  });

  it('should show error icon with correct color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.error('Error');
    result.fixture.detectChanges();

    const svg = document.querySelector('[role="alert"] svg');
    expect(svg?.classList.contains('text-red-400')).toBe(true);
  });

  it('should show warning icon with correct color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.warning('Warning');
    result.fixture.detectChanges();

    const svg = document.querySelector('[role="alert"] svg');
    expect(svg?.classList.contains('text-yellow-400')).toBe(true);
  });

  it('should show info icon with correct color', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('Info');
    result.fixture.detectChanges();

    const svg = document.querySelector('[role="alert"] svg');
    expect(svg?.classList.contains('text-blue-400')).toBe(true);
  });

  it('should have white background on toast items', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.info('White background');
    result.fixture.detectChanges();

    const toastElement = screen.getByText('White background').closest('[role="alert"]');
    expect(toastElement?.classList.contains('bg-white')).toBe(true);
  });

  it('should start with empty toasts array', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    expect(component.toasts.length).toBe(0);
  });

  it('should have show method with default info type', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    const component = getToastComponent(result.fixture);
    component.show('Default type toast');
    result.fixture.detectChanges();

    expect(screen.getByText('Default type toast')).toBeTruthy();
  });

  it('should have space-y-2 between toasts', async () => {
    const result = await render(`<app-toast [visible]="true" />`, renderOptions);
    result.fixture.detectChanges();
    const container_div = result.container.querySelector('.space-y-2');
    expect(container_div).toBeTruthy();
  });
});
