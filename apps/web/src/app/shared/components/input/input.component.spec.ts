import { render, screen, fireEvent } from '@testing-library/angular';
import { By } from '@angular/platform-browser';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  it('should render with label', async () => {
    const { container } = await render(`<app-input label="Email" />`, {
      imports: [InputComponent],
    });
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('should show required asterisk when required is true', async () => {
    const { container } = await render(`<app-input label="Email" [required]="true" />`, {
      imports: [InputComponent],
    });
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk).toBeTruthy();
    expect(asterisk?.textContent).toBe('*');
  });

  it('should not show asterisk when required is false', async () => {
    const { container } = await render(`<app-input label="Email" [required]="false" />`, {
      imports: [InputComponent],
    });
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk).toBeFalsy();
  });

  it('should show error message when error is set', async () => {
    const { container } = await render(`<app-input [error]="'This field is required'" />`, {
      imports: [InputComponent],
    });
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('should show hint when hint is set', async () => {
    const { container } = await render(`<app-input hint="Enter your email address" />`, {
      imports: [InputComponent],
    });
    expect(screen.getByText('Enter your email address')).toBeTruthy();
  });

  it('should have placeholder', async () => {
    const { container } = await render(`<app-input placeholder="Enter text..." />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.placeholder).toBe('Enter text...');
  });

  it('should be disabled when disabled is true', async () => {
    const { container } = await render(`<app-input [disabled]="true" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should have correct type', async () => {
    const { container } = await render(`<app-input type="email" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('should emit valueChange when input changes', async () => {
    const { container, fixture } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const inputComp = fixture.debugElement.query(By.css('app-input')).componentInstance;
    let emittedValue: string | null = null;
    inputComp.valueChange.subscribe((v: string) => (emittedValue = v));
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'test value' } });
    expect(emittedValue).toBe('test value');
  });

  it('should apply error styling when error is set', async () => {
    const { container } = await render(`<app-input [error]="'Invalid input'" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.classList.contains('border-red-300')).toBe(true);
  });

  it('should have text type by default', async () => {
    const { container } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('text');
  });

  it('should render without label when label is empty', async () => {
    const { container } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const label = container.querySelector('label');
    expect(label).toBeFalsy();
  });

  it('should not show error message when error is empty', async () => {
    const { container } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const errorElement = container.querySelector('p.text-red-600');
    expect(errorElement).toBeFalsy();
  });

  it('should not show hint when hint is empty', async () => {
    const { container } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const hintElement = container.querySelector('p.text-gray-500');
    expect(hintElement).toBeFalsy();
  });

  it('should apply disabled styling when disabled', async () => {
    const { container } = await render(`<app-input [disabled]="true" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.classList.contains('disabled:bg-gray-100')).toBe(true);
    expect(input.classList.contains('disabled:cursor-not-allowed')).toBe(true);
  });

  it('should bind value with ngModel', async () => {
    const { container } = await render(`<app-input [value]="'initial value'" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('initial value');
  });

  it('should have correct base input classes', async () => {
    const { container } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.classList.contains('w-full')).toBe(true);
    expect(input.classList.contains('px-3')).toBe(true);
    expect(input.classList.contains('py-2')).toBe(true);
    expect(input.classList.contains('border')).toBe(true);
    expect(input.classList.contains('border-gray-300')).toBe(true);
    expect(input.classList.contains('rounded-md')).toBe(true);
  });

  it('should have label with correct classes', async () => {
    const { container } = await render(`<app-input label="Username" />`, {
      imports: [InputComponent],
    });
    const label = container.querySelector('label');
    expect(label?.classList.contains('block')).toBe(true);
    expect(label?.classList.contains('text-sm')).toBe(true);
    expect(label?.classList.contains('font-medium')).toBe(true);
    expect(label?.classList.contains('text-gray-700')).toBe(true);
  });

  it('should have error message with correct classes', async () => {
    const { container } = await render(`<app-input [error]="'Required'" />`, {
      imports: [InputComponent],
    });
    const error = container.querySelector('p');
    expect(error?.classList.contains('mt-1')).toBe(true);
    expect(error?.classList.contains('text-sm')).toBe(true);
    expect(error?.classList.contains('text-red-600')).toBe(true);
  });

  it('should have hint message with correct classes', async () => {
    const { container } = await render(`<app-input hint="Help text" />`, {
      imports: [InputComponent],
    });
    const hint = container.querySelector('p.text-gray-500');
    expect(hint?.classList.contains('mt-1')).toBe(true);
    expect(hint?.classList.contains('text-sm')).toBe(true);
  });

  it('should support password type', async () => {
    const { container } = await render(`<app-input type="password" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('should support number type', async () => {
    const { container } = await render(`<app-input type="number" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('number');
  });

  it('should support tel type', async () => {
    const { container } = await render(`<app-input type="tel" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('tel');
  });

  it('should support url type', async () => {
    const { container } = await render(`<app-input type="url" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('url');
  });

  it('should show both error and hint when both are set', async () => {
    const { container } = await render(`<app-input [error]="'Invalid'" hint="Enter a valid value" />`, {
      imports: [InputComponent],
    });
    expect(screen.getByText('Invalid')).toBeTruthy();
    expect(screen.getByText('Enter a valid value')).toBeTruthy();
  });

  it('should have wrapper div with w-full class', async () => {
    const { container } = await render(`<app-input />`, {
      imports: [InputComponent],
    });
    const wrapper = container.querySelector('div.w-full');
    expect(wrapper).toBeTruthy();
  });

  it('should update value on input', async () => {
    const { container, fixture } = await render(`<app-input [value]="'initial'" />`, {
      imports: [InputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'updated' } });
    fixture.detectChanges();
    expect(input.value).toBe('updated');
  });
});
