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

const mockTickets = [
  {
    id: '1',
    title: 'Login not working',
    description: 'User cannot log in to the dashboard.',
    status: 'OPEN',
    priority: 'HIGH',
    assignee: { id: '1', name: 'Test Agent' },
    createdBy: { id: '1', name: 'Test Agent' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Payment failed',
    description: 'Customer payment transaction failed.',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    assignee: null,
    createdBy: { id: '2', name: 'Jane Customer' },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockTicketDetail = {
  id: '1',
  title: 'Login not working',
  description: 'User cannot log in to the dashboard.',
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
    content: 'Customer cannot log in since yesterday.',
    role: 'CUSTOMER',
    sender: { id: '2', name: 'Jane Customer' },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    content: 'We are looking into the issue.',
    role: 'AGENT',
    sender: { id: '1', name: 'Test Agent' },
    createdAt: '2024-01-01T01:00:00Z',
  },
];

test.describe('Ticket Flows', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set bypass cookie and token
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'fake-token');
      document.cookie = 'test_bypass=1; path=/';
    });

    // Mock refresh token endpoint (called by interceptor on 401)
    await page.route('**/api/auth/refresh', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-access-token',
        }),
      });
    });

    // Mock user profile
    await page.route('**/api/users/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });
  });

  test.describe('Ticket List', () => {
    test('should display ticket list', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tickets: mockTickets,
            total: 2,
            hasMore: false,
          }),
        });
      });

      await page.goto('/tickets');
      await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
      await expect(page.getByText('Login not working')).toBeVisible();
      await expect(page.getByText('Payment failed')).toBeVisible();
    });

    test('should show New Ticket button', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tickets: [], total: 0, hasMore: false }),
        });
      });

      await page.goto('/tickets');
      await expect(page.getByRole('link', { name: 'New Ticket' })).toBeVisible();
    });

    test('should show filter controls', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tickets: [], total: 0, hasMore: false }),
        });
      });

      await page.goto('/tickets');
      await expect(page.locator('input[placeholder="Search tickets..."]')).toBeVisible();
      await expect(page.locator('label').filter({ hasText: 'Status' })).toBeVisible();
      await expect(page.locator('label').filter({ hasText: 'Priority' })).toBeVisible();
      await expect(page.getByText('Reset Filters')).toBeVisible();
    });

    test('should show empty state when no tickets', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tickets: [], total: 0, hasMore: false }),
        });
      });

      await page.goto('/tickets');
      await expect(page.getByText('No tickets found')).toBeVisible();
    });

    test('should navigate to ticket detail on row click', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        const url = route.request().url();
        if (url.includes('/tickets/1')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockTicketDetail),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ tickets: mockTickets, total: 2, hasMore: false }),
          });
        }
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets');
      await page.getByText('Login not working').click();
      await expect(page).toHaveURL(/.*\/tickets\/1/);
    });

    test('should show ticket status badges', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tickets: mockTickets, total: 2, hasMore: false }),
        });
      });

      await page.goto('/tickets');
      await expect(page.locator('span').filter({ hasText: 'OPEN' })).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'IN_PROGRESS' })).toBeVisible();
    });

    test('should show pagination when more tickets exist', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tickets: mockTickets, total: 50, hasMore: true }),
        });
      });

      await page.goto('/tickets');
      await expect(page.getByText('Load More')).toBeVisible();
    });
  });

  test.describe('Ticket Detail', () => {
    test('should display ticket details', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets/1');
      await expect(page.getByText('Login not working')).toBeVisible();
      await expect(page.getByText('User cannot log in to the dashboard.')).toBeVisible();
      await expect(page.getByText('OPEN')).toBeVisible();
      await expect(page.getByText('HIGH')).toBeVisible();
    });

    test('should display messages', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets/1');
      await expect(page.getByText('Customer cannot log in since yesterday.')).toBeVisible();
      await expect(page.getByText('We are looking into the issue.')).toBeVisible();
    });

    test('should show message input', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets/1');
      await expect(page.locator('textarea[placeholder="Type your message..."]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    });

    test('should send a new message', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      let messageSent = false;
      await page.route('**/api/tickets/*/messages*', (route) => {
        if (route.request().method() === 'POST') {
          messageSent = true;
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '3',
              content: 'Test message',
              role: 'AGENT',
              sender: { id: '1', name: 'Test Agent' },
              createdAt: new Date().toISOString(),
            }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockMessages),
          });
        }
      });

      await page.goto('/tickets/1');
      
      // Wait for ticket detail to load
      await expect(page.getByText('Test Agent').first()).toBeVisible({ timeout: 10000 });
      
      // Wait for the message input to be ready
      const textarea = page.locator('textarea[placeholder="Type your message..."]');
      await expect(textarea).toBeVisible({ timeout: 10000 });
      
      // Use Angular's ng.getComponent to access the component and set currentUserId
      await page.evaluate(() => {
        const el = document.querySelector('app-ticket-detail');
        if (el && (window as any).ng) {
          const component = (window as any).ng.getComponent(el);
          if (component) {
            component.currentUserId = '1';
          }
        }
      });
      
      // Fill the message
      await textarea.fill('Test message');
      
      // Click Send button
      await page.getByRole('button', { name: 'Send' }).click();
      
      // Wait a moment for the API call
      await page.waitForTimeout(1000);
      
      // Check if the message API was called
      expect(messageSent).toBe(true);
    });

    test('should show Back to Tickets link', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets/1');
      const backLink = page.getByText('Back to Tickets');
      await expect(backLink).toBeVisible();
    });

    test('should show AI Assistant section', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets/1');
      await expect(page.getByText('AI Assistant')).toBeVisible();
    });

    test('should show AI action buttons', async ({ page }) => {
      await page.route('**/api/tickets/1*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTicketDetail),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMessages),
        });
      });

      await page.goto('/tickets/1');
      await expect(page.getByText('Summarize')).toBeVisible();
      await expect(page.getByText('Detect Priority')).toBeVisible();
      await expect(page.getByText('Suggest Reply')).toBeVisible();
    });

    test('should show error when ticket not found', async ({ page }) => {
      await page.route('**/api/tickets/999*', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Ticket not found' }),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not found' }),
        });
      });

      await page.goto('/tickets/999');
      await expect(page.getByText('Ticket not found')).toBeVisible();
    });
  });

  test.describe('Create Ticket', () => {
    test('should display create ticket form', async ({ page }) => {
      await page.goto('/tickets/new');
      await expect(page.getByRole('heading', { name: 'Create New Ticket' })).toBeVisible();
      await expect(page.locator('input#title')).toBeVisible();
      await expect(page.locator('textarea#description')).toBeVisible();
      await expect(page.locator('select#priority')).toBeVisible();
      await expect(page.getByText('Cancel')).toBeVisible();
      await expect(page.getByText('Create Ticket')).toBeVisible();
    });

    test('should show validation errors on empty submit', async ({ page }) => {
      await page.goto('/tickets/new');
      await page.getByText('Create Ticket').click();
      await expect(page.getByText('Title is required')).toBeVisible();
    });

    test('should create ticket on valid submit', async ({ page }) => {
      await page.route('**/api/tickets', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '99',
              title: 'E2E Test Ticket',
              description: 'This is a test ticket created by E2E test.',
              status: 'OPEN',
              priority: 'MEDIUM',
              assignee: null,
              createdBy: mockUser,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ tickets: [], total: 0, hasMore: false }),
          });
        }
      });

      await page.route('**/api/tickets/99*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '99',
            title: 'E2E Test Ticket',
            description: 'This is a test ticket created by E2E test.',
            status: 'OPEN',
            priority: 'MEDIUM',
            assignee: null,
            createdBy: mockUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      });

      await page.route('**/api/tickets/*/messages*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/tickets/new');
      await page.locator('input#title').fill('E2E Test Ticket');
      await page.locator('textarea#description').fill('This is a test ticket created by E2E test.');
      await page.getByText('Create Ticket').click();
      await expect(page).toHaveURL(/.*\/tickets\/99/);
    });

    test('should navigate back to ticket list on cancel', async ({ page }) => {
      await page.goto('/tickets/new');
      await page.getByText('Cancel').click();
      await page.waitForURL('**/tickets');
      await expect(page).toHaveURL(/.*\/tickets$/);
    });

    test('should have priority dropdown with options', async ({ page }) => {
      await page.goto('/tickets/new');
      const select = page.locator('#priority');
      await expect(select).toBeVisible();
      // Verify select has options
      const optionCount = await select.locator('option').count();
      expect(optionCount).toBe(4); // LOW, MEDIUM, HIGH, CRITICAL
    });

    test('should have Back to Tickets link', async ({ page }) => {
      await page.route('**/api/tickets*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tickets: [], total: 0, hasMore: false }),
        });
      });

      await page.goto('/tickets/new');
      const backLink = page.getByText('Back to Tickets');
      await expect(backLink).toBeVisible();
      await backLink.click();
      await page.waitForURL('**/tickets');
      await expect(page).toHaveURL(/.*\/tickets$/);
    });
  });
});
