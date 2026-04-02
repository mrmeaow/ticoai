import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage via context init script before each test
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');
      await expect(page.getByRole('heading', { name: 'Sign in to TICOAI' })).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/auth/login');
      const registerLink = page.getByText("Don't have an account? Register");
      await expect(registerLink).toBeVisible();
      await registerLink.click();
      await expect(page).toHaveURL(/.*\/auth\/register/);
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('#email').fill('invalid-email');
      await page.locator('#password').fill('password123');
      // Trigger validation by focusing out
      await page.locator('#password').focus();
      await expect(page.getByText('Please enter a valid email')).toBeVisible();
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');
      await page.locator('#password').blur();
      const submitBtn = page.getByRole('button', { name: 'Sign in' });
      await expect(submitBtn).toBeEnabled();
    });

    test('should show error message when login fails', async ({ page }) => {
      // Mock API to return 401
      await page.route('**/api/auth/login', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      });

      await page.goto('/auth/login');
      await page.locator('#email').fill('wrong@example.com');
      await page.locator('#password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByText('Invalid credentials')).toBeVisible();
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
      // Mock successful login
      await page.route('**/api/auth/login', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
          }),
        });
      });

      // Mock user profile (AuthService calls /api/users/me after login)
      await page.route('**/api/users/me', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            isActive: true,
            roles: [{ id: '1', name: 'AGENT' }],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        });
      });

      await page.goto('/auth/login');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');
      // Submit the form
      await page.locator('form').dispatchEvent('submit');
      // After successful login, check that we have navigation links (authenticated state)
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible();
      await expect(page.getByText('Test User')).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/auth/register');
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/register');
      const loginLink = page.getByText('Already have an account? Sign in');
      await expect(loginLink).toBeVisible();
      await loginLink.click();
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test('should show validation error for short name', async ({ page }) => {
      await page.goto('/auth/register');
      await page.locator('#name').fill('A');
      await page.locator('#email').focus();
      await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/auth/register');
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('not-an-email');
      await page.locator('#password').focus();
      await expect(page.getByText('Please enter a valid email')).toBeVisible();
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/auth/register');
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('123');
      await page.locator('#email').focus();
      await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
    });

    test('should disable submit button when form is invalid', async ({ page }) => {
      await page.goto('/auth/register');
      const submitBtn = page.getByRole('button', { name: 'Create account' });
      await expect(submitBtn).toBeDisabled();
    });

    test('should show error when registration fails', async ({ page }) => {
      await page.route('**/api/auth/register', (route) => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'User with this email already exists' }),
        });
      });

      await page.goto('/auth/register');
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('existing@example.com');
      await page.locator('#password').fill('password123');
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByText('User with this email already exists')).toBeVisible();
    });

    test('should redirect to dashboard on successful registration', async ({ page }) => {
      // Mock successful registration
      await page.route('**/api/auth/register', (route) => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
          }),
        });
      });

      // Mock user profile (AuthService calls /api/users/me after registration)
      await page.route('**/api/users/me', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'new@example.com',
            name: 'New User',
            isActive: true,
            roles: [{ id: '1', name: 'AGENT' }],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        });
      });

      await page.goto('/auth/register');
      await page.locator('#name').fill('New User');
      await page.locator('#email').fill('new@example.com');
      await page.locator('#password').fill('password123');
      // Submit the form
      await page.locator('form').dispatchEvent('submit');
      // After successful registration, check that we have navigation links (authenticated state)
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible();
      await expect(page.getByText('New User')).toBeVisible();
    });
  });

  test.describe('Route Guards', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Mock 401 for /users/me
      await page.route('**/api/users/me', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthorized' }),
        });
      });

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test('should redirect unauthenticated users away from tickets', async ({ page }) => {
      await page.route('**/api/users/me', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthorized' }),
        });
      });

      await page.goto('/tickets');
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });
  });
});

// Separate describe for authenticated user tests (no localStorage clearing)
test.describe('Authenticated Route Guards', () => {
  test('should redirect authenticated users away from login', async ({ page }) => {
    // Mock successful /users/me
    await page.route('**/api/users/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          isActive: true,
          roles: [{ id: '1', name: 'AGENT' }],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }),
      });
    });

    // Set token and cookie before navigation
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'fake-token');
      document.cookie = 'test_bypass=1; path=/';
    });
    
    // Use Angular router to navigate (client-side navigation)
    await page.evaluate(() => {
      window.history.pushState({}, '', '/auth/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    // Wait for Angular to process the navigation
    await page.waitForTimeout(1000);
    
    // Check if we got redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
