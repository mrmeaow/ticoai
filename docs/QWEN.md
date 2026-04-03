# TICOAI - AI Agent Context Guide

**Project:** AI-Powered Customer Support Ticket System  
**Repository:** https://github.com/mrmeaow/ticoai  
**Root Branch:** `dev`  
**Current Phase:** Phase 2 - Rapid Implementations (90% complete)

---

## 🎯 Project Overview

Full-stack monorepo with:
- **Backend:** NestJS modular monolith (TypeScript, TypeORM, BullMQ, SSE, RBAC)
- **Frontend:** Angular v21 SPA (Zoneless, Signals, TailwindCSS v4)
- **AI:** LM Studio local LLM integration
- **Infrastructure:** PostgreSQL, Redis, BullMQ, Mailpit

---

## 📁 Monorepo Structure

```
ticoai/
├── apps/
│   ├── api/                    # NestJS API server
│   │   ├── src/
│   │   │   ├── common/         # Guards, decorators, interceptors, pipes
│   │   │   ├── config/         # Configuration modules
│   │   │   ├── database/       # TypeORM migrations, seeds
│   │   │   └── modules/        # Domain modules (auth, users, tickets, etc.)
│   │   └── scripts/            # OpenAPI export script
│   │
│   └── web/                    # Angular SPA
│       └── src/app/
│           ├── core/           # Guards, interceptors, services
│           ├── features/       # Feature modules (auth, tickets, admin)
│           └── shared/         # Shared components, directives, pipes
│
├── packages/
│   ├── api-sdk/                # Orval-generated SDK (DO NOT EDIT)
│   └── types/                  # Shared TypeScript types
│
├── PLAN.md                     # Phase-driven development plan
├── CONSTITUTION.md             # PRD/SRS with full requirements
└── docker-compose.yml          # Infrastructure (Postgres, Redis, Mailpit)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **API** | NestJS | v11 |
| **Frontend** | Angular | v21 (Zoneless + Signals) |
| **Database** | PostgreSQL + TypeORM | v16 / v0.3 |
| **Cache/Queue** | Redis + BullMQ | v7 / v5 |
| **AI** | LM Studio (local) | Llama 3.1 8B |
| **Styling** | TailwindCSS | v4 |
| **Monorepo** | PNPM Workspaces | v9 |
| **SDK Gen** | Orval | v7 |

---

## 🚀 Development Commands

```bash
# Start both API and Web dev servers
pnpm dev

# Start API only
pnpm dev:api

# Start Web only
pnpm dev:web

# Generate SDK from OpenAPI spec
pnpm sdk:gen

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 📐 Coding Conventions

### Backend (NestJS)

**Module Structure:**
```
module.ts          # imports, declares, exports
controller.ts      # @Controller, thin HTTP adapter ONLY
service.ts         # business logic, calls repository
repository.ts      # TypeORM queries ONLY
entity.ts          # @Entity schema definition
dto/               # Request/Response DTOs with @ApiProperty
```

**Key Patterns:**
- Controllers are thin (validate DTO → call service)
- No business logic in controllers
- No direct TypeORM in controllers (use repository layer)
- All DTOs must have `@ApiProperty()` decorators
- Custom JWT auth (no Passport)
- RBAC via `@Permissions()` decorator + `PermissionsGuard`

**Example:**
```typescript
@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Permissions('tickets:read')
  async findAll(@CurrentUser() user: User, @Query('status') status?: TicketStatus) {
    const isAdmin = user.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r.name));
    return this.ticketsService.findAll({ status }, user.id, isAdmin);
  }
}
```

### Frontend (Angular v21)

**Key Patterns:**
- **Zoneless:** `provideExperimentalZonelessChangeDetection()`
- **Signals:** Use `signal()`, `computed()`, `output()` for state
- **Standalone:** All components are standalone (no NgModules)
- **Shared Components:** Import from `@app/shared` barrel export

**Example:**
```typescript
@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ButtonComponent],
  templateUrl: './ticket-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListComponent implements OnInit {
  readonly ticketService = inject(TicketService);
  filters: TicketFilters = {};

  ngOnInit() {
    this.ticketService.loadTickets();
  }
}
```

**Shared Components Available:**
- `ButtonComponent` - primary/secondary/danger/ghost variants
- `InputComponent` - label, validation, error messages
- `BadgeComponent` - status/priority badges
- `SpinnerComponent` - loading states
- `EmptyStateComponent` - empty state with action
- `ErrorMessageComponent` - error/warning display
- `ModalComponent` - modal dialogs
- `ToastComponent` - notifications
- `HasPermissionDirective` - `*hasPermission="'tickets:create'"`

---

## 🔐 Authentication & Authorization

### Backend
- JWT access token (15 min expiry)
- JWT refresh token (7 days, stored in Redis)
- Custom `JwtAuthGuard` (no Passport)
- `PermissionsGuard` for RBAC
- `@Public()` decorator skips auth
- `@Permissions('resource:action')` for authorization

### Frontend
- Access token in localStorage
- Refresh token in httpOnly cookie
- `authInterceptor` handles 401 and auto-refresh
- `authGuard` protects routes
- `guestGuard` prevents authenticated access to login/register
- `adminGuard` restricts admin panel

---

## 📡 API Communication

### OpenAPI-First Workflow
1. Define DTOs with `@ApiProperty()` decorators
2. Run `pnpm sdk:gen` to regenerate SDK
3. Use generated SDK in Angular services

### SDK Usage
```typescript
import { AuthControllerLogin } from '@pkg/api-sdk';

// Generated function
const response = await AuthControllerLogin({ email, password });
```

