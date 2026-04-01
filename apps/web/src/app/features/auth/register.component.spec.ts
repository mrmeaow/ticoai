import { render, screen, fireEvent } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

const mockAuthService = {
  register: vi.fn().mockReturnValue(of({ accessToken: 'token' })),
  currentUser: vi.fn(() => null),
  isLoggedIn: vi.fn(() => false),
  isAdmin: vi.fn(() => false),
};

describe('RegisterComponent', () => {
  const providers = [
    { provide: AuthService, useValue: mockAuthService },
    provideRouter([]),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.register.mockReturnValue(of({ accessToken: 'token' }));
  });

  it('should render the registration form', async () => {
    await render(RegisterComponent, { providers });
    expect(screen.getByText('Create your account')).toBeTruthy();
    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it('should have a submit button with correct text', async () => {
    const { container } = await render(RegisterComponent, { providers });
    const button = container.querySelector('button[type="submit"]');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Create account');
  });

  it('should have a link to login page', async () => {
    await render(RegisterComponent, { providers });
    const link = screen.getByText(/already have an account/i);
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/auth/login');
  });

  it('should show description text', async () => {
    await render(RegisterComponent, { providers });
    expect(screen.getByText('Join TICOAI support system')).toBeTruthy();
  });

  it('should disable submit button when form is invalid', async () => {
    const { container, fixture } = await render(RegisterComponent, { providers });
    await fixture.whenStable();
    fixture.detectChanges();
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should show validation error for short name', async () => {
    const { fixture } = await render(RegisterComponent, { providers });
    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;

    fireEvent.input(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByText('Name must be at least 2 characters')).toBeTruthy();
  });

  it('should show validation error for invalid email', async () => {
    const { fixture } = await render(RegisterComponent, { providers });
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    fireEvent.input(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByText('Please enter a valid email')).toBeTruthy();
  });

  it('should show validation error for short password', async () => {
    const { fixture } = await render(RegisterComponent, { providers });
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.input(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('should show error when registration fails', async () => {
    mockAuthService.register.mockReturnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
    const { container, fixture } = await render(RegisterComponent, { providers });

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(button);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByText('Email already exists')).toBeTruthy();
  });

it('should disable submit button when loading', async () => {
    mockAuthService.register.mockReturnValue(of({ accessToken: 'token' }).pipe(delay(1000))); // Delayed observable
    const { container } = await render(RegisterComponent, { providers });
    
    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(button);
    
    expect(button.disabled).toBe(true);
});

  it('should have password input of type password', async () => {
    await render(RegisterComponent, { providers });
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('should have email input of type email', async () => {
    await render(RegisterComponent, { providers });
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.type).toBe('email');
  });
});
