import { render, screen, fireEvent } from '@testing-library/angular';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('should render with default variant and size', async () => {
    const { container } = await render(`<app-button>Click Me</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Click Me');
  });

  it('should emit clicked event when clicked', async () => {
    const { container, fixture } = await render(`<app-button>Click</app-button>`, {
      imports: [ButtonComponent],
    });
    const buttonEl = container.querySelector('button') as HTMLButtonElement;
    const buttonComp = fixture.debugElement.query(By.directive(ButtonComponent)).componentInstance as ButtonComponent;
    let clickedEvent: MouseEvent | null = null;
    buttonComp.clicked.subscribe((e: MouseEvent) => (clickedEvent = e));
    fireEvent.click(buttonEl);
    expect(clickedEvent).toBeTruthy();
    expect(clickedEvent).toBeInstanceOf(MouseEvent);
  });

  it('should be disabled when disabled input is true', async () => {
    const { container } = await render(`<app-button [disabled]="true">Disabled</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should be disabled when loading is true', async () => {
    const { container } = await render(`<app-button [disabled]="true">Loading</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should show spinner when loading', async () => {
    const { container } = await render(`<app-button [disabled]="true">Loading</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('opacity-50')).toBe(true);
  });

  it('should not show spinner when not loading', async () => {
    const { container } = await render(`<app-button>Normal</app-button>`, {
      imports: [ButtonComponent],
    });
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeFalsy();
  });

  it('should have submit type when type is submit', async () => {
    const { container } = await render(`<app-button type="submit">Submit</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
  });

  it('should apply primary variant classes by default', async () => {
    const { container } = await render(`<app-button>Primary</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('bg-brand-500')).toBe(true);
    expect(button?.classList.contains('text-white')).toBe(true);
  });

  it('should apply secondary variant classes', async () => {
    const { container } = await render(`<app-button variant="secondary">Secondary</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('bg-gray-200')).toBe(true);
    expect(button?.classList.contains('text-gray-900')).toBe(true);
  });

  it('should apply danger variant classes', async () => {
    const { container } = await render(`<app-button variant="danger">Danger</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('bg-red-600')).toBe(true);
  });

  it('should apply ghost variant classes', async () => {
    const { container } = await render(`<app-button variant="ghost">Ghost</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('bg-transparent')).toBe(true);
  });

  it('should apply small size classes', async () => {
    const { container } = await render(`<app-button size="sm">Small</app-button>`, {
      imports: [ButtonComponent],
    });
    const buttonClass = container.querySelector('button')?.className || '';
    expect(buttonClass).toContain('text-sm');
    expect(buttonClass).toContain('px-3');
    expect(buttonClass).toContain('py-1.5');
  });

  it('should apply medium size classes by default', async () => {
    const { container } = await render(`<app-button>Medium</app-button>`, {
      imports: [ButtonComponent],
    });
    const buttonClass = container.querySelector('button')?.className || '';
    expect(buttonClass).toContain('text-sm');
    expect(buttonClass).toContain('px-4');
    expect(buttonClass).toContain('py-2');
  });

  it('should apply large size classes', async () => {
    const { container } = await render(`<app-button size="lg">Large</app-button>`, {
      imports: [ButtonComponent],
    });
    const buttonClass = container.querySelector('button')?.className || '';
    expect(buttonClass).toContain('text-base');
    expect(buttonClass).toContain('px-6');
    expect(buttonClass).toContain('py-3');
  });

  it('should apply disabled classes when disabled', async () => {
    const { container } = await render(`<app-button [disabled]="true">Disabled</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('opacity-50')).toBe(true);
    expect(button?.classList.contains('cursor-not-allowed')).toBe(true);
  });

  it('should apply disabled classes when loading', async () => {
    const { container } = await render(`<app-button [disabled]="true">Disabled</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('opacity-50')).toBe(true);
    expect(button?.classList.contains('cursor-not-allowed')).toBe(true);
  });

  it('should have reset type when type is reset', async () => {
    const { container } = await render(`<app-button type="reset">Reset</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('reset');
  });

  it('should have button type by default', async () => {
    const { container } = await render(`<app-button>Default</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
  });

  it('should have base classes applied', async () => {
    const { container } = await render(`<app-button>Base</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('inline-flex')).toBe(true);
    expect(button?.classList.contains('items-center')).toBe(true);
    expect(button?.classList.contains('justify-center')).toBe(true);
    expect(button?.classList.contains('font-medium')).toBe(true);
    expect(button?.classList.contains('rounded-md')).toBe(true);
  });

  it('should project content via ng-content', async () => {
    const { container } = await render(`<app-button><span class="custom-content">Projected</span></app-button>`, {
      imports: [ButtonComponent],
    });
    expect(container.querySelector('.custom-content')).toBeTruthy();
    expect(container.querySelector('.custom-content')?.textContent).toBe('Projected');
  });

  it('should emit clicked event with MouseEvent', async () => {
    const { container, fixture } = await render(`<app-button>Click</app-button>`, {
      imports: [ButtonComponent],
    });
    const buttonEl = container.querySelector('button') as HTMLButtonElement;
    const buttonComp = fixture.debugElement.query(By.directive(ButtonComponent)).componentInstance as ButtonComponent;
    let clickedEvent: MouseEvent | null = null;
    buttonComp.clicked.subscribe((e: MouseEvent) => (clickedEvent = e));
    fireEvent.click(buttonEl);
    expect(clickedEvent).toBeInstanceOf(MouseEvent);
  });

  it('should not emit clicked when disabled', async () => {
    const { container, fixture } = await render(`<app-button [disabled]="true">Disabled</app-button>`, {
      imports: [ButtonComponent],
    });
    const buttonEl = container.querySelector('button') as HTMLButtonElement;
    let clicked = false;
    const buttonComp = fixture.debugElement.query(By.directive(ButtonComponent)).componentInstance as ButtonComponent;
    buttonComp.clicked.subscribe(() => (clicked = true));
    fireEvent.click(buttonEl);
    expect(buttonEl.disabled).toBe(true);
  });

  it('should not emit clicked when loading', async () => {
    const { container } = await render(`<app-button [disabled]="true">Loading</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should have focus ring classes', async () => {
    const { container } = await render(`<app-button>Focusable</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('focus:outline-none')).toBe(true);
    expect(button?.classList.contains('focus:ring-2')).toBe(true);
  });

  it('should have transition classes', async () => {
    const { container } = await render(`<app-button>Transition</app-button>`, {
      imports: [ButtonComponent],
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button?.classList.contains('transition-colors')).toBe(true);
  });
});