### SSE for AI Jobs
```typescript
// Open SSE stream
const eventSource = new EventSource(
  `${apiUrl}/sse/jobs/${jobId}?token=${accessToken}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { status: 'pending' | 'processing' | 'completed' | 'failed', result?: string }
};
```

---

## 🗄️ Database

### Key Entities
- `users` - User accounts with soft delete
- `roles` - SUPER_ADMIN, ADMIN, AGENT, VIEWER
- `permissions` - resource:action pairs
- `user_roles` - Junction table
- `role_permissions` - Junction table
- `tickets` - Support tickets with status/priority
- `messages` - Conversation thread per ticket
- `ai_results` - AI job results

### Migration Workflow
```bash
# Generate migration after entity changes
pnpm --filter @app/api migration:generate -- src/database/migrations/AddIndexes

# Run pending migrations
pnpm --filter @app/api migration:run

# Revert last migration
pnpm --filter @app/api migration:revert
```

---

## 🤖 AI Integration

### AI Job Flow
1. Frontend triggers AI action (summarize/detect-priority/suggest-reply)
2. Backend enqueues BullMQ job → returns `{ jobId, resultId }`
3. Frontend opens SSE stream to `/api/sse/jobs/:jobId`
4. BullMQ worker processes job via LM Studio API
5. Result pushed via SSE → Frontend displays

### AI Prompts
- **Summarize:** "Summarize this support ticket in 2-3 sentences"
- **Detect Priority:** "Return exactly one priority level (LOW, MEDIUM, HIGH, CRITICAL)"
- **Suggest Reply:** "Draft a professional reply under 100 words"

---

## 🎨 UI/UX Design System

### Brand Colors (TailwindCSS v4)
```css
--color-brand-500: #2563c7;     /* Primary */
--color-brand-600: #1d52a8;     /* Hover */

--color-success-500: #2d9d6e;
--color-warning-500: #d08a00;
--color-danger-500:  #c0392b;

--color-priority-low:      #2d9d6e;
--color-priority-medium:   #1d52a8;
--color-priority-high:     #d08a00;
--color-priority-critical: #7b0a02;
```

### Status Badges
- OPEN → blue
- IN_PROGRESS → yellow
- RESOLVED → green
- CLOSED → gray

---

## 📋 Phase-Driven Development

### Current Status (Phase 2)

| Ticket | Status | PR |
|--------|--------|-----|
| #4 Tickets Repository | ✅ Done | Merged |
| #5 Dashboard Module | ⏳ Pending | - |
| #6 SSE Streaming | ✅ Done | Merged |
| #7 Auth Feature | ✅ Done | Merged |
| #8 Ticket List | ✅ Done | Merged |
| #9 Ticket Detail | ✅ Done | Merged |
| #10 AI Panel | ⏳ Pending | - |
| #11 Orval SDK | ✅ Done | Merged |
| #12 Notifications | ⏳ Pending | - |
| #13 Shared UI | ✅ Done | Merged |
| #14 Cron Jobs | ⏳ Pending | - |
| #15 Admin Panel | ✅ Done | PR #25 |
| #16 Create Ticket | ✅ Done | PR #25 |
| #17 Permission Directive | ✅ Done | PR #25 |

### Branch Naming Convention
```
{issue-number}-dev-ticket-{issue-number}-{feature-name}
```
Example: `4-dev-ticket-4-tickets-repository`

### Commit Message Format
```
feat(scope): implement feature name

- Bullet point 1
- Bullet point 2

Closes #X
```

**DO NOT add co-author lines.**

---

## 🧪 Testing Strategy

### Backend
- Unit tests with Vitest
- Integration tests with Testcontainers (PostgreSQL, Redis)
- E2E tests for critical flows

### Frontend
- Component tests with Vitest + jsdom
- Orval mocks for API isolation

---

## 🔧 Environment Variables

```bash
# API
NODE_ENV=development
APP_PORT=3000
DATABASE_URL=postgresql://ticoai:ticoai_secret@localhost:5432/ticoai
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
LMSTUDIO_URL=http://localhost:1234

# Web
API_URL=http://localhost:3000/api
```

---

## 📚 Key Documentation

- **PLAN.md** - Phase-driven development plan with issue tracking
- **CONSTITUTION.md** - Full PRD/SRS (2200+ lines)
- **OpenAPI Spec** - `/api/openapi.json` (generated)
- **Swagger UI** - `/api/docs` (dev only)

---

## 🚨 Common Issues & Solutions

### SDK Generation Fails
```bash
# Ensure API is built first
pnpm build:api
pnpm sdk:export
pnpm --filter @pkg/api-sdk generate
```

### TypeORM Migration Errors
```bash
# Check data-source.ts config
# Ensure synchronize: false
# Run migrations explicitly
pnpm --filter @app/api migration:run
```

### Angular Build Errors
```bash
# Clear cache
rm -rf apps/web/dist
rm -rf apps/web/.angular
pnpm build:web
```

---

## 📞 Quick Reference

### Create New Feature Branch
```bash
git checkout dev
git pull origin dev
git checkout -b {issue}-dev-ticket-{issue}-{feature}
```

### After Completing Work
```bash
git add .
git commit -m "feat(scope): implement feature

- Change 1
- Change 2

Closes #X"
git push origin {branch-name}

# Create PR
gh pr create --base dev --head {branch-name} --title "feat: ..." --body "Closes #X"
```

### Regenerate SDK
```bash
pnpm sdk:gen
```

---

**Last Updated:** 2026-03-27  
**Document Version:** 1.0
