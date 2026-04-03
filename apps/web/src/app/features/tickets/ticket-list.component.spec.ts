import { render, screen, fireEvent } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { TicketListComponent } from './ticket-list.component';
import { TicketService } from '../../core/services/ticket.service';
import { TicketStatus, TicketPriority } from '@pkg/types';

const createMockTicketService = () => ({
  tickets: signal<any[]>([]),
  loading: signal(false),
  error: signal<string | null>(null),
  hasMore: signal(false),
  total: signal(0),
  nextCursor: signal<string | undefined>(undefined),
  currentTicket: signal<any>(null),
  loadTickets: vi.fn(),
  loadTicketById: vi.fn(),
  setCurrentTicket: vi.fn(),
  loadMore: vi.fn(),
  getTicketById: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
});

describe('TicketListComponent', () => {
  let mockTicketService: ReturnType<typeof createMockTicketService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketService = createMockTicketService();
  });

  const renderComponent = (options?: {
    tickets?: any[];
    loading?: boolean;
    error?: string | null;
    hasMore?: boolean;
    total?: number;
  }) => {
    if (options?.tickets) mockTicketService.tickets.set(options.tickets);
    if (options?.loading !== undefined) mockTicketService.loading.set(options.loading);
    if (options?.error !== undefined) mockTicketService.error.set(options.error);
    if (options?.hasMore !== undefined) mockTicketService.hasMore.set(options.hasMore);
    if (options?.total !== undefined) mockTicketService.total.set(options.total);

    return render(TicketListComponent, {
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockTicketService },
      ],
    });
  };

  it('should render the tickets page header', async () => {
    await renderComponent();
    expect(screen.getByText('Tickets')).toBeTruthy();
  });

  it('should have a New Ticket link', async () => {
    await renderComponent();
    const link = screen.getByText('New Ticket');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/tickets/new');
  });

  it('should show loading state', async () => {
    await renderComponent({ loading: true });
    expect(screen.getByText('Loading tickets...')).toBeTruthy();
  });

  it('should show error state', async () => {
    await renderComponent({ error: 'Failed to load tickets' });
    expect(screen.getByText('Failed to load tickets')).toBeTruthy();
  });

  it('should show empty state when no tickets', async () => {
    await renderComponent({ total: 0 });
    expect(screen.getByText('No tickets found')).toBeTruthy();
  });

  it('should render ticket rows when tickets exist', async () => {
    const tickets = [
      {
        id: '1',
        title: 'Test Ticket',
        description: 'Test description',
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        assignee: { id: '1', name: 'John Agent' },
        createdBy: { id: '1', name: 'John Agent' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    await renderComponent({ tickets, total: 1 });
    expect(screen.getByText('Test Ticket')).toBeTruthy();
  });

  it('should show total count', async () => {
    await renderComponent({ total: 42 });
    expect(screen.getByText(/42/)).toBeTruthy();
  });

  it('should have filter inputs', async () => {
    await renderComponent();
    expect(screen.getByPlaceholderText('Search tickets...')).toBeTruthy();
    const statusElements = screen.getAllByText('Status');
    expect(statusElements.length).toBeGreaterThan(0);
    const priorityElements = screen.getAllByText('Priority');
    expect(priorityElements.length).toBeGreaterThan(0);
  });

  it('should have Reset Filters button', async () => {
    await renderComponent();
    expect(screen.getByText('Reset Filters')).toBeTruthy();
  });

  it('should call loadTickets on init', async () => {
    await renderComponent();
    expect(mockTicketService.loadTickets).toHaveBeenCalled();
  });

  it('should call loadMore when Load More is clicked', async () => {
    await renderComponent({ hasMore: true, total: 50 });
    const loadMoreBtn = screen.getByText('Load More');
    fireEvent.click(loadMoreBtn);
    expect(mockTicketService.loadMore).toHaveBeenCalled();
  });

  it('should show pagination when hasMore is true', async () => {
    await renderComponent({ hasMore: true, total: 50 });
    expect(screen.getByText('Load More')).toBeTruthy();
  });

  it('should not show pagination when hasMore is false', async () => {
    await renderComponent({ hasMore: false });
    expect(screen.queryByText('Load More')).toBeFalsy();
  });

  it('should show Unassigned text when no assignee', async () => {
    const tickets = [
      {
        id: '1',
        title: 'Unassigned Ticket',
        description: 'Description',
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        assignee: null,
        createdBy: { id: '1', name: 'User' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    await renderComponent({ tickets, total: 1 });
    expect(screen.getByText('Unassigned')).toBeTruthy();
  });

  it('should display ticket status and priority', async () => {
    const tickets = [
      {
        id: '1',
        title: 'Status Ticket',
        description: 'Description',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.HIGH,
        assignee: { id: '1', name: 'Agent' },
        createdBy: { id: '1', name: 'User' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    await renderComponent({ tickets, total: 1 });
    expect(screen.getByText('IN_PROGRESS')).toBeTruthy();
    expect(screen.getByText('HIGH')).toBeTruthy();
  });

  it('should display assignee name', async () => {
    const tickets = [
      {
        id: '1',
        title: 'Assigned Ticket',
        description: 'Description',
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        assignee: { id: '1', name: 'Jane Agent' },
        createdBy: { id: '1', name: 'User' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    await renderComponent({ tickets, total: 1 });
    expect(screen.getByText('Jane Agent')).toBeTruthy();
  });

  it('should call resetFilters when Reset Filters is clicked', async () => {
    await renderComponent();
    const resetBtn = screen.getByText('Reset Filters');
    fireEvent.click(resetBtn);
    expect(mockTicketService.loadTickets).toHaveBeenCalledWith({});
  });

  it('should show table headers', async () => {
    await renderComponent();
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.trim());
    expect(headerTexts).toContain('Title');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Priority');
    expect(headerTexts).toContain('Assignee');
    expect(headerTexts).toContain('Updated');
  });

  it('should show status filter options', async () => {
    await renderComponent();
    const statusSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((o) => o.value);
    expect(options).toContain('OPEN');
    expect(options).toContain('IN_PROGRESS');
    expect(options).toContain('RESOLVED');
    expect(options).toContain('CLOSED');
  });

  it('should show priority filter options', async () => {
    await renderComponent();
    const prioritySelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    const options = Array.from(prioritySelect.options).map((o) => o.value);
    expect(options).toContain('LOW');
    expect(options).toContain('MEDIUM');
    expect(options).toContain('HIGH');
    expect(options).toContain('CRITICAL');
  });
});
