# PHASE 3 - Tests and QA & iteration loops on demand

**Milestone:** `PHASE 3 - Tests and QA & iteration loops on demand` (GitHub Milestone #3)
**Due Date:** March 31, 2026
**Status:** PENDING (0 issues, 0% complete)

---

## Overview (from GitHub Milestone)

**SQA / QA focused phase - the most important and final stage readiness burden**

### Key Requirements (from Milestone Description)

- ✅ **API First approach** - APIs must be 100% ready and behaving as expected
- ✅ **SDK & Orval mocks** - SDK generation and mocks readiness for front-end tests
- ✅ **Angular testing** - Vitest ONLY (NO Jest, Jasmine, or Karma)
- ✅ **API testing** - Native NestJS testing following https://docs.nestjs.com/fundamentals/testing
- ✅ **Iteration loops** - Fixes, refactors, updates for errors, critical-bugs, API improbabilities

---

## Angular 21 Testing Strategy (Updated per Official Docs)

### Key Changes from Angular 21

1. **Vitest is Default** - New Angular 21+ projects use Vitest by default (not Karma/Jasmine)
2. **Zoneless by Default** - No Zone.js dependency, change detection on explicit triggers only
3. **Signals-First** - All state management uses Signals, testing must account for signal reactivity
4. **jsdom Default** - Tests run in jsdom environment (can swap for happy-dom)
5. **Browser Mode Optional** - Real browser testing via Playwright/WebdriverIO for browser-specific APIs

### Testing Configuration (Angular 21 Way)

```typescript
// angular.json - test target
{
  "projects": {
    "web": {
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "include": ["**/*.spec.ts"],
            "setupFiles": ["src/test-setup.ts"],
            "providersFile": "src/test-providers.ts",
            "coverage": true
          }
        }
      }
    }
  }
}
```

```typescript
// src/test-providers.ts - Global test providers
import { Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const testProviders: Provider[] = [
  provideHttpClient(),
  provideHttpClientTesting()
];
export default testProviders;
```

```typescript
// vitest-base.config.ts (optional advanced config)
import { defineConfig } from 'vitest/config';
import { angular } from '@angular/build';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test-setup.ts'],
    },
  },
});
```

### Testing Signals and Zoneless Apps

**Key Considerations:**
- Change detection triggers: async pipe, user events, signal updates, `markForCheck()`
- Use `OnPush` change detection for best performance
- Signals auto-trigger detection when read in template
- No need for `fakeAsync` or `tick()` for signal-based tests

**Example: Testing Component with Signals**

```typescript
// ticket-list.component.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { TicketListComponent } from './ticket-list.component';
import { TicketService } from '../../core/services/ticket.service';
import { signal } from '@angular/core';

describe('TicketListComponent (Zoneless + Signals)', () => {
  const mockTicketService = {
    tickets: signal([
      { id: '1', title: 'Test Ticket', status: 'OPEN', priority: 'HIGH' }
    ]),
    loading: signal(false),
    loadTickets: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ticket list from signal', async () => {
    await render(TicketListComponent, {
      providers: [{ provide: TicketService, useValue: mockTicketService }],
    });

    // Signal-based components auto-update, no need for fixture.detectChanges()
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
  });

  it('should call loadTickets on filter change', async () => {
    const { fixture } = await render(TicketListComponent, {
      providers: [{ provide: TicketService, useValue: mockTicketService }],
    });

    const filterInput = screen.getByPlaceholderText('Search tickets...');
    await fireEvent.input(filterInput, { target: { value: 'test' } });

    // Zoneless: signal changes trigger detection automatically
    expect(mockTicketService.loadTickets).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'test' })
    );
  });
});
```

### HTTP Testing with HttpClientTesting

```typescript
// src/test-providers.ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

export default [
  provideHttpClient(withInterceptorsFromDi()),
  provideHttpClientTesting(),
];
```

```typescript
// auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService (HTTP Testing)', () => {
  let httpMock: HttpTestingController;
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should login and return token', () => {
    const mockResponse = { data: { accessToken: 'fake-token' } };

    service.login({ email: 'test@example.com', password: 'pass123' }).subscribe({
      next: (response) => expect(response.data.accessToken).toBe('fake-token'),
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

### Playwright for E2E (Separate from Unit Tests)

**Note:** Angular 21 uses Vitest for unit tests. Playwright is ONLY for E2E testing in a separate test suite.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

```typescript
// e2e/auth.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'admin@ticoai.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});
```

---

## Planned Issues

### Critical API-First Task (MUST BE FIRST)

**Issue #28 is the foundation for API-First development. This MUST be completed before any testing issues.**

#### Issue #28: Enhance OpenAPI Documentation for All DTOs

**Description:**
Add comprehensive OpenAPI/Swagger documentation to all DTOs, entities, and endpoints. This is the foundation for API-First development and SDK generation.

**Required Changes:**

1. **DTOs - Add @ApiProperty with full details:**
   - `description` - Clear field description
   - `example` - Realistic example value
   - `required` - Mark required fields
   - `format` - For dates, emails, etc.

2. **Entities - Add @ApiExcludeProperty for sensitive fields:**
   - Exclude `passwordHash` from all responses
   - Exclude internal fields like `createdAt`, `updatedAt` if not needed

3. **Controllers - Add @ApiResponse for all status codes:**
   - 200 - Success with response schema
   - 201 - Created with response schema
   - 400 - Bad Request with error schema
   - 401 - Unauthorized with error schema
   - 403 - Forbidden with error schema
   - 404 - Not Found with error schema
   - 500 - Internal Server Error with error schema

4. **Add @ApiSummary and @ApiDescription to all endpoints**

5. **Create Response DTOs for all endpoints** (never return entity directly)

**Example Implementation:**

```typescript
// DTO: create-ticket.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Ticket title (max 200 characters)',
    example: 'Unable to login to customer portal',
    minLength: 1,
    maxLength: 200,
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Customer reports being unable to access the dashboard after successful login.',
    minLength: 10,
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    example: 'HIGH',
  })
  priority?: string;

  @ApiPropertyOptional({
    description: 'Assignee user ID (admin only)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  assigneeId?: string;
}
```

```typescript
// Response DTO: ticket-response.dto.ts
import { ApiProperty, pickType } from '@nestjs/swagger';
import { Ticket } from '../entities/ticket.entity';
import { Exclude } from 'class-transformer';

export class TicketResponseDto {
  @ApiProperty({ description: 'Ticket unique identifier', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Ticket title' })
  title: string;

  @ApiProperty({ description: 'Ticket description' })
  description: string;

  @ApiProperty({ 
    description: 'Current status',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  })
  status: string;

  @ApiProperty({ 
    description: 'Priority level',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  priority: string;

  @ApiProperty({ 
    description: 'Assignee information',
    type: () => UserSummaryDto,
    nullable: true,
  })
  assignee?: UserSummaryDto;

  @ApiProperty({ description: 'Created at timestamp', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated timestamp', format: 'date-time' })
  updatedAt: Date;
}

// Error response DTO
export class ErrorResponseDto {
  @ApiProperty({ description: 'Error status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Error type', example: 'Bad Request' })
  error: string;

  @ApiProperty({ description: 'Detailed error message', example: 'Title is required' })
  message: string | string[];

  @ApiProperty({ description: 'Timestamp', format: 'date-time' })
  timestamp: string;
}
```

```typescript
// Controller: tickets.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSummary,
  ApiDescription,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Tickets')
@Controller('tickets')
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiDescription('Creates a new support ticket. Agents and Admins can create tickets.')
  @ApiResponse({
    status: 201,
    description: 'Ticket created successfully',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
    examples: {
      badRequest: {
        summary: 'Validation Error',
        value: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title is required', 'description must be at least 10 characters'],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tickets' })
  @ApiDescription('Returns paginated list of tickets with optional filters')
  @ApiResponse({
    status: 200,
    description: 'List of tickets',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TicketResponseDto' },
        },
        total: { type: 'number', example: 100 },
        hasMore: { type: 'boolean', example: true },
        nextCursor: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiDescription('Retrieves a single ticket by its unique identifier')
  @ApiResponse({
    status: 200,
    description: 'Ticket found',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
    examples: {
      notFound: {
        summary: 'Ticket Not Found',
        value: {
          statusCode: 404,
          error: 'Not Found',
          message: 'Ticket with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }
}
```

```typescript
// Entity: ticket.entity.ts
import { Entity, Column, ManyToOne } from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Ticket unique identifier', format: 'uuid' })
  id: string;

  @Column()
  @ApiProperty({ description: 'Ticket title' })
  title: string;

  @Column('text')
  @ApiProperty({ description: 'Ticket description' })
  description: string;

  @Column({ default: 'OPEN' })
  @ApiProperty({ 
    description: 'Current status',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  })
  status: string;

  @Column({ default: 'MEDIUM' })
  @ApiProperty({ 
    description: 'Priority level',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  priority: string;

  @ManyToOne(() => User, { eager: true })
  @ApiProperty({ description: 'Assigned user', type: () => UserSummaryDto, nullable: true })
  assignee?: User;

  @CreateDateColumn()
  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiHideProperty()
  @Exclude()
  deletedAt?: Date;
}
```

```typescript
// Entity: user.entity.ts (Example for password exclusion)
import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'User unique identifier', format: 'uuid' })
  id: string;

  @Column()
  @ApiProperty({ description: 'User full name' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'User email address', format: 'email' })
  email: string;

  @Column({ name: 'password_hash' })
  @ApiHideProperty()
  @Exclude()  // NEVER expose password hash in responses
  passwordHash: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  updatedAt: Date;
}
```

**Checklist for Issue #28:**

- [ ] Add @ApiProperty to all DTO fields with description, example, format
- [ ] Add @Exclude() from class-transformer to sensitive entity fields (passwordHash, etc.)
- [ ] Add @ApiHideProperty to hide fields from OpenAPI spec (for @Exclude() fields)
- [ ] Add @ApiResponse decorators for all HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [ ] Create Response DTOs for all endpoints (never return entity directly)
- [ ] Create ErrorResponseDto and use in all @ApiResponse decorators
- [ ] Add @ApiSummary and @ApiDescription to all controller methods
- [ ] Add examples for error responses (400, 404, etc.)
- [ ] Verify OpenAPI spec at /api/docs shows complete documentation
- [ ] Run `pnpm sdk:gen` to verify SDK generation works with new docs
- [ ] Update all modules: Auth, Users, Tickets, Messages, AI, Dashboard, Roles

---

## Planned Issues (Ordered by Dependencies)

**Issues are ordered based on development dependencies. Complete issues in order for optimal workflow.**

### Stage 1: API-First Foundation (MUST BE FIRST)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 28 | [API] Enhance OpenAPI Documentation for All DTOs | Add @ApiProperty, @Exclude, @ApiResponse, examples, summaries for all endpoints and DTOs. **Foundation for SDK generation.** | **CRITICAL** | `Ticket`, `backend`, `api-first`, `high-priority`, `documentation` |

### Stage 2: SDK Generation & Test Infrastructure (Depends on #28)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 29 | [WEB] Setup Orval Mock Generation | Enable Orval mock generation from OpenAPI spec for API isolation in tests | **CRITICAL** | `Ticket`, `frontend`, `testing`, `sdk`, `api-first`, `high-priority` |
| 30 | [API] Setup Vitest Configuration | Configure Vitest for unit and integration tests with proper tsconfig | High | `Ticket`, `backend`, `testing`, `high-priority` |
| 31 | [WEB] Setup Vitest for Angular 21 | Configure Vitest with jsdom for Angular 21 zoneless + signals testing | High | `Ticket`, `frontend`, `testing`, `high-priority` |
| 32 | [WEB] Setup Playwright for E2E | Configure Playwright for E2E testing (separate from unit tests) | High | `Ticket`, `frontend`, `testing`, `e2e` |

### Stage 3: Backend Unit Tests (Depends on #30)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 33 | [API] Unit Tests for Auth Module | Test AuthService, JwtStrategy, password hashing, token generation | High | `Ticket`, `backend`, `testing` |
| 34 | [API] Unit Tests for Tickets Module | Test TicketsService, TicketsRepository, filtering logic | High | `Ticket`, `backend`, `testing` |
| 35 | [API] Unit Tests for AI Module | Test AiService, prompt builders, LM Studio integration | High | `Ticket`, `backend`, `testing` |
| 36 | [API] Unit Tests for Messages Module | Test MessageService, conversation thread logic | Medium | `Ticket`, `backend`, `testing` |

### Stage 4: Backend Integration & E2E (Depends on #33-36)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 37 | [API] Integration Tests with Testcontainers | Setup PostgreSQL + Redis containers for integration testing | High | `Ticket`, `backend`, `testing`, `devops` |
| 38 | [API] E2E Tests for Auth Flows | Test login, register, token refresh, 401 handling | High | `Ticket`, `backend`, `testing` |
| 39 | [API] E2E Tests for Ticket Flows | Test CRUD operations, filtering, pagination, ownership | High | `Ticket`, `backend`, `testing` |
| 40 | [API] E2E Tests for AI Job Flows | Test AI job enqueue, SSE streaming, result delivery | Medium | `Ticket`, `backend`, `testing` |

### Stage 5: Frontend Component Tests (Depends on #29, #31)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 41 | [WEB] Test Shared UI Components | Test Button, Input, Badge, Modal, Toast with Vitest | Medium | `Ticket`, `frontend`, `testing` |
| 42 | [WEB] Test Auth Components | Test LoginComponent, RegisterComponent with signals | High | `Ticket`, `frontend`, `testing` |
| 43 | [WEB] Test Ticket Components | Test TicketListComponent, TicketDetailComponent with signals | High | `Ticket`, `frontend`, `testing` |
| 44 | [WEB] Test AI Panel Component | Test AiPanelComponent with mocked SSE streams | Medium | `Ticket`, `frontend`, `testing` |

### Stage 6: Frontend E2E (Depends on #32, #42-44)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 45 | [WEB] E2E Test Auth Flows | Playwright E2E for login, register, logout, guard redirects | High | `Ticket`, `frontend`, `testing`, `e2e` |
| 46 | [WEB] E2E Test Ticket Flows | Playwright E2E for ticket CRUD, filters, detail, messages | High | `Ticket`, `frontend`, `testing`, `e2e` |
| 47 | [WEB] E2E Test AI Features | Playwright E2E for AI panel actions and SSE streaming | Medium | `Ticket`, `frontend`, `testing`, `e2e` |

### Stage 7: QA & Manual Testing (Depends on all automated tests)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 48 | [QA] Manual Testing - Auth Flow | Complete manual testing of login, register, logout flows | High | `Ticket`, `qa`, `testing` |
| 49 | [QA] Manual Testing - Ticket Flow | Complete manual testing of ticket CRUD, filters, detail view | High | `Ticket`, `qa`, `testing` |
| 50 | [QA] Manual Testing - AI Features | Test AI panel actions, SSE streaming, error handling | High | `Ticket`, `qa`, `testing` |
| 51 | [QA] Manual Testing - Admin Panel | Test user management, permissions, ticket queue | Medium | `Ticket`, `qa`, `testing` |

### Stage 8: Bug Fixes & Optimization (Depends on #48-51)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 52 | [QA] Bug Fixes from Test Findings | Fix bugs discovered during testing phase | High | `Ticket`, `bug`, `qa` |
| 53 | [QA] Performance Optimization Pass | Review and optimize slow queries, bundle size, rendering | Medium | `Ticket`, `enhancement`, `qa` |
| 54 | [QA] Security Audit and Fixes | Review security requirements (SEC-01 to SEC-12), fix gaps | High | `Ticket`, `security`, `qa` |

### Stage 9: Documentation (Can be parallel, best at end)

| # | Title | Description | Priority | Labels |
|---|-------|-------------|----------|--------|
| 55 | [DOC] API Testing Guide | Document how to run tests, write new tests, debug failures | Medium | `Ticket`, `documentation` |
| 56 | [DOC] Frontend Testing Guide | Document Angular 21 testing with Vitest + signals | Medium | `Ticket`, `documentation` |
| 57 | [DOC] Test Coverage Report | Generate and document test coverage statistics | Low | `Ticket`, `documentation` |

---

## Acceptance Criteria

### Phase 3 Completion Checklist

- [ ] **API Unit Tests**
  - [ ] Vitest configured and working
  - [ ] Auth module tests passing (>80% coverage)
  - [ ] Tickets module tests passing (>80% coverage)
  - [ ] AI module tests passing (>80% coverage)
  - [ ] Messages module tests passing (>80% coverage)

- [ ] **API Integration Tests**
  - [ ] Testcontainers setup working
  - [ ] PostgreSQL container spins up for tests
  - [ ] Redis container spins up for tests
  - [ ] Integration tests pass with real DB

- [ ] **API E2E Tests**
  - [ ] Auth flow E2E tests passing
  - [ ] Ticket CRUD E2E tests passing
  - [ ] AI job flow E2E tests passing

- [ ] **Frontend Tests (Angular 21)**
  - [ ] Vitest configured for Angular 21 (zoneless + signals)
  - [ ] Orval mocks generating successfully
  - [ ] Shared component tests passing
  - [ ] Feature component tests passing with signals
  - [ ] All tests run in CI

- [ ] **Playwright E2E**
  - [ ] Playwright configured
  - [ ] Auth flow E2E passing
  - [ ] Ticket flow E2E passing
  - [ ] AI features E2E passing

- [ ] **QA Validation**
  - [ ] Manual testing checklist completed
  - [ ] All critical bugs fixed
  - [ ] Performance benchmarks met
  - [ ] Security audit completed

- [ ] **Documentation**
  - [ ] Testing guides written
  - [ ] Coverage report generated
  - [ ] Test runbook documented

---

## Testing Tools & Dependencies

### API (to add)

```json
{
  "devDependencies": {
    "@nestjs/testing": "^11.0.1",
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "vite-tsconfig-paths": "^5.0.0",
    "testcontainers": "^10.16.0",
    "@testcontainers/postgresql": "^10.16.0",
    "@testcontainers/redis": "^10.16.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```

### Web (to add)

```json
{
  "devDependencies": {
    "@angular/build": "^21.1.4",
    "vitest": "^4.0.8",
    "@vitest/browser-playwright": "^3.0.0",
    "@testing-library/angular": "^17.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.50.0",
    "jsdom": "^27.1.0"
  }
}
```

**Note:** As per milestone requirements:
- ❌ NO Jest
- ❌ NO Jasmine (migration to Vitest)
- ❌ NO Karma (deprecated in Angular 21)
- ❌ NO Cypress
- ✅ ONLY Vitest (unit) + Playwright (E2E)

---

## Workflow

### Issue Creation (via gh CLI)

```bash
# Create issue for each ticket
gh issue create \
  --title "[API] Setup Vitest Configuration" \
  --body-file /tmp/issue-28.md \
  --milestone "PHASE 3 - Tests and QA & iteration loops on demand" \
  --label "backend" \
  --label "testing" \
  --label "high-priority"
```

### Branch & PR Workflow

```bash
# Checkout dev and create branch
git checkout dev
git pull origin dev
git checkout -b 28-dev-ticket-28-vitest-config

# Develop, commit, push
git add .
git commit -m "test(api): setup vitest configuration

- Add vitest.config.ts for unit tests
- Add vitest-e2e.config.ts for E2E tests
- Configure coverage with v8 provider
- Add test scripts to package.json

Closes #28"
git push -u origin 28-dev-ticket-28-vitest-config

# Create PR
gh pr create \
  --base dev \
  --head 28-dev-ticket-28-vitest-config \
  --title "test(api): setup vitest configuration" \
  --body "Closes #28"
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Testcontainers slow CI | Medium | Use parallel test execution, cache Docker images |
| Orval mocks out of sync | Medium | Make `sdk:gen` a pre-commit hook |
| Flaky E2E tests | High | Add retry logic, proper cleanup, isolated test data |
| Low test coverage | Medium | Enforce coverage thresholds in CI |
| Angular 21 signals testing complexity | Medium | Follow Angular 21 testing guide, use Testing Library |
| Zoneless change detection issues | Low | Use OnPush, explicit signal triggers in tests |

---

## Success Metrics

- **API First Approach:**
  - All API endpoints tested and documented
  - OpenAPI spec 100% accurate and up to date
  - SDK generation working without errors

- **API Test Coverage:**
  - Unit tests: >80% coverage
  - Integration tests: >70% coverage
  - E2E tests: All critical flows covered

- **Frontend Test Coverage:**
  - Vitest component tests: >70% coverage
  - Playwright E2E: All critical user flows
  - Orval mocks generating successfully

- **QA Validation:**
  - Manual testing checklist completed
  - 0 critical bugs open
  - All security requirements (SEC-01 to SEC-12) met

- **Tooling Compliance:**
  - ✅ Using Vitest (NO Jest/Jasmine/Karma)
  - ✅ Using Playwright (E2E only, NO Cypress)
  - ✅ Following Angular 21 testing best practices
  - ✅ Following NestJS testing best practices

---

**Last Updated:** 2026-03-27
**Document Version:** 2.0 (revised with Angular 21 official testing guide)
