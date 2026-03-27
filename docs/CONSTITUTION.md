# Product Requirements Document (PRD) & Software Requirements Specification (SRS)

**Project:** AI-Powered Customer Support Ticket System
**Version:** 2.0.0
**Status:** Draft
**Last Updated:** 2026-03-26

---

> [!IMPORTANT]
> Must use native clis to create/generate apps e.g. `@nestjs/cli` for nestjs app, and `@angular/cli` for angular apps (v21+)

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Scope & Constraints](#4-scope--constraints)
5. [Stakeholders & User Personas](#5-stakeholders--user-personas)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Monorepo & Project Structure](#9-monorepo--project-structure)
10. [Database Design (TypeORM)](#10-database-design-typeorm)
11. [API Specification (OpenAPI / API-First)](#11-api-specification-openapi--api-first)
12. [NestJS Backend Specification](#12-nestjs-backend-specification)
13. [RBAC & Permission Matrix](#13-rbac--permission-matrix)
14. [Frontend Specification (Angular v21)](#14-frontend-specification-angular-v21)
15. [AI Integration Specification (LM Studio)](#15-ai-integration-specification-lm-studio)
16. [Async Patterns (BullMQ, Cron, SSE)](#16-async-patterns-bullmq-cron-sse)
17. [Email (SMTP / Mailpit)](#17-email-smtp--mailpit)
18. [Redis Module (Global)](#18-redis-module-global)
19. [SDK Generation & Sync Workflow (Orval)](#19-sdk-generation--sync-workflow-orval)
20. [Testing Strategy](#20-testing-strategy)
21. [Security Requirements](#21-security-requirements)
22. [Deployment & Infrastructure](#22-deployment--infrastructure)
23. [Milestones & Build Order](#23-milestones--build-order)
24. [Open Questions & Risks](#24-open-questions--risks)

---

## 1. Executive Summary

This document defines the complete product and technical requirements for an **AI-powered customer support ticket system** — a full-stack portfolio project engineered to production standards. The system allows support agents and admins to manage customer issue tickets, communicate via threaded conversations, and leverage a locally-hosted LLM (via LM Studio) for intelligent triage, summarization, and reply drafting.

The architecture is a **PNPM monorepo** consisting of:
- A **NestJS modular monolith** API (TypeScript, TypeORM, BullMQ, SSE, RBAC, OpenAPI-first)
- An **Angular v21 SPA** (Signals, Zoneless, TailwindCSS v4, SDK auto-generated via Orval)

In **development**, both apps run as independent dev servers. In **production**, the Angular SPA is pre-built and served statically from the NestJS API under the root path (`/`), with all API routes namespaced under `/api/*`.

---

## 2. Product Overview

### 2.1 Problem Statement

Support agents waste time on mechanical tasks: re-reading full ticket histories, guessing at priority, composing first-draft replies. These tasks are prime candidates for LLM augmentation in a controlled, local-inference environment.

### 2.2 Proposed Solution

A web-based ticket management platform where:

- Agents authenticate and manage an assigned ticket queue.
- Tickets carry a full conversation thread (agent ↔ customer ↔ AI).
- Per-ticket AI actions are available: **Summarize**, **Detect Priority**, **Suggest Reply**.
- AI jobs are enqueued asynchronously via BullMQ; results stream back over SSE.
- Role-based access control (RBAC) with a granular permission matrix governs every action.
- Email notifications are dispatched via SMTP (Mailpit in dev, real SMTP in prod).
- The OpenAPI contract is the single source of truth; the Angular SDK is always generated from it.

### 2.3 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **API Framework** | NestJS (modular monolith) | v10+ |
| **Language** | TypeScript | v5.x (strict) |
| **ORM** | TypeORM | v0.3.x |
| **Database** | PostgreSQL | v16 |
| **Cache / Queue** | Redis + BullMQ | Redis 7, BullMQ v5 |
| **Auth** | `@nestjs/jwt` + custom Guards | — |
| **API Contract** | OpenAPI 3.1, `@nestjs/swagger` | — |
| **SDK Generation** | Orval | v7+ |
| **AI Runtime** | LM Studio (local HTTP server) | — |
| **AI Model** | Llama 3.1 8B Instruct (GGUF) | — |
| **Email** | Nodemailer / `@nestjs-modules/mailer` | Mailpit (dev) |
| **Frontend** | Angular | v21 |
| **Rendering** | Zoneless + Signals | — |
| **Styling** | TailwindCSS | v4 (CSS `@theme`) |
| **Testing (API)** | Vitest + Testcontainers | — |
| **Testing (Web)** | Vitest + Orval mocks | — |
| **Monorepo** | PNPM Workspaces | — |
| **Containerization** | Docker, Docker Compose | — |

---

## 3. Goals & Success Metrics

### 3.1 Portfolio Goals

| Goal | Demonstrated By |
|---|---|
| Enterprise-grade backend architecture | NestJS modular monolith, RBAC, TypeORM migrations, BullMQ |
| API-first discipline | OpenAPI contract published at `/api/openapi.json`; SDK generated before every model change |
| Modern frontend | Angular v21, Zoneless, Signals — no NgZone, no `async` pipe debt |
| Real async patterns | BullMQ queues for AI jobs, cron jobs for maintenance, SSE for result streaming |
| Security thinking | Custom JWT Guards, RBAC permission matrix, no direct DB queries from controllers |
| Testing maturity | Testcontainers for real-DB e2e, Orval mocks for frontend isolation |

### 3.2 Functional Success Criteria

- A user can register, receive a JWT, and access protected resources.
- A user can create, read, update, and soft-delete tickets.
- A user can send messages in a ticket thread; role is captured per message.
- AI summarization returns a coherent result within 15 seconds over SSE.
- AI priority detection returns exactly one of: `LOW | MEDIUM | HIGH | CRITICAL`.
- AI reply suggestion returns a draft under 100 words.
- All AI jobs are enqueued via BullMQ and never block the HTTP response.
- SSE stream delivers job status and result to the Angular client in real time.
- RBAC prevents unauthorized actions at the service layer (not just route level).
- The Angular SDK is always in sync with the API contract.

---

## 4. Scope & Constraints

### 4.1 In Scope

- User registration, login, JWT refresh, logout
- Ticket CRUD with soft deletes
- Conversation threads (messages per ticket)
- Three AI features: Summarize, Detect Priority, Suggest Reply
- RBAC with roles: `SUPER_ADMIN`, `ADMIN`, `AGENT`, `VIEWER`
- Permission matrix (resource × action)
- Dashboard aggregate stats
- Admin panel (ticket queue management, user role assignment)
- BullMQ async job processing
- SSE for AI job result push
- Cron job for housekeeping (e.g. auto-close stale tickets)
- Email notifications (ticket assigned, resolved, etc.) via SMTP
- Global Redis module (cache + queue + session-store)
- OpenAPI contract at `/api/openapi.json`
- Orval SDK — auto-generated, committed, re-synced on every API change
- PNPM monorepo — dual dev servers, unified production from API

### 4.2 Out of Scope

- Multi-tenancy / SaaS organization model
- WebSocket real-time (SSE covers current needs)
- File/attachment uploads
- Customer-facing public portal
- Payment or subscription billing
- External AI APIs (OpenAI, Anthropic, etc.) — local LM Studio only

### 4.3 Hard Constraints

| Constraint | Rationale |
|---|---|
| No `synchronize: true` or `autoLoadEntities` in any environment | TypeORM migrations are the only schema management path |
| No Passport.js | Custom `@nestjs/jwt` guards only |
| No Redux / NgRx | Angular Signals + service-level state is sufficient at this scope |
| LM Studio must run locally | No external AI API calls; `LMSTUDIO_URL` is env-configured |
| All SQL via TypeORM repositories | No raw query strings from controllers or routes |
| SDK re-generated before any service-layer change | Orval sync is a mandatory pre-change step, not optional |

---

## 5. Stakeholders & User Personas

### Support Agent (Primary)

Works a daily ticket queue. Needs speed and context. Benefits from AI summaries (orientation), priority detection (triage), and suggested replies (drafting).

### Admin (Secondary)

Manages the queue, assigns tickets, adjusts roles. Needs visibility across all agents and the ability to escalate or close tickets.

### Super Admin (Operational)

Manages users, roles, permission assignments. Has no ticket-domain restrictions.

### Portfolio Reviewer / Interviewer (Meta-Stakeholder)

Evaluates the codebase, architecture decisions, and live demo. Wants to see clean layering, real patterns, and the ability to explain every trade-off in under two minutes per topic.

---

## 6. Functional Requirements

MoSCoW: **M** = Must Have, **S** = Should Have, **C** = Could Have.

### 6.1 Authentication & Session

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | User can register with email, password, and name | M |
| AUTH-02 | User can login; system returns a short-lived access JWT and a long-lived refresh JWT | M |
| AUTH-03 | Access JWT expires in 15 minutes; refresh JWT expires in 7 days | M |
| AUTH-04 | Refresh token endpoint issues a new access JWT without re-login | M |
| AUTH-05 | Logout invalidates the refresh token (stored/blacklisted in Redis) | M |
| AUTH-06 | All protected routes reject requests without a valid access JWT (HTTP 401) | M |
| AUTH-07 | Passwords are hashed with bcrypt (cost ≥ 12) | M |
| AUTH-08 | Access JWT is stored in memory (Angular); refresh JWT in `httpOnly` cookie | S |
| AUTH-09 | `GET /api/auth/me` returns the current user with resolved permissions | M |

### 6.2 User Management

| ID | Requirement | Priority |
|---|---|---|
| USER-01 | Admin can list all users (paginated) | M |
| USER-02 | Admin can activate/deactivate a user | M |
| USER-03 | Super Admin can assign roles to a user | M |
| USER-04 | User can update their own profile (name, password) | M |
| USER-05 | Sensitive fields (password hash, refresh token) are never returned in API responses | M |

### 6.3 Ticket Management

| ID | Requirement | Priority |
|---|---|---|
| TKT-01 | Agent can create a ticket (title, description, initial priority) | M |
| TKT-02 | Agent can list their own tickets; Admin can list all tickets | M |
| TKT-03 | List supports filtering by status, priority, assignee; free-text search on title | M |
| TKT-04 | List supports cursor-based pagination | S |
| TKT-05 | Agent can view full ticket detail including message thread | M |
| TKT-06 | Agent can update a ticket's status and priority | M |
| TKT-07 | Admin can reassign a ticket to another agent | M |
| TKT-08 | Ticket deletion is a soft delete (`deleted_at` timestamp) | M |
| TKT-09 | Status transitions are validated: `OPEN → IN_PROGRESS → RESOLVED → CLOSED` | S |

### 6.4 Messaging / Conversation Thread

| ID | Requirement | Priority |
|---|---|---|
| MSG-01 | Agent can post a reply message in a ticket | M |
| MSG-02 | Messages are returned in chronological order | M |
| MSG-03 | Each message carries a role: `AGENT`, `CUSTOMER`, `AI` | M |
| MSG-04 | AI-generated messages are flagged distinctly from human replies | M |
| MSG-05 | New messages trigger an email notification to the assigned agent (if not sender) | S |

### 6.5 AI Features

| ID | Requirement | Priority |
|---|---|---|
| AI-01 | Agent can trigger "Generate Summary" for any ticket they have access to | M |
| AI-02 | Summary reflects the full description + conversation thread | M |
| AI-03 | Agent can trigger "Detect Priority" | M |
| AI-04 | Priority detection returns exactly one of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | M |
| AI-05 | Agent can trigger "Suggest Reply" | M |
| AI-06 | Suggested reply is context-aware (uses last 5 messages) | M |
| AI-07 | All AI triggers enqueue a BullMQ job and return a `{ jobId }` immediately | M |
| AI-08 | AI job results are pushed to the client via SSE (`/api/sse/jobs/:jobId`) | M |
| AI-09 | AI results are persisted in `ai_results` and rendered on subsequent ticket views | M |
| AI-10 | Failed jobs are retried up to 3 times; then marked `FAILED` and SSE notifies client | M |

### 6.6 Dashboard

| ID | Requirement | Priority |
|---|---|---|
| DASH-01 | Returns total, open, in-progress, resolved, closed ticket counts | M |
| DASH-02 | Returns count of HIGH + CRITICAL priority tickets | M |
| DASH-03 | Returns 5 most recently updated tickets | M |
| DASH-04 | Scoped to agent's own tickets unless requester is Admin/Super Admin | M |

### 6.7 Admin Panel

| ID | Requirement | Priority |
|---|---|---|
| ADMIN-01 | Admin can view all tickets across all agents | M |
| ADMIN-02 | Admin can change status or priority of any ticket | M |
| ADMIN-03 | Admin can view all registered users | M |
| ADMIN-04 | Super Admin can create/update/delete roles | S |
| ADMIN-05 | Super Admin can manage the permission matrix | S |

### 6.8 Notifications (Email)

| ID | Requirement | Priority |
|---|---|---|
| NOTIF-01 | Email is sent when a ticket is assigned to an agent | S |
| NOTIF-02 | Email is sent when a ticket is resolved | S |
| NOTIF-03 | Email is sent when a new message is added to an agent's ticket | S |
| NOTIF-04 | All emails are queued via BullMQ (never blocking the request) | M |
| NOTIF-05 | Mailpit is used in development; real SMTP credentials in production | M |

### 6.9 Cron Jobs

| ID | Requirement | Priority |
|---|---|---|
| CRON-01 | A daily cron auto-closes tickets with status `RESOLVED` for > 7 days | S |
| CRON-02 | A cron purges `FAILED` AI job records older than 30 days | C |
| CRON-03 | All cron jobs emit logs to the NestJS logger | M |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement |
|---|---|
| PERF-01 | All CRUD REST responses must complete in < 200ms under single-user local load |
| PERF-02 | AI job results must arrive via SSE within 15 seconds (LM Studio, quantized model) |
| PERF-03 | Angular initial bundle load (lazy-loaded routes) must complete in < 2s on localhost |
| PERF-04 | BullMQ workers must not starve the main NestJS event loop |

### 7.2 Reliability

| ID | Requirement |
|---|---|
| REL-01 | Failed AI BullMQ jobs must retry up to 3 times with exponential backoff |
| REL-02 | If LM Studio is unreachable, the API returns HTTP 503 with a structured error; it does not crash |
| REL-03 | Redis unavailability must degrade gracefully (queue/SSE unavailable; auth still works via DB) |
| REL-04 | TypeORM migrations run at API startup before the app accepts traffic |

### 7.3 Maintainability

| ID | Requirement |
|---|---|
| MAINT-01 | All code (API + web) is strict TypeScript |
| MAINT-02 | API follows NestJS modular monolith pattern; one NestJS module per domain |
| MAINT-03 | Angular follows feature-based structure; one Angular module (or standalone component set) per domain |
| MAINT-04 | No business logic in controllers — controllers are thin HTTP adapters only |
| MAINT-05 | No direct TypeORM EntityManager calls outside the repository layer |
| MAINT-06 | Shared TypeScript types live in `packages/types`; consumed by both `apps/api` and `apps/web` |

### 7.4 API Contract Discipline

| ID | Requirement |
|---|---|
| CONTRACT-01 | `@nestjs/swagger` decorators are mandatory on every controller method and DTO |
| CONTRACT-02 | The OpenAPI JSON spec is served at `GET /api/openapi.json` |
| CONTRACT-03 | Orval must be re-run (`pnpm sdk:gen`) before any service or DTO change is committed |
| CONTRACT-04 | The generated SDK (`packages/api-sdk`) is committed to the repo and reviewed in PRs |

### 7.5 Developer Experience

| ID | Requirement |
|---|---|
| DX-01 | `pnpm dev` starts both `apps/api` and `apps/web` dev servers concurrently |
| DX-02 | `pnpm build && pnpm start` serves the full app from the NestJS server only |
| DX-03 | `docker compose up` starts Postgres, Redis, Mailpit, and LM Studio (if image available) |
| DX-04 | A seed script populates roles, permissions, and sample tickets |
| DX-05 | Angular HMR is active in dev mode |

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
                          ┌─────────────────────────────────┐
                          │       Browser (Angular SPA)      │
                          │  Signals · Zoneless · TW v4      │
                          │  Orval-generated HTTP SDK        │
                          └────────────┬───────────┬─────────┘
                                       │           │
                          HTTP /api/*  │           │  SSE /api/sse/*
                                       │           │
                          ┌────────────▼───────────▼─────────┐
                          │       NestJS API Server           │
                          │   Global prefix: /api             │
                          │   Serves SPA at /  (prod only)    │
                          │                                   │
                          │  ┌──────────────────────────────┐ │
                          │  │  Modules (Domain Boundaries) │ │
                          │  │  Auth · Users · Tickets      │ │
                          │  │  Messages · AI · Dashboard   │ │
                          │  │  Admin · Notifications · SSE │ │
                          │  └──────────────────────────────┘ │
                          │                                   │
                          │  ┌──────────┐  ┌──────────────┐  │
                          │  │ BullMQ   │  │  Cron Jobs   │  │
                          │  │ Workers  │  │  (schedule)  │  │
                          │  └────┬─────┘  └──────────────┘  │
                          └───────┼──────────────────────────-┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
    ┌────────▼──────┐  ┌──────────▼──────┐  ┌─────────▼───────┐
    │  PostgreSQL   │  │     Redis        │  │   LM Studio     │
    │  (TypeORM)    │  │  (global module) │  │  Llama 3.1 8B   │
    │  Migrations   │  │  cache·queue·    │  │  /v1/chat/      │
    └───────────────┘  │  refresh tokens  │  │  completions    │
                       └─────────────────┘  └─────────────────┘

                       ┌─────────────────┐
                       │    Mailpit      │
                       │  (SMTP, dev)    │
                       └─────────────────┘
```

### 8.2 Request Flow — Standard CRUD

```
HTTP Request
  → Global API Prefix Guard (/api/*)
    → JwtAuthGuard (verifies access token)
      → PermissionGuard (checks RBAC matrix)
        → Controller (thin: validate DTO, call service)
          → Service (business logic)
            → Repository (TypeORM, DB access)
              → PostgreSQL
```

### 8.3 Request Flow — AI Job

```
POST /api/ai/summarize  { ticketId }
  → JwtAuthGuard + PermissionGuard
    → AiController
      → AiService.enqueue(type, ticketId)
        → Creates ai_results row (status: PENDING)
        → Enqueues BullMQ job { jobId, ticketId, type, resultId }
      ← returns { jobId }

Client opens SSE: GET /api/sse/jobs/:jobId
  → SseController (long-lived response stream)

BullMQ Worker (separate process context):
  → Fetches ticket + messages from DB
  → Builds prompt
  → POST http://lmstudio:1234/v1/chat/completions
  → Parses response
  → Updates ai_results row (status: COMPLETED, result: "...")
  → Emits SSE event to waiting client stream
    → Client receives { status: "completed", result: "..." }
    → Angular AI panel renders result
```

### 8.4 Production Serving Model

```
Build step:
  pnpm build:web  →  apps/web/dist/  (static Angular SPA)
  pnpm build:api  →  apps/api/dist/

API startup (NestJS):
  serve()
  ├── Mount: /api/*      →  All NestJS routes
  ├── Mount: /           →  ServeStaticModule from apps/web/dist/
  └── Fallback: *        →  index.html (SPA client-side routing)
```

---

## 9. Monorepo & Project Structure

### 9.1 PNPM Workspace Layout

```
/                                   # repo root
  pnpm-workspace.yaml
  package.json                      # root scripts: dev, build, test, sdk:gen
  tsconfig.base.json
  docker-compose.yml
  .env.example

  apps/
    api/                            # NestJS modular monolith
      src/
      test/
      package.json
      tsconfig.json
      vitest.config.ts
      orval.config.ts               # SDK source spec path

    web/                            # Angular v21 SPA
      src/
      package.json
      tsconfig.json
      vitest.config.ts

  packages/
    types/                          # Shared TypeScript types (DTOs, enums)
      src/
      package.json

    api-sdk/                        # Orval-generated HTTP client (DO NOT EDIT MANUALLY)
      src/
      package.json
```

### 9.2 Root `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 9.3 Root Scripts (`package.json`)

```json
{
  "scripts": {
    "dev":         "concurrently \"pnpm dev:api\" \"pnpm dev:web\"",
    "dev:api":     "pnpm --filter @app/api dev",
    "dev:web":     "pnpm --filter @app/web dev",
    "build":       "pnpm build:web && pnpm build:api",
    "build:api":   "pnpm --filter @app/api build",
    "build:web":   "pnpm --filter @app/web build",
    "start":       "pnpm --filter @app/api start:prod",
    "sdk:gen":     "pnpm --filter @app/api sdk:export && pnpm --filter @pkg/api-sdk generate",
    "test":        "pnpm -r test",
    "db:migrate":  "pnpm --filter @app/api migration:run",
    "db:seed":     "pnpm --filter @app/api seed"
  }
}
```

### 9.4 NestJS API Folder Structure (`apps/api/src/`)

```
src/
  main.ts                           # Bootstrap: global prefix, validation pipe, swagger, static serve
  app.module.ts                     # Root module; imports all domain modules

  common/
    decorators/
      current-user.decorator.ts
      permissions.decorator.ts
      public.decorator.ts
    filters/
      http-exception.filter.ts
      all-exceptions.filter.ts
    guards/
      jwt-auth.guard.ts             # Validates access JWT via @nestjs/jwt
      permissions.guard.ts          # Checks resolved permissions against matrix
    interceptors/
      logging.interceptor.ts
      response-transform.interceptor.ts
    pipes/
      parse-uuid.pipe.ts
      pagination.pipe.ts
    dto/
      pagination.dto.ts
      cursor-pagination.dto.ts

  config/
    app.config.ts
    database.config.ts
    redis.config.ts
    jwt.config.ts
    lmstudio.config.ts
    mail.config.ts

  database/
    migrations/                     # TypeORM migration files (generated, never hand-edited lightly)
    seeds/
      seed.ts
    data-source.ts                  # TypeORM DataSource for CLI and migrations

  modules/
    redis/                          # Global Redis module
      redis.module.ts
      redis.service.ts
      redis.constants.ts

    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      strategies/
        jwt.strategy.ts             # Token verification only — no Passport integration
      dto/
        register.dto.ts
        login.dto.ts
        refresh-token.dto.ts
        auth-response.dto.ts

    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      entities/
        user.entity.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
        user-response.dto.ts

    roles/
      roles.module.ts
      roles.controller.ts
      roles.service.ts
      roles.repository.ts
      entities/
        role.entity.ts
        permission.entity.ts
        user-role.entity.ts
        role-permission.entity.ts
      dto/
        create-role.dto.ts
        assign-permissions.dto.ts

    tickets/
      tickets.module.ts
      tickets.controller.ts
      tickets.service.ts
      tickets.repository.ts
      entities/
        ticket.entity.ts
      dto/
        create-ticket.dto.ts
        update-ticket.dto.ts
        ticket-response.dto.ts
        ticket-list-query.dto.ts
      enums/
        ticket-status.enum.ts
        ticket-priority.enum.ts

    messages/
      messages.module.ts
      messages.controller.ts
      messages.service.ts
      messages.repository.ts
      entities/
        message.entity.ts
      dto/
        create-message.dto.ts
        message-response.dto.ts

    ai/
      ai.module.ts
      ai.controller.ts
      ai.service.ts
      ai.repository.ts
      workers/
        ai.worker.ts                # BullMQ worker processor
      prompts/
        summarize.prompt.ts
        detect-priority.prompt.ts
        suggest-reply.prompt.ts
      entities/
        ai-result.entity.ts
      dto/
        ai-action.dto.ts
        ai-result-response.dto.ts
      enums/
        ai-job-type.enum.ts
        ai-job-status.enum.ts

    sse/
      sse.module.ts
      sse.controller.ts
      sse.service.ts                # Manages SSE client subscriptions

    notifications/
      notifications.module.ts
      notifications.service.ts
      notifications.processor.ts    # BullMQ processor for email jobs
      templates/
        ticket-assigned.hbs
        ticket-resolved.hbs
        new-message.hbs

    dashboard/
      dashboard.module.ts
      dashboard.controller.ts
      dashboard.service.ts

    cron/
      cron.module.ts
      auto-close.cron.ts
      cleanup-ai-jobs.cron.ts
```

### 9.5 Angular Web Folder Structure (`apps/web/src/`)

```
src/
  main.ts                           # bootstrapApplication (Zoneless provideExperimentalZonelessChangeDetection)
  app.config.ts                     # provideRouter, provideHttpClient, provideAnimations

  app/
    app.component.ts                # Root component (shell: router outlet)
    app.routes.ts                   # Lazy-loaded route map

    core/
      guards/
        auth.guard.ts               # Redirects unauthenticated users to /login
        permission.guard.ts         # Guards by required permission string
      interceptors/
        jwt.interceptor.ts          # Attaches access token to requests
        refresh.interceptor.ts      # Silent token refresh on 401
        error.interceptor.ts
      services/
        auth.service.ts             # login(), logout(), refreshToken(), currentUser signal
        permission.service.ts       # hasPermission(resource, action) — pure signal

    shared/
      components/
        button/
        input/
        badge/
        spinner/
        empty-state/
        error-message/
        modal/
        toast/
      directives/
        permission.directive.ts     # *hasPermission="'tickets:update'" structural directive
      pipes/
        time-ago.pipe.ts
      models/                       # Re-exports from packages/types + api-sdk

    features/
      auth/
        login/
          login.component.ts
          login.component.html
      dashboard/
        dashboard.component.ts
        dashboard.component.html
      tickets/
        tickets.routes.ts
        list/
          ticket-list.component.ts
          ticket-list.component.html
          ticket-table/
          ticket-filters/
        detail/
          ticket-detail.component.ts
          ticket-detail.component.html
          message-thread/
          message-input/
          ai-panel/
            ai-panel.component.ts   # AI action buttons + SSE result subscription
        create/
          create-ticket.component.ts
      admin/
        admin.routes.ts
        users/
        roles/
        queue/

  styles/
    globals.css                     # @import "tailwindcss"; @theme { ... }
```

---

## 10. Database Design (TypeORM)

### 10.1 Guiding Principles

- **No `synchronize: true` in any environment.** Migrations only.
- **No `autoLoadEntities: true` in app module** — entities are registered explicitly per module.
- All UUIDs use `gen_random_uuid()` (Postgres native).
- Soft deletes via `@DeleteDateColumn()` (`deleted_at`).
- All timestamps in UTC.
- All foreign keys have explicit `ON DELETE` behavior defined.
- Junction tables are explicit entities (no implicit many-to-many).
- The TypeORM `DataSource` in `database/data-source.ts` is the single CLI entrypoint.

### 10.2 Entity Relationship Overview

```
users ──< user_roles >── roles ──< role_permissions >── permissions

tickets >── messages
tickets ──< ai_results
tickets >── users (assignee_id, created_by)
messages >── users (sender_id, nullable for customer messages)
```

### 10.3 Entity Definitions

#### `users`

```sql
CREATE TABLE users (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,              -- bcrypt hash; NEVER returned in API
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ                         -- soft delete
);
```

#### `roles`

```sql
CREATE TABLE roles (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) UNIQUE NOT NULL,       -- SUPER_ADMIN, ADMIN, AGENT, VIEWER
  description  TEXT,
  is_system    BOOLEAN      NOT NULL DEFAULT false, -- system roles cannot be deleted
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

#### `permissions`

```sql
CREATE TABLE permissions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  resource     VARCHAR(100) NOT NULL,              -- tickets, messages, users, roles, ai
  action       VARCHAR(100) NOT NULL,              -- create, read, update, delete, assign
  description  TEXT,
  UNIQUE (resource, action)
);
```

#### `user_roles` (junction)

```sql
CREATE TABLE user_roles (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  role_id      UUID         NOT NULL REFERENCES roles(id)  ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  assigned_by  UUID         REFERENCES users(id)           ON DELETE SET NULL,
  UNIQUE (user_id, role_id)
);
```

#### `role_permissions` (junction)

```sql
CREATE TABLE role_permissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id        UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id  UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);
```

#### `tickets`

```sql
CREATE TABLE tickets (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT         NOT NULL,
  status       VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
                            -- OPEN | IN_PROGRESS | RESOLVED | CLOSED
  priority     VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
                            -- LOW | MEDIUM | HIGH | CRITICAL
  assignee_id  UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_by   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ                               -- soft delete
);

CREATE INDEX idx_tickets_status     ON tickets(status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_priority   ON tickets(priority)   WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assignee   ON tickets(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_created_by ON tickets(created_by) WHERE deleted_at IS NULL;
```

#### `messages`

```sql
CREATE TABLE messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id  UUID        REFERENCES users(id)            ON DELETE SET NULL,
  role       VARCHAR(50) NOT NULL,                       -- AGENT | CUSTOMER | AI
  content    TEXT        NOT NULL,
  is_ai      BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
```

#### `ai_results`

```sql
CREATE TABLE ai_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  job_type      VARCHAR(50) NOT NULL,  -- SUMMARIZE | DETECT_PRIORITY | SUGGEST_REPLY
  bull_job_id   VARCHAR(255),
  status        VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                            -- PENDING | PROCESSING | COMPLETED | FAILED
  result        TEXT,
  error_message TEXT,
  attempts      INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (ticket_id, job_type)         -- one active result per type per ticket
                                       -- upsert pattern on re-trigger
);

CREATE INDEX idx_ai_results_ticket_id  ON ai_results(ticket_id);
CREATE INDEX idx_ai_results_status     ON ai_results(status);
```

#### `refresh_tokens` (for JWT rotation & revocation)

```sql
CREATE TABLE refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,             -- bcrypt hash of refresh token
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

### 10.4 Migration Workflow

```bash
# Generate a new migration after entity changes:
pnpm --filter @app/api migration:generate -- src/database/migrations/AddTicketIndexes

# Run all pending migrations:
pnpm --filter @app/api migration:run

# Revert last migration:
pnpm --filter @app/api migration:revert
```

`data-source.ts` (TypeORM CLI config):
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,           // NEVER true
  migrationsRun: false,         // run via CLI explicitly
});
```

At **API startup**, `app.module.ts` runs pending migrations via `TypeOrmModule.forRootAsync` with `migrationsRun: true` — migrations execute once before the server accepts connections.

---

## 11. API Specification (OpenAPI / API-First)

### 11.1 API-First Rules

1. **Design the DTO first.** Every request body, query param, and response shape is a typed DTO class with `@ApiProperty()` decorators before any service code is written.
2. **Generate before you build.** After any DTO or controller signature change, run `pnpm sdk:gen` to regenerate `packages/api-sdk`.
3. **The spec is the contract.** Angular never hand-writes HTTP calls — it exclusively uses the Orval-generated SDK.
4. **Serve the spec.** `GET /api/openapi.json` returns the live OpenAPI 3.1 JSON document.

### 11.2 Global NestJS Bootstrap (`main.ts`)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Support Ticket API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve raw OpenAPI JSON
  app.use('/api/openapi.json', (_req, res) => res.json(document));

  // Serve Angular SPA (production only)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../../web/dist')));
    app.use('*', (_req, res) =>
      res.sendFile(join(__dirname, '../../web/dist/index.html'))
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
```

### 11.3 Complete Endpoint Registry

All routes are prefixed with `/api`.

#### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new user |
| `POST` | `/auth/login` | Public | Login; returns access + refresh tokens |
| `POST` | `/auth/refresh` | Cookie (refresh JWT) | Rotate access token |
| `POST` | `/auth/logout` | Bearer | Revoke refresh token |
| `GET` | `/auth/me` | Bearer | Current user + resolved permissions |

#### Users

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/users` | Bearer | `users:read` |
| `GET` | `/users/:id` | Bearer | `users:read` |
| `PATCH` | `/users/:id` | Bearer | `users:update` |
| `DELETE` | `/users/:id` | Bearer | `users:delete` |
| `PATCH` | `/users/:id/status` | Bearer | `users:update` |

#### Roles & Permissions

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/roles` | Bearer | `roles:read` |
| `POST` | `/roles` | Bearer | `roles:create` |
| `PATCH` | `/roles/:id` | Bearer | `roles:update` |
| `DELETE` | `/roles/:id` | Bearer | `roles:delete` |
| `GET` | `/permissions` | Bearer | `roles:read` |
| `POST` | `/roles/:id/permissions` | Bearer | `roles:update` |
| `POST` | `/users/:id/roles` | Bearer | `roles:assign` |
| `DELETE` | `/users/:id/roles/:roleId` | Bearer | `roles:assign` |

#### Tickets

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/tickets` | Bearer | `tickets:read` |
| `POST` | `/tickets` | Bearer | `tickets:create` |
| `GET` | `/tickets/:id` | Bearer | `tickets:read` |
| `PATCH` | `/tickets/:id` | Bearer | `tickets:update` |
| `DELETE` | `/tickets/:id` | Bearer | `tickets:delete` |

#### Messages

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/tickets/:ticketId/messages` | Bearer | `messages:read` |
| `POST` | `/tickets/:ticketId/messages` | Bearer | `messages:create` |

#### AI

| Method | Path | Auth | Permission |
|---|---|---|---|
| `POST` | `/ai/summarize` | Bearer | `ai:execute` |
| `POST` | `/ai/detect-priority` | Bearer | `ai:execute` |
| `POST` | `/ai/suggest-reply` | Bearer | `ai:execute` |
| `GET` | `/ai/results/:ticketId` | Bearer | `ai:read` |

#### SSE

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/sse/jobs/:jobId` | Bearer (query param token) | Long-lived SSE stream for job status |

#### Dashboard

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/dashboard/stats` | Bearer | `dashboard:read` |

#### Admin

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/admin/tickets` | Bearer | `admin:tickets` |
| `GET` | `/admin/users` | Bearer | `admin:users` |

#### OpenAPI

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/openapi.json` | Public | Serve live OpenAPI 3.1 JSON spec |
| `GET` | `/docs` | Public | Swagger UI |

### 11.4 Standard Response Envelope

All API responses follow a consistent shape:

```typescript
// Success
{
  "success": true,
  "data": { ... } | [ ... ],
  "meta": {             // present on paginated lists
    "total": 142,
    "page": 1,
    "limit": 20,
    "cursor": "..."
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket with ID ... was not found.",
    "statusCode": 404
  }
}
```

---

## 12. NestJS Backend Specification

### 12.1 Module Pattern (DRY / Modular Monolith)

Each domain module follows this invariant structure:

```
module.ts          imports, declares, exports
controller.ts      @Controller, @ApiTags, @ApiBearerAuth — thin HTTP adapter ONLY
service.ts         business logic, calls repository
repository.ts      TypeORM queries — no business logic, no HTTP concerns
entity.ts          TypeORM @Entity — schema definition
dto/               Request/Response DTOs — @ApiProperty on every field
```

**Cross-domain access rule:** Module A may only access Module B's data by importing `ModuleB` and injecting `ModuleB.service`. No direct access to another module's repository.

### 12.2 JWT Authentication — Custom (No Passport)

```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwtService.verify(token);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractToken(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
```

```typescript
// @Public() decorator — skips JwtAuthGuard
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### 12.3 Permission Guard

```typescript
// permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY, [context.getHandler(), context.getClass()]
    );
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    // user.permissions is resolved at login and embedded in JWT payload
    return required.every(p => user.permissions?.includes(p));
  }
}
```

```typescript
// @RequirePermissions() decorator
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Usage on controller method:
@Get()
@RequirePermissions('tickets:read')
findAll() { ... }
```

### 12.4 JWT Payload Shape

```typescript
interface JwtPayload {
  sub: string;           // user.id
  email: string;
  roles: string[];       // role names
  permissions: string[]; // e.g. ['tickets:read', 'tickets:create', 'ai:execute']
  iat: number;
  exp: number;
}
```

Permissions are resolved at login from the `role_permissions` table and embedded in the JWT to avoid a DB hit on every request. The token is short-lived (15 min), so stale permission data is bounded.

---

## 13. RBAC & Permission Matrix

### 13.1 System Roles

| Role | Description | Is System Role |
|---|---|---|
| `SUPER_ADMIN` | Unrestricted access; manages roles and permissions | Yes |
| `ADMIN` | Manages tickets across all agents; manages users | Yes |
| `AGENT` | Manages own tickets; executes AI actions | Yes |
| `VIEWER` | Read-only access to tickets and dashboard | Yes |

Custom roles can be created by `SUPER_ADMIN` from any combination of permissions.

### 13.2 Permissions Registry

Permissions follow the pattern `{resource}:{action}`.

| Resource | Actions | Description |
|---|---|---|
| `tickets` | `create`, `read`, `update`, `delete`, `assign` | Ticket CRUD + assignment |
| `messages` | `create`, `read` | Conversation thread |
| `ai` | `execute`, `read` | Trigger AI jobs + read results |
| `users` | `create`, `read`, `update`, `delete` | User management |
| `roles` | `create`, `read`, `update`, `delete`, `assign` | Role management |
| `dashboard` | `read` | Dashboard stats |
| `admin` | `tickets`, `users` | Admin panel access |

### 13.3 Default Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | AGENT | VIEWER |
|---|:---:|:---:|:---:|:---:|
| `tickets:create` | ✓ | ✓ | ✓ | — |
| `tickets:read` | ✓ | ✓ | ✓ | ✓ |
| `tickets:update` | ✓ | ✓ | ✓ | — |
| `tickets:delete` | ✓ | ✓ | — | — |
| `tickets:assign` | ✓ | ✓ | — | — |
| `messages:create` | ✓ | ✓ | ✓ | — |
| `messages:read` | ✓ | ✓ | ✓ | ✓ |
| `ai:execute` | ✓ | ✓ | ✓ | — |
| `ai:read` | ✓ | ✓ | ✓ | ✓ |
| `users:create` | ✓ | ✓ | — | — |
| `users:read` | ✓ | ✓ | — | — |
| `users:update` | ✓ | ✓ | self | — |
| `users:delete` | ✓ | — | — | — |
| `roles:create` | ✓ | — | — | — |
| `roles:read` | ✓ | ✓ | — | — |
| `roles:update` | ✓ | — | — | — |
| `roles:delete` | ✓ | — | — | — |
| `roles:assign` | ✓ | ✓ | — | — |
| `dashboard:read` | ✓ | ✓ | ✓ | ✓ |
| `admin:tickets` | ✓ | ✓ | — | — |
| `admin:users` | ✓ | ✓ | — | — |

### 13.4 Enforcement Layers

| Layer | How Enforced |
|---|---|
| Route layer | `@RequirePermissions()` + `PermissionsGuard` |
| Service layer | Ownership check — agents can only modify their own tickets |
| Repository layer | Scoped queries — agents only see their own tickets unless override |
| Angular directive | `*hasPermission="'tickets:update'"` hides UI elements |

---

## 14. Frontend Specification (Angular v21)

### 14.1 Bootstrap (Zoneless)

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withViewTransitions()),
    provideHttpClient(withInterceptors([
      jwtInterceptor,
      refreshInterceptor,
      errorInterceptor,
    ])),
    provideExperimentalZonelessChangeDetection(), // Zoneless
    provideAnimationsAsync(),
  ],
});
```

No `zone.js` in `angular.json` polyfills. All change detection triggered by Signals only.

### 14.2 Signals Usage Pattern

```typescript
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(null);
  private _isLoading = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  readonly userPermissions = computed(() =>
    this._currentUser()?.permissions ?? []
  );

  login(dto: LoginDto): Observable<void> {
    this._isLoading.set(true);
    return this.http.post<AuthResponse>('/api/auth/login', dto).pipe(
      tap(res => {
        this.tokenStore.set(res.accessToken);
        this._currentUser.set(res.user);
      }),
      map(() => void 0),
      finalize(() => this._isLoading.set(false)),
    );
  }
}
```

```typescript
// ticket-list.component.ts
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading()) {
      <app-spinner />
    } @else if (error()) {
      <app-error-message [message]="error()!" />
    } @else if (tickets().length === 0) {
      <app-empty-state message="No tickets found." />
    } @else {
      <app-ticket-table [tickets]="tickets()" />
    }
  `
})
export class TicketListComponent {
  private ticketSvc = inject(TicketService);

  tickets = this.ticketSvc.tickets;
  isLoading = this.ticketSvc.isLoading;
  error = this.ticketSvc.error;
}
```

### 14.3 Route Map

| Path | Component | Guard | Required Permission |
|---|---|---|---|
| `/login` | `LoginComponent` | `GuestGuard` | — |
| `/dashboard` | `DashboardComponent` | `AuthGuard` | `dashboard:read` |
| `/tickets` | `TicketListComponent` | `AuthGuard` | `tickets:read` |
| `/tickets/new` | `CreateTicketComponent` | `AuthGuard` | `tickets:create` |
| `/tickets/:id` | `TicketDetailComponent` | `AuthGuard` | `tickets:read` |
| `/admin` | `AdminShellComponent` | `AuthGuard` | `admin:tickets` |
| `/admin/users` | `AdminUsersComponent` | `AuthGuard` | `admin:users` |

### 14.4 TailwindCSS v4 — Corporate Theme

All styling is defined in `styles/globals.css` using TailwindCSS v4's `@theme` directive. No UI kit dependencies.

```css
/* apps/web/src/styles/globals.css */

@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Corporate Neutral Scale */
  --color-neutral-50:  #f8f9fa;
  --color-neutral-100: #f1f3f5;
  --color-neutral-200: #e9ecef;
  --color-neutral-300: #dee2e6;
  --color-neutral-400: #ced4da;
  --color-neutral-500: #adb5bd;
  --color-neutral-600: #868e96;
  --color-neutral-700: #495057;
  --color-neutral-800: #343a40;
  --color-neutral-900: #212529;
  --color-neutral-950: #0d0f10;

  /* Brand — Muted Blue (corporate / trustworthy) */
  --color-brand-50:  #eef3fb;
  --color-brand-100: #d5e3f6;
  --color-brand-200: #afc8ef;
  --color-brand-300: #7aa6e4;
  --color-brand-400: #4d83d9;
  --color-brand-500: #2563c7;     /* primary */
  --color-brand-600: #1d52a8;
  --color-brand-700: #18418a;
  --color-brand-800: #133170;
  --color-brand-900: #0e2457;
  --color-brand-950: #091540;

  /* Semantic Status */
  --color-success-500: #2d9d6e;
  --color-warning-500: #d08a00;
  --color-danger-500:  #c0392b;
  --color-info-500:    --color-brand-500;

  /* Priority */
  --color-priority-low:      #2d9d6e;
  --color-priority-medium:   #d08a00;
  --color-priority-high:     #c0392b;
  --color-priority-critical: #7b0a02;

  /* Spacing / Radius */
  --radius-sm:  0.25rem;
  --radius-md:  0.375rem;
  --radius-lg:  0.5rem;
  --radius-xl:  0.75rem;

  /* Shadows — flat corporate */
  --shadow-card:  0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06);
  --shadow-modal: 0 4px 24px 0 rgb(0 0 0 / 0.14);
}
```

### 14.5 AI Panel — SSE Subscription Pattern

```typescript
// ai-panel.component.ts
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class AiPanelComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  jobStatus = signal<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  result = signal<string | null>(null);

  triggerSummarize(ticketId: string): void {
    this.jobStatus.set('pending');
    this.result.set(null);

    // 1. Enqueue job via Orval-generated SDK
    this.aiApi.aiControllerSummarize({ ticketId }).subscribe(({ jobId }) => {
      // 2. Open SSE stream
      const token = this.auth.accessToken();
      const eventSource = new EventSource(
        `/api/sse/jobs/${jobId}?token=${token}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'completed') {
          this.result.set(data.result);
          this.jobStatus.set('completed');
          eventSource.close();
        } else if (data.status === 'failed') {
          this.jobStatus.set('failed');
          eventSource.close();
        }
      };
    });
  }
}
```

### 14.6 Permission Directive

```typescript
// permission.directive.ts
@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective {
  private auth = inject(AuthService);
  private vcr = inject(ViewContainerRef);
  private tpl = inject(TemplateRef);

  @Input() set hasPermission(permission: string) {
    if (this.auth.userPermissions().includes(permission)) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}

// Usage:
// <button *hasPermission="'tickets:delete'">Delete</button>
```

---

## 15. AI Integration Specification (LM Studio)

### 15.1 Model & Runtime

| Setting | Value |
|---|---|
| Runtime | LM Studio local server |
| Default URL | `http://localhost:1234` (configurable via `LMSTUDIO_URL`) |
| Model | `llama-3.1-8b-instruct` (GGUF, Q4_K_M recommended) |
| API | OpenAI-compatible: `POST /v1/chat/completions` |

LM Studio exposes an OpenAI-compatible API. This means the NestJS `AiService` can use any OpenAI-compatible HTTP client pointed at the local server.

### 15.2 LM Studio API Call

```typescript
// ai.service.ts
async callLmStudio(prompt: string, systemPrompt: string): Promise<string> {
  const response = await this.httpService.axiosRef.post(
    `${this.config.lmStudioUrl}/v1/chat/completions`,
    {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 512,
      stream: false,
    },
    { timeout: 30_000 }
  );
  return response.data.choices[0].message.content.trim();
}
```

### 15.3 Prompt Templates

#### Summarize

```
SYSTEM:
You are a concise customer support assistant. Respond only with a factual 
summary of the ticket. No preamble. No bullet points. 2–3 sentences only.

USER:
Ticket Title: {{title}}
Description: {{description}}

Conversation:
{{messages}}

Summarize this ticket in 2–3 sentences.
```

#### Detect Priority

```
SYSTEM:
You are a customer support triage bot. Respond with ONLY one word: 
LOW, MEDIUM, HIGH, or CRITICAL. No explanation. No punctuation.

USER:
Ticket Title: {{title}}
Description: {{description}}
Recent messages: {{last3Messages}}

What is the priority?
```

#### Suggest Reply

```
SYSTEM:
You are a professional, empathetic customer support agent. Write a reply 
to the customer's last message. Keep it under 100 words. Plain text only.
Do not include a subject line or signature.

USER:
Ticket context:
Title: {{title}}

Recent conversation:
{{last5Messages}}

Write a reply to the customer.
```

---

## 16. Async Patterns (BullMQ, Cron, SSE)

### 16.1 BullMQ Queue Architecture

Two queues are registered globally via the Redis module:

| Queue Name | Purpose |
|---|---|
| `ai-jobs` | AI summarize / priority / reply jobs |
| `notification-jobs` | Email dispatch jobs |

```typescript
// ai.module.ts
BullModule.registerQueue({ name: 'ai-jobs' })

// notifications.module.ts
BullModule.registerQueue({ name: 'notification-jobs' })
```

### 16.2 AI Worker

```typescript
@Processor('ai-jobs')
export class AiWorker extends WorkerHost {
  async process(job: Job<AiJobPayload>): Promise<void> {
    const { ticketId, jobType, resultId } = job.data;

    // Mark processing
    await this.aiRepo.updateStatus(resultId, AiJobStatus.PROCESSING);

    // Fetch context
    const ticket = await this.ticketRepo.findWithMessages(ticketId);
    const prompt  = buildPrompt(jobType, ticket);

    // Call LM Studio
    const result = await this.aiService.callLmStudio(prompt.user, prompt.system);

    // Persist
    await this.aiRepo.markCompleted(resultId, result);

    // Notify SSE subscribers
    this.sseService.emit(job.id, { status: 'completed', result });
  }
}
```

Worker retry config:

```typescript
defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
}
```

### 16.3 SSE Service

```typescript
@Injectable()
export class SseService {
  private subjects = new Map<string, Subject<MessageEvent>>();

  getStream(jobId: string): Observable<MessageEvent> {
    if (!this.subjects.has(jobId)) {
      this.subjects.set(jobId, new Subject());
    }
    return this.subjects.get(jobId)!.asObservable();
  }

  emit(jobId: string, data: object): void {
    this.subjects.get(jobId)?.next(
      { data: JSON.stringify(data) } as MessageEvent
    );
  }

  close(jobId: string): void {
    this.subjects.get(jobId)?.complete();
    this.subjects.delete(jobId);
  }
}
```

```typescript
// sse.controller.ts
@Get('jobs/:jobId')
@Sse()
stream(@Param('jobId') jobId: string): Observable<MessageEvent> {
  return this.sseService.getStream(jobId);
}
```

### 16.4 Cron Jobs

```typescript
// auto-close.cron.ts
@Injectable()
export class AutoCloseCron {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoCloseResolvedTickets(): Promise<void> {
    const cutoff = subDays(new Date(), 7);
    const closed = await this.ticketRepo.autoClose(cutoff);
    this.logger.log(`Auto-closed ${closed} stale resolved tickets`);
  }
}
```

---

## 17. Email (SMTP / Mailpit)

### 17.1 Transport

| Environment | SMTP Provider | Host | Port |
|---|---|---|---|
| Development | Mailpit (Docker) | `localhost` | `1025` |
| Production | Real SMTP (e.g. SendGrid, SES) | `SMTP_HOST` env | `587` |

### 17.2 NestJS Mailer Setup

```typescript
// app.module.ts
MailerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    transport: {
      host: config.get('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    },
    defaults: { from: '"Support System" <noreply@support.local>' },
    template: {
      dir: join(__dirname, 'modules/notifications/templates'),
      adapter: new HandlebarsAdapter(),
    },
  }),
  inject: [ConfigService],
}),
```

### 17.3 Notification Jobs

All emails are **enqueued to BullMQ** — never sent inline from the request cycle.

```typescript
// tickets.service.ts — on ticket assignment
await this.notificationsQueue.add('ticket-assigned', {
  to: assignee.email,
  ticketId: ticket.id,
  ticketTitle: ticket.title,
});

// notifications.processor.ts
@Process('ticket-assigned')
async sendTicketAssigned(job: Job<TicketAssignedPayload>) {
  await this.mailerService.sendMail({
    to: job.data.to,
    subject: `New ticket assigned: ${job.data.ticketTitle}`,
    template: 'ticket-assigned',
    context: job.data,
  });
}
```

---

## 18. Redis Module (Global)

A single, global `RedisModule` owns all Redis concerns. No other module may instantiate a Redis client directly.

### 18.1 Module Structure

```typescript
// redis.module.ts
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          lazyConnect: false,
        }),
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
```

### 18.2 RedisService Responsibilities

| Responsibility | Method |
|---|---|
| Generic key-value cache | `get(key)`, `set(key, value, ttl)`, `del(key)` |
| Refresh token store | `storeRefreshToken(userId, tokenHash, ttl)`, `isTokenRevoked(hash)` |
| Revoke token | `revokeToken(tokenHash)` |
| SSE job state | `setJobStatus(jobId, status)`, `getJobStatus(jobId)` |

BullMQ uses a separate `ioredis` instance created internally by `BullModule.forRootAsync` — this is acceptable because BullMQ manages its own connection pool. The `RedisModule` is for application-level cache/session, not queue internals.

---

## 19. SDK Generation & Sync Workflow (Orval)

### 19.1 Philosophy

The Angular app **never writes raw HTTP calls**. Every API interaction goes through the Orval-generated SDK in `packages/api-sdk`. The SDK is the contract boundary.

### 19.2 Orval Configuration

```typescript
// apps/api/orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  supportApi: {
    input: {
      target: 'http://localhost:3000/api/openapi.json',
    },
    output: {
      target: '../../packages/api-sdk/src/generated',
      client: 'angular',
      mode: 'tags-split',       // one file per OpenAPI tag
      mock: true,               // generate MSW mocks for testing
      override: {
        mutator: {
          path: '../../packages/api-sdk/src/http-client.ts',
          name: 'customAxios',
        },
      },
    },
  },
});
```

### 19.3 SDK Generation Workflow

```bash
# 1. Start the API (generates live spec)
pnpm dev:api

# 2. Generate SDK (run from repo root)
pnpm sdk:gen

# This executes:
# → GET http://localhost:3000/api/openapi.json  (export spec)
# → orval --config apps/api/orval.config.ts     (generate SDK)

# 3. SDK is output to packages/api-sdk/src/generated/
# 4. Commit generated files — SDK changes are visible in PR diff
```

### 19.4 Mandatory SDK Sync Trigger Points

The following changes **always require** running `pnpm sdk:gen` before the PR:

- Any new controller endpoint added
- Any DTO field added, renamed, or removed
- Any new enum value in a response
- Any path parameter or query param changed
- Any HTTP status code change

### 19.5 Orval Mocks in Angular Tests

```typescript
// tickets.service.spec.ts
import { ticketsControllerFindAllMock } from '@pkg/api-sdk/mocks';

describe('TicketService', () => {
  it('should load tickets', () => {
    const mockResponse = ticketsControllerFindAllMock();
    // ... test with mock data
  });
});
```

---

## 20. Testing Strategy

### 20.1 Testing Pyramid

```
                 ┌─────┐
                 │ E2E │  Testcontainers (real Postgres + Redis)
                ┌┴─────┴┐
                │  INT  │  NestJS test module, real service + repo
               ┌┴───────┴┐
               │  UNIT   │  Pure service logic, prompt builders, guards
              └───────────┘
```

### 20.2 API Testing (Vitest)

**Unit tests** — pure functions, prompt builders, guards:

```typescript
// summarize.prompt.spec.ts
import { describe, it, expect } from 'vitest';
import { buildSummarizePrompt } from './summarize.prompt';

describe('buildSummarizePrompt', () => {
  it('includes ticket title and last 5 messages', () => {
    const prompt = buildSummarizePrompt(mockTicket, mockMessages);
    expect(prompt.user).toContain(mockTicket.title);
  });
});
```

**Integration tests** — NestJS test module with real repositories:

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([User]), JwtModule.register({ secret: 'test' })],
      providers: [AuthService, UsersRepository],
    }).compile();
    service = module.get(AuthService);
  });

  it('should hash password on register', async () => {
    const user = await service.register(registerDto);
    expect(user.password).not.toBe(registerDto.password);
  });
});
```

**E2E tests** — Testcontainers (real Postgres + Redis):

```typescript
// tickets.e2e.spec.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer }      from '@testcontainers/redis';

describe('Tickets E2E', () => {
  let pg: StartedPostgreSqlContainer;
  let redis: StartedRedisContainer;
  let app: INestApplication;

  beforeAll(async () => {
    pg    = await new PostgreSqlContainer().start();
    redis = await new RedisContainer().start();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(DATABASE_CONFIG)
    .useValue({ url: pg.getConnectionUri() })
    .overrideProvider(REDIS_CONFIG)
    .useValue({ url: redis.getConnectionUrl() })
    .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pg.stop();
    await redis.stop();
  });

  it('POST /api/tickets creates a ticket', async () => {
    const token = await loginAndGetToken(app);
    const res   = await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test ticket', description: 'Test description' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test ticket');
  });
});
```

### 20.3 Angular Testing (Vitest + Orval Mocks)

```typescript
// ticket-list.component.spec.ts
import { render, screen } from '@testing-library/angular';
import { ticketsControllerFindAllMock } from '@pkg/api-sdk/mocks';

it('renders ticket titles', async () => {
  const mock = ticketsControllerFindAllMock({ data: [{ title: 'Broken login' }] });
  await render(TicketListComponent, {
    providers: [{ provide: TicketService, useValue: { tickets: signal(mock.data) } }],
  });
  expect(screen.getByText('Broken login')).toBeTruthy();
});
```

### 20.4 Vitest Configuration (`vitest.config.ts`)

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e.spec.ts'],
    setupFiles: ['test/setup.ts'],
    testTimeout: 60_000, // E2E with Testcontainers needs more time
  },
});
```

---

## 21. Security Requirements

| ID | Requirement |
|---|---|
| SEC-01 | Passwords hashed with bcrypt, cost factor ≥ 12 |
| SEC-02 | Access JWT expires in 15 minutes, signed with `JWT_ACCESS_SECRET` |
| SEC-03 | Refresh JWT expires in 7 days, signed with `JWT_REFRESH_SECRET` (different key) |
| SEC-04 | Refresh tokens stored as hashed values in DB; Redis blacklist for revocation |
| SEC-05 | All TypeORM queries use parameterized inputs — no string concatenation |
| SEC-06 | CORS configured to `CORS_ORIGIN` env var only |
| SEC-07 | `.env` files are gitignored; `.env.example` is committed |
| SEC-08 | `password` field uses `@Exclude()` on the User entity; `ClassSerializerInterceptor` enforced globally |
| SEC-09 | Admin and Super Admin routes enforce `@RequirePermissions()` server-side; frontend guards are supplementary only |
| SEC-10 | Rate limiting on `POST /api/auth/login` and `POST /api/auth/register` via `@nestjs/throttler` |
| SEC-11 | Helmet middleware for HTTP security headers |
| SEC-12 | LM Studio URL is never exposed to the frontend |

---

## 22. Deployment & Infrastructure

### 22.1 Docker Compose (Development)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: support_tickets
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"    # SMTP
      - "8025:8025"    # Web UI at http://localhost:8025

  # LM Studio runs as a desktop app — not a Docker service.
  # Ensure LM Studio is running locally and load your model before starting.
  # Default URL: http://localhost:1234

volumes:
  postgres_data:
  redis_data:
```

### 22.2 Environment Variables

**`apps/api/.env`**
```dotenv
# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/support_tickets

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=dev-access-secret-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# LM Studio
LMSTUDIO_URL=http://localhost:1234
LMSTUDIO_MODEL=llama-3.1-8b-instruct

# SMTP (Mailpit in dev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@support.local
```

**`apps/web/.env`**
```dotenv
# Angular uses the API base via proxy in dev; no VITE_ variables
# Proxy config in proxy.conf.json routes /api/* to http://localhost:3000
```

### 22.3 Angular Dev Proxy (`apps/web/proxy.conf.json`)

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### 22.4 Production Build & Serve

```bash
# Build Angular SPA into apps/api/dist/client
pnpm build:web

# Copy web dist into api's static serve path
# (configured via ServeStaticModule in AppModule)

# Build and start API
pnpm build:api
pnpm start

# Single process, single port:
# GET /         → Angular SPA index.html
# GET /api/*    → NestJS REST handlers
# GET /api/sse/* → SSE handlers
```

---

## 23. Milestones & Build Order

### Phase 1 — Foundation (Days 1–3)

- [ ] PNPM monorepo scaffold (`apps/api`, `apps/web`, `packages/types`, `packages/api-sdk`)
- [ ] Docker Compose up (Postgres, Redis, Mailpit)
- [ ] NestJS app scaffold: global prefix, validation pipe, exception filter, Helmet
- [ ] TypeORM `DataSource` + first migration (users table)
- [ ] `@nestjs/swagger` wired + `/api/openapi.json` endpoint live
- [ ] Angular scaffold: Zoneless bootstrap, router, TailwindCSS v4 theme

### Phase 2 — Auth & RBAC (Days 4–7)

- [ ] Migrations: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`
- [ ] `AuthModule`: register, login, refresh, logout, `/auth/me`
- [ ] `JwtAuthGuard` + `PermissionsGuard` + decorators
- [ ] `RolesModule`: CRUD + permission assignment
- [ ] Seed: default roles + permission matrix + admin user
- [ ] Angular: Login page, `AuthService`, JWT interceptor, refresh interceptor, `AuthGuard`
- [ ] **Run `pnpm sdk:gen` — first SDK generation**

### Phase 3 — Tickets & Messages (Days 8–11)

- [ ] Migrations: `tickets`, `messages`
- [ ] `TicketsModule`: full CRUD, ownership scoping, status transitions
- [ ] `MessagesModule`: thread per ticket
- [ ] Angular: ticket list (filter/search), ticket detail, create ticket, message thread + reply input
- [ ] **Run `pnpm sdk:gen` — sync ticket + message endpoints**

### Phase 4 — AI Integration (Days 12–16)

- [ ] Migration: `ai_results`
- [ ] `RedisModule` global setup
- [ ] `AiModule`: BullMQ worker, LM Studio HTTP client, 3 job types, SSE emission
- [ ] `SseModule`: stream controller + service
- [ ] Angular: AI panel with SSE subscription, Signals-based job state
- [ ] **Run `pnpm sdk:gen` — sync AI endpoints**

### Phase 5 — Notifications & Cron (Days 17–18)

- [ ] `NotificationsModule`: BullMQ processor, Handlebars templates, Mailpit verification
- [ ] `CronModule`: auto-close job + cleanup job

### Phase 6 — Dashboard & Admin (Days 19–20)

- [ ] `DashboardModule`: scoped stats endpoint
- [ ] Angular: dashboard page, admin panel (user list, ticket queue)
- [ ] **Final `pnpm sdk:gen` — all endpoints synced**

### Phase 7 — Testing & Polish (Days 21–25)

- [ ] Vitest unit tests: auth service, prompt builders, guards
- [ ] Testcontainers e2e: auth flow, ticket CRUD, AI job enqueue
- [ ] Angular Vitest + Orval mock tests: ticket list, AI panel
- [ ] Production build validation (`pnpm build && pnpm start`)
- [ ] README: architecture diagram, setup guide, demo walkthrough
- [ ] Seed data polished for demo

---

## 24. Open Questions & Risks

| # | Topic | Status | Decision / Note |
|---|---|---|---|
| 1 | **LM Studio inference speed on CPU** | Risk | Q4_K_M quantization is mandatory. On CPU-only machines, inference may exceed 15s. Document this expectation in README. |
| 2 | **Refresh token storage: Redis vs DB** | Decided | DB (`refresh_tokens` table) is the source of truth. Redis is used only for revocation blacklist (fast lookup). Both are checked on refresh. |
| 3 | **SSE reconnection handling in Angular** | Open | `EventSource` auto-reconnects. Need to handle stale `jobId` gracefully if the page is refreshed mid-job. |
| 4 | **TypeORM migrations in CI** | Open | Testcontainers will run `migrationsRun: true` automatically. Verify migration files are always up to date. |
| 5 | **BullMQ dashboard** | Could Have | Bull Board (`@bull-board/nestjs`) can be mounted at `/api/admin/queues` for visual job monitoring. Good demo talking point. |
| 6 | **Orval `angular` client mode vs `axios`** | Decided | Use `angular` mode to generate `HttpClient`-based services native to Angular's DI. Avoids Axios in the frontend. |
| 7 | **Monorepo shared types vs full OpenAPI sync** | Decided | `packages/types` holds shared enums only. All DTO shapes come from Orval-generated SDK — not hand-maintained. |
| 8 | **Rate limiting scope** | Decided | `@nestjs/throttler` applied only to auth endpoints in Phase 1. Global throttling is a future hardening step. |
| 9 | **Angular SSR** | Won't Have | SPA-only. NestJS serves the `index.html` with `ServeStaticModule`; Angular handles client-side routing. |
| 10 | **`UNIQUE (ticket_id, job_type)` on `ai_results`** | Decided | Upsert on re-trigger — avoids orphaned rows and keeps the result panel simple. |

---

*Document maintained by the project author. Version history tracked in Git. Always re-run `pnpm sdk:gen` after any API contract change.*



