import { render, screen, fireEvent } from '@testing-library/angular';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '../../core/services/ticket.service';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { AiService } from '../../core/services/ai.service';
import { AiPanelComponent } from '../../shared/components/ai-panel/ai-panel.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { TicketStatus, TicketPriority } from '@pkg/types';

const mockTicket = {
  id: '1',
  title: 'Test Ticket',
  description: 'This is a test ticket description.',
  status: TicketStatus.OPEN,
  priority: TicketPriority.HIGH,
  assignee: { id: '1', name: 'John Agent', email: 'john@test.com', roles: [] },
  createdBy: { id: '2', name: 'Jane Customer', email: 'jane@test.com', roles: [] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockMessages = [
  {
    id: '1',
    ticketId: '1',
    content: 'Hello, I need help.',
    role: 'CUSTOMER' as const,
    isAi: false,
    sender: { id: '2', name: 'Jane Customer' },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    ticketId: '1',
    content: 'How can I help you?',
    role: 'AGENT' as const,
    isAi: false,
    sender: { id: '1', name: 'John Agent' },
    createdAt: '2024-01-01T01:00:00Z',
  },
];

const createMockTicketService = () => ({
  tickets: signal<any[]>([]),
  loading: signal(false),
  error: signal<string | null>(null),
  hasMore: signal(false),
  total: signal(0),
  nextCursor: signal<string | undefined>(undefined),
  currentTicket: signal(mockTicket),
  loadTickets: vi.fn(),
  loadTicketById: vi.fn(),
  setCurrentTicket: vi.fn(),
  loadMore: vi.fn(),
  getTicketById: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
});

const createMockMessageService = () => ({
  messages: signal(mockMessages),
  loading: signal(false),
  error: signal<string | null>(null),
  loadMessages: vi.fn(),
  createMessage: vi.fn().mockReturnValue(of({ id: '3', content: 'New message', role: 'AGENT' })),
  deleteMessage: vi.fn().mockReturnValue(of(undefined)),
  addMessage: vi.fn(),
  clearMessages: vi.fn(),
});

const createMockAuthService = () => ({
    currentUser: signal({ id: '1', name: 'John Agent', email: 'john@test.com', roles: [] }),
    isAuthenticated: signal(true),
    isAdmin: vi.fn(() => false),
    hasRole: vi.fn(() => true),
    login: vi.fn().mockReturnValue(of({ accessToken: 'token' })),
    register: vi.fn().mockReturnValue(of({ accessToken: 'token' })),
    logout: vi.fn(),
    loadUser: vi.fn(),
    refreshToken: vi.fn(),
});

const createMockAiService = () => ({
  summarize: vi.fn().mockReturnValue(of({ jobId: 'job-1', resultId: 'result-1' })),
  detectPriority: vi.fn().mockReturnValue(of({ jobId: 'job-2', resultId: 'result-2' })),
  suggestReply: vi.fn().mockReturnValue(of({ jobId: 'job-3', resultId: 'result-3' })),
  subscribeToJob: vi.fn().mockReturnValue(of({ status: 'completed', result: 'Done' })),
  unsubscribeFromJob: vi.fn(),
  cleanup: vi.fn(),
});

const createMockActivatedRoute = () => ({
  snapshot: {
    paramMap: {
      get: vi.fn(() => '1'),
      has: vi.fn(() => true),
      getAll: vi.fn(() => []),
      keys: ['id'],
    },
    queryParamMap: {
      get: vi.fn(() => null),
      has: vi.fn(() => false),
      getAll: vi.fn(() => []),
      keys: [],
    },
    params: { id: '1' },
    queryParams: {},
    data: {},
    url: [],
    outlet: 'primary',
    component: null,
    routeConfig: null,
    title: undefined,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
  },
  params: of({ id: '1' }),
  queryParams: of({}),
  data: of({}),
  url: of([]),
  outlet: 'primary',
  component: null,
  routeConfig: null,
  title: of(undefined),
  parent: null,
  firstChild: null,
  children: [],
  pathFromRoot: [],
  fragment: of(null),
});

describe('TicketDetailComponent', () => {
  let mockTicketService: ReturnType<typeof createMockTicketService>;
  let mockMessageService: ReturnType<typeof createMockMessageService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockAiService: ReturnType<typeof createMockAiService>;
  let querySelectorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.clearAllMocks();
      mockTicketService = createMockTicketService();
      mockMessageService = createMockMessageService();
      mockAuthService = createMockAuthService();
      mockAiService = createMockAiService();
      const originalQuerySelector = document.querySelector.bind(document);
      querySelectorSpy = vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === 'app-ai-panel') {
          // Return a mock element that matches what the test expects
          const mockElement = {
            updateResult: vi.fn(),
            // Add other properties/methods that might be accessed
            querySelector: vi.fn(),
            querySelectorAll: vi.fn(),
            getAttribute: vi.fn(),
            setAttribute: vi.fn(),
            classList: {
              add: vi.fn(),
              remove: vi.fn(),
              contains: vi.fn()
            },
            style: {},
            innerHTML: '',
            textContent: '',
            appendChild: vi.fn(),
            removeChild: vi.fn()
          };
          return mockElement as any;
        }
        // Call the original for everything else
        return originalQuerySelector(selector);
      });
    });

  afterEach(() => {
    querySelectorSpy.mockRestore();
  });

  const renderComponent = () => {
    return render(TicketDetailComponent, {
      imports: [AiPanelComponent, ButtonComponent, BadgeComponent, SpinnerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: TicketService, useValue: mockTicketService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AiService, useValue: mockAiService },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });
  };

  it('should render ticket title', async () => {
    await renderComponent();
    expect(screen.getByText('Test Ticket')).toBeTruthy();
  });

  it('should render ticket description', async () => {
    await renderComponent();
    expect(screen.getByText('This is a test ticket description.')).toBeTruthy();
  });

  it('should show ticket status', async () => {
    await renderComponent();
    expect(screen.getByText('OPEN')).toBeTruthy();
  });

  it('should show ticket priority', async () => {
    await renderComponent();
    expect(screen.getByText('HIGH')).toBeTruthy();
  });

  it('should show assignee name', async () => {
    await renderComponent();
    expect(screen.getByText(/Assignee:/)).toBeTruthy();
  });

  it('should show Description section header', async () => {
    await renderComponent();
    expect(screen.getByText('Description')).toBeTruthy();
  });

  it('should show Conversation section header', async () => {
    await renderComponent();
    expect(screen.getByText('Conversation')).toBeTruthy();
  });

  it('should render messages', async () => {
    await renderComponent();
    expect(screen.getByText('Hello, I need help.')).toBeTruthy();
    expect(screen.getByText('How can I help you?')).toBeTruthy();
  });

  it('should show message senders', async () => {
    await renderComponent();
    const janeElements = screen.getAllByText('Jane Customer');
    expect(janeElements.length).toBeGreaterThan(0);
    const johnElements = screen.getAllByText('John Agent');
    expect(johnElements.length).toBeGreaterThan(0);
  });

  it('should have message input textarea', async () => {
    await renderComponent();
    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
  });

  it('should have Send button', async () => {
    await renderComponent();
    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons.find((b) => b.textContent?.includes('Send'));
    expect(sendBtn).toBeTruthy();
  });

  it('should have Back to Tickets link', async () => {
    await renderComponent();
    const link = screen.getByText('Back to Tickets');
    expect(link).toBeTruthy();
  });

  it('should show loading state', async () => {
    mockTicketService.loading.set(true);
    await renderComponent();
    expect(screen.getByText('Loading ticket...')).toBeTruthy();
  });

  it('should show error state from ticket service', async () => {
    mockTicketService.error.set('Ticket not found');
    await renderComponent();
    const errorElements = screen.getAllByText('Ticket not found');
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('should show AI Assistant section', async () => {
    await renderComponent();
    expect(screen.getByText('AI Assistant')).toBeTruthy();
  });

  it('should have Summarize button', async () => {
    await renderComponent();
    expect(screen.getByText('Summarize')).toBeTruthy();
  });

  it('should have Detect Priority button', async () => {
    await renderComponent();
    expect(screen.getByText('Detect Priority')).toBeTruthy();
  });

  it('should have Suggest Reply button', async () => {
    await renderComponent();
    expect(screen.getByText('Suggest Reply')).toBeTruthy();
  });

  it('should show LM Studio attribution', async () => {
    await renderComponent();
    expect(screen.getByText('Powered by LM Studio')).toBeTruthy();
  });

  it('should call summarize AI action when button is clicked', async () => {
    await renderComponent();
    const summarizeBtn = screen.getByText('Summarize');
    fireEvent.click(summarizeBtn);
    expect(mockAiService.summarize).toHaveBeenCalledWith('1');
  });

  it('should call detectPriority AI action when button is clicked', async () => {
    await renderComponent();
    const detectBtn = screen.getByText('Detect Priority');
    fireEvent.click(detectBtn);
    expect(mockAiService.detectPriority).toHaveBeenCalledWith('1');
  });

  it('should call suggestReply AI action when button is clicked', async () => {
    await renderComponent();
    const suggestBtn = screen.getByText('Suggest Reply');
    fireEvent.click(suggestBtn);
    expect(mockAiService.suggestReply).toHaveBeenCalledWith('1');
  });

  it('should call loadTicketById on init', async () => {
    await renderComponent();
    expect(mockTicketService.loadTicketById).toHaveBeenCalledWith('1');
  });

  it('should call loadMessages on init', async () => {
    await renderComponent();
    expect(mockMessageService.loadMessages).toHaveBeenCalledWith('1');
  });

  it('should show message initials for senders', async () => {
    await renderComponent();
    expect(screen.getByText('JC')).toBeTruthy();
  });

  it('should show Created label', async () => {
    await renderComponent();
    expect(screen.getByText(/Created:/)).toBeTruthy();
  });

  it('should show Updated label', async () => {
    await renderComponent();
    expect(screen.getByText(/Updated:/)).toBeTruthy();
  });

  it('should show Assignee label', async () => {
    await renderComponent();
    expect(screen.getByText(/Assignee:/)).toBeTruthy();
  });

  it('should show empty state when no messages', async () => {
    mockMessageService.messages.set([]);
    await renderComponent();
    expect(screen.getByText('No messages yet. Start the conversation!')).toBeTruthy();
  });
});