import { render, screen, fireEvent } from '@testing-library/angular';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

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
  createTicket: vi.fn().mockReturnValue(of({ id: '1', title: 'New Ticket' })),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
});

const createMockAuthService = (isAdmin = false) => ({
  currentUser: signal({ id: '1', name: 'Test User', email: 'test@test.com', roles: [] }),
  isAuthenticated: signal(true),
  isAdmin: vi.fn(() => isAdmin),
  hasRole: vi.fn(() => isAdmin),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  loadUser: vi.fn(),
  refreshToken: vi.fn(),
});

describe('TicketCreateComponent', () => {
  let mockTicketService: ReturnType<typeof createMockTicketService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketService = createMockTicketService();
    mockAuthService = createMockAuthService();
  });

  const renderComponent = async (isAdmin = false) => {
    mockAuthService = createMockAuthService(isAdmin);
    return render(TicketCreateComponent, {
      imports: [InputComponent, ButtonComponent, ErrorMessageComponent],
      providers: [
        provideRouter([{ path: 'tickets/:id', component: TicketCreateComponent }]),
        { provide: TicketService, useValue: mockTicketService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  };

  it('should render the create ticket form header', async () => {
    await renderComponent();
    expect(screen.getByText('Create New Ticket')).toBeTruthy();
  });

  it('should have title input', async () => {
    const { container } = await renderComponent();
    const titleInput = container.querySelector('input[placeholder="Brief summary of the issue"]') as HTMLInputElement;
    expect(titleInput).toBeTruthy();
  });

  it('should have description textarea', async () => {
    const { container } = await renderComponent();
    const descInput = container.querySelector('textarea#description') as HTMLTextAreaElement;
    expect(descInput).toBeTruthy();
  });

  it('should have priority select', async () => {
    const { container } = await renderComponent();
    const prioritySelect = container.querySelector('select#priority') as HTMLSelectElement;
    expect(prioritySelect).toBeTruthy();
  });

  it('should have Cancel button', async () => {
    await renderComponent();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should have Create Ticket button', async () => {
    await renderComponent();
    expect(screen.getByText('Create Ticket')).toBeTruthy();
  });

  it('should show assignee dropdown for admin users', async () => {
    const { container } = await renderComponent(true);
    const assigneeSelect = container.querySelector('select#assignee') as HTMLSelectElement;
    expect(assigneeSelect).toBeTruthy();
  });

  it('should not show assignee dropdown for non-admin users', async () => {
    const { container } = await renderComponent(false);
    const assigneeSelect = container.querySelector('select#assignee');
    expect(assigneeSelect).toBeFalsy();
  });

  it('should have back to tickets link', async () => {
    await renderComponent();
    const link = screen.getByText('Back to Tickets');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/tickets');
  });

  it('should show validation error when title is empty and form submitted', async () => {
    await renderComponent();
    const button = screen.getByText('Create Ticket');
    fireEvent.click(button);
    expect(screen.getByText('Title is required')).toBeTruthy();
  });

  it('should show validation error when description is empty and form submitted', async () => {
    await renderComponent();
    const button = screen.getByText('Create Ticket');
    fireEvent.click(button);
    expect(screen.getByText('Description is required')).toBeTruthy();
  });

  it('should show general error message when fields are empty', async () => {
    await renderComponent();
    const button = screen.getByText('Create Ticket');
    fireEvent.click(button);
    expect(screen.getByText('Please fill in all required fields')).toBeTruthy();
  });

  it('should call createTicket on submit with valid data', async () => {
    const { container } = await renderComponent();
    const titleInput = container.querySelector('input[placeholder="Brief summary of the issue"]') as HTMLInputElement;
    const descInput = container.querySelector('textarea#description') as HTMLTextAreaElement;
    const submitBtn = screen.getByText('Create Ticket');

    fireEvent.input(titleInput, { target: { value: 'Test Title' } });
    fireEvent.input(descInput, { target: { value: 'Test description for the ticket' } });
    fireEvent.click(submitBtn);

    expect(mockTicketService.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        description: 'Test description for the ticket',
        priority: 'MEDIUM',
      })
    );
  });

  it('should show error message when creation fails', async () => {
    mockTicketService.createTicket.mockReturnValue(
      throwError(() => ({ error: { message: 'Creation failed' } }))
    );
    const { container } = await renderComponent();

    const titleInput = container.querySelector('input[placeholder="Brief summary of the issue"]') as HTMLInputElement;
    const descInput = container.querySelector('textarea#description') as HTMLTextAreaElement;
    const submitBtn = screen.getByText('Create Ticket');

    fireEvent.input(titleInput, { target: { value: 'Test Title' } });
    fireEvent.input(descInput, { target: { value: 'Test description for the ticket' } });
    fireEvent.click(submitBtn);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText('Creation failed')).toBeTruthy();
  });

  it('should have description placeholder text', async () => {
    const { container } = await renderComponent();
    const descInput = container.querySelector('textarea#description') as HTMLTextAreaElement;
    expect(descInput.placeholder).toContain('Detailed description');
  });

  it('should have priority options', async () => {
    const { container } = await renderComponent();
    const select = container.querySelector('select#priority') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('LOW');
    expect(options).toContain('MEDIUM');
    expect(options).toContain('HIGH');
    expect(options).toContain('CRITICAL');
  });

  it('should have MEDIUM as default priority', async () => {
    const { container } = await renderComponent();
    const select = container.querySelector('select#priority') as HTMLSelectElement;
    expect(select.value).toBe('MEDIUM');
  });

  it('should show form description text', async () => {
    await renderComponent();
    expect(screen.getByText('Fill in the details below to create a new support ticket')).toBeTruthy();
  });

  it('should show priority hint text', async () => {
    await renderComponent();
    expect(screen.getByText('Default is Medium if not selected')).toBeTruthy();
  });

  it('should include assignee when admin selects one', async () => {
    const { container } = await renderComponent(true);
    const titleInput = container.querySelector('input[placeholder="Brief summary of the issue"]') as HTMLInputElement;
    const descInput = container.querySelector('textarea#description') as HTMLTextAreaElement;
    const assigneeSelect = container.querySelector('select#assignee') as HTMLSelectElement;
    const submitBtn = screen.getByText('Create Ticket');

    fireEvent.input(titleInput, { target: { value: 'Test Title' } });
    fireEvent.input(descInput, { target: { value: 'Test description' } });
    fireEvent.change(assigneeSelect, { target: { value: '1' } });
    fireEvent.click(submitBtn);

    expect(mockTicketService.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeId: '1',
      })
    );
  });

  it('should navigate to /tickets when cancel is clicked', async () => {
    const { fixture } = await renderComponent();
    const router = fixture.debugElement.injector.get(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(navigateSpy).toHaveBeenCalledWith(['/tickets']);
  });

  it('should navigate to ticket detail on successful creation', async () => {
    mockTicketService.createTicket.mockReturnValue(of({ id: '123', title: 'New Ticket' }));
    const { fixture, container } = await renderComponent();
    const router = fixture.debugElement.injector.get(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const titleInput = container.querySelector('input[placeholder="Brief summary of the issue"]') as HTMLInputElement;
    const descInput = container.querySelector('textarea#description') as HTMLTextAreaElement;
    const submitBtn = screen.getByText('Create Ticket');

    fireEvent.input(titleInput, { target: { value: 'Test Title' } });
    fireEvent.input(descInput, { target: { value: 'Test description' } });
    fireEvent.click(submitBtn);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', '123']);
  });
});
