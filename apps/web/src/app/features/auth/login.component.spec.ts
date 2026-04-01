import { render, screen, fireEvent } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

const mockAuthService = {
  login: vi.fn().mockReturnValue(of({ accessToken: 'token' })),
  currentUser: vi.fn(() => null),
  isLoggedIn: vi.fn(() => false),
  isAdmin: vi.fn(() => false),
};

describe('LoginComponent', () => {
  const providers = [
    { provide: AuthService, useValue: mockAuthService },
    provideRouter([]),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.login.mockReturnValue(of({ accessToken: 'token' }));
  });

  it('should render the login form', async () => {
    await render(LoginComponent, { providers });
    expect(screen.getByText('Sign in to TICOAI')).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it('should have a submit button', async () => {
    const { container } = await render(LoginComponent, { providers });
    const button = container.querySelector('button[type="submit"]');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Sign in');
  });

  it('should have a link to register page', async () => {
    await render(LoginComponent, { providers });
    const link = screen.getByText(/don't have an account/i);
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/auth/register');
  });

  it('should show error when error signal is set', async () => {
    mockAuthService.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    const { container } = await render(LoginComponent, { providers });
    
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(button);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

it('should disable submit button when loading', async () => {
    mockAuthService.login.mockReturnValue(of({ accessToken: 'token' }).pipe(delay(1000))); // Delayed observable
    const { container } = await render(LoginComponent, { providers });
    
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(button);
    
    expect(button.disabled).toBe(true);
});

  it('should show validation error for invalid email', async () => {
    const { container } = await render(LoginComponent, { providers });
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    
    fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByText(/please enter a valid email/i)).toBeTruthy();
  });

  it('should show validation error for short password', async () => {
    const { container } = await render(LoginComponent, { providers });
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    
    fireEvent.input(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeTruthy();
  });

  it('should show description text', async () => {
    await render(LoginComponent, { providers });
    expect(screen.getByText('AI-Powered Customer Support Ticket System')).toBeTruthy();
  });
});
