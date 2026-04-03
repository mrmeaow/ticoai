import { test, expect } from '@playwright/test';

const mockUser = {
  id: '1',
  email: 'agent@example.com',
  name: 'Test Agent',
  isActive: true,
  roles: [{ id: '1', name: 'AGENT' }],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTicket = {
  id: '1',
  title: 'Test Ticket for AI',
  description: 'A test ticket for AI features.',
  status: 'OPEN',
  priority: 'HIGH',
  assignee: { id: '1', name: 'Test Agent' },
  createdBy: { id: '1', name: 'Test Agent' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockMessages = [
  {
    id: '1',
    content: 'Customer reports login issue.',
    role: 'CUSTOMER',
    sender: { id: '2', name: 'Customer' },
    createdAt: '2024-01-01T00:00:00Z',
  },
];

test.describe('AI Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set auth token and bypass cookie
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'fake-token');
      document.cookie = 'test_bypass=1; path=/';
    });

    // Mock refresh token endpoint
    await page.route('**/api/auth/refresh', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'fake-access-token' }),
      });
    });

    // Mock users/me endpoint (what AuthService calls)
    await page.route('**/api/users/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    // Mock ticket detail
    await page.route('**/api/tickets/1*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTicket),
      });
    });

    // Mock messages
    await page.route('**/api/tickets/*/messages*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMessages),
      });
    });
  });

  test('should show AI panel on ticket detail page', async ({ page }) => {
    await page.goto('/tickets/1');
    await expect(page.getByText('AI Assistant')).toBeVisible();
    await expect(page.getByText('Powered by LM Studio')).toBeVisible();
  });

  test('should have three AI action buttons', async ({ page }) => {
    await page.goto('/tickets/1');
    await expect(page.getByText('Summarize')).toBeVisible();
    await expect(page.getByText('Detect Priority')).toBeVisible();
    await expect(page.getByText('Suggest Reply')).toBeVisible();
  });

  test('should call summarize API when Summarize button is clicked', async ({ page }) => {
    let summarizeCalled = false;
    await page.route('**/api/ai/summarize', (route) => {
      summarizeCalled = true;
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-1', resultId: 'result-1' }),
      });
    });

    await page.goto('/tickets/1');
    await page.getByText('Summarize').click();
    expect(summarizeCalled).toBe(true);
  });

  test('should call detect-priority API when Detect Priority button is clicked', async ({ page }) => {
    let detectCalled = false;
    await page.route('**/api/ai/detect-priority', (route) => {
      detectCalled = true;
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-2', resultId: 'result-2' }),
      });
    });

    await page.goto('/tickets/1');
    await page.getByText('Detect Priority').click();
    expect(detectCalled).toBe(true);
  });

  test('should call suggest-reply API when Suggest Reply button is clicked', async ({ page }) => {
    let suggestCalled = false;
    await page.route('**/api/ai/suggest-reply', (route) => {
      suggestCalled = true;
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-3', resultId: 'result-3' }),
      });
    });

    await page.goto('/tickets/1');
    await page.getByText('Suggest Reply').click();
    expect(suggestCalled).toBe(true);
  });

  test('should show processing state after clicking an AI action', async ({ page }) => {
    await page.route('**/api/ai/summarize', (route) => {
      // Return job ID but don't resolve immediately
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-1', resultId: 'result-1' }),
      });
    });

    await page.goto('/tickets/1');
    await page.getByText('Summarize').click();
    // After clicking, the action should show processing state
    await expect(page.getByText('Processing your request...')).toBeVisible({ timeout: 5000 });
  });


});