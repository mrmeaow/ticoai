<div align="center">

# TICOAI

**AI-Powered Customer Support Ticket System**

[![API CI](https://github.com/ticoai/ticoai/actions/workflows/api-ci.yml/badge.svg)](https://github.com/ticoai/ticoai/actions/workflows/api-ci.yml)
[![Web CI](https://github.com/ticoai/ticoai/actions/workflows/web-ci.yml/badge.svg)](https://github.com/ticoai/ticoai/actions/workflows/web-ci.yml)
[![E2E Report](https://github.com/ticoai/ticoai/actions/workflows/e2e-report.yml/badge.svg)](https://ticoai.github.io/ticoai/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

**[View E2E Test Report](https://ticoai.github.io/ticoai/)** | **[API Documentation](https://ticoai-dev.onrender.com/api/docs)** | **[Technical Docs](./docs/)**

</div>

---

## Overview

TICOAI is a full-stack AI-powered customer support ticket management system featuring:

- **NestJS API** - RESTful backend with PostgreSQL, Redis, and AI integration
- **Angular Web App** - Modern SPA with real-time updates and AI-assisted workflows
- **AI Integration** - LM Studio integration for intelligent ticket classification and response suggestions

![Dashboard](./docs/screenshots/dashboard.png)
*Dashboard view - manage tickets with AI assistance*

---

## Architecture

```
ticoai/
├── apps/
│   ├── api/          # NestJS Backend API
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (auth, tickets, users, AI)
│   │   │   ├── database/     # TypeORM entities & migrations
│   │   │   └── common/       # Shared guards, decorators, filters
│   │   └── test/             # E2E tests with testcontainers
│   │
│   └── web/          # Angular Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── features/  # Feature components (auth, tickets, dashboard)
│       │   │   ├── shared/    # Reusable components & services
│       │   │   └── core/      # Auth guards, interceptors
│       │   └── environments/
│       └── e2e/               # Playwright E2E tests
│
├── packages/
│   ├── api-sdk/      # Generated API client SDK
│   └── types/        # Shared TypeScript types
│
└── docker-compose.yml  # Local development services
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS, TypeORM, PostgreSQL |
| **Frontend** | Angular 21, TailwindCSS, RxJS |
| **Queue/Caching** | Redis, BullMQ |
| **AI** | LM Studio (local LLM) |
| **Testing** | Jest, Vitest, Playwright, Testcontainers |
| **Infrastructure** | Docker, GitHub Actions |

---

## Quick Start

### Prerequisites

- **Node.js** >= 22.0.0 (see `.node-version`)
- **pnpm** >= 9.0.0
- **Docker** (for PostgreSQL, Redis, Mailpit)

### Installation

```bash
# Clone repository
git clone https://github.com/ticoai/ticoai.git
cd ticoai

# Install dependencies
pnpm install

# Start services (PostgreSQL, Redis, Mailpit)
docker compose up -d

# Copy environment variables
cp .env.example .env

# Initialize database
pnpm db:init

# Build shared packages
pnpm build:types
pnpm build:sdk
```

### Development

```bash
# Start all services (API + Web) concurrently
pnpm dev

# Or start individually
pnpm dev:api   # API at http://localhost:3000
pnpm dev:web   # Web at http://localhost:4200
```

**Default credentials after seed:**
- Admin: `admin@ticoai.local` / `admin123`
- Agent: `agent@ticoai.local` / `agent123`
- User: `user@ticoai.local` / `user123`

---

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# API unit tests with coverage
pnpm --filter @app/api test:cov

# Web unit tests
pnpm --filter @app/web test
```

### E2E Tests

```bash
# API E2E tests (uses testcontainers)
pnpm --filter @app/api test:e2e

# Web E2E tests (Playwright)
pnpm --filter @app/web test:e2e

# Interactive UI mode (recommended for development)
pnpm --filter @app/web test:e2e:ui

# Debug mode with browser visible
pnpm --filter @app/web test:e2e:debug
```

### E2E Test Report

After running Playwright tests, view the HTML report:

```bash
# Open HTML report
pnpm --filter @app/web e2e:report

# Or view directly
open apps/web/playwright-report/index.html
```

**Report features:**
- **Timeline** - Visual test duration bars
- **Trace Viewer** - Step-by-step execution replay with DOM snapshots
- **Screenshots** - Captured on failure (CI) or every test (local)
- **Videos** - Full recording of failed test runs

---

## CI/CD Pipeline

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **API CI** | PR to `main`, Push to `dev` | Unit tests, E2E tests, Lint |
| **Web CI** | PR to `main`, Push to `dev` | Unit tests, Playwright E2E, Build |
| **E2E Report** | After Web CI success | Deploy report to GitHub Pages |

### Branch Strategy

```
main ─────────────────────────────────────────────────
  ↑ PR (triggers CI)
  │
dev ──────────────────────────────────────────────────
  ↑ Push (triggers CI)
  │
feature-* ────────────────────────────────────────────
```

### View Test Reports

After CI runs, download artifacts:

1. Go to **Actions** → Select workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `playwright-report` - Full HTML report
   - `playwright-test-results` - Screenshots & videos

Or view the **deployed report**: [https://ticoai.github.io/ticoai/](https://ticoai.github.io/ticoai/)

---

![Login Flow](./docs/screenshots/login_flow.png)
![Create Ticket](./docs/screenshots/create_ticket.png)


---

## API Documentation

When the API server is running, access Swagger docs at:

```
http://localhost:3000/api/docs
```

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login |
| `POST /api/auth/register` | User registration |
| `GET /api/tickets` | List tickets |
| `POST /api/tickets` | Create ticket |
| `GET /api/tickets/:id` | Get ticket details |
| `POST /api/tickets/:id/messages` | Add message to ticket |
| `POST /api/ai/suggest` | Get AI response suggestion |

---

## Environment Variables

See `.env.example` for all options. Key variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=ticoai
DB_PASSWORD=ticoai_secret
DB_DATABASE=ticoai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AI (LM Studio)
LMSTUDIO_URL=http://localhost:1234
LMSTUDIO_MODEL="local-model"
```

---

## Project Structure Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in parallel |
| `pnpm dev:api` | Start API server only |
| `pnpm dev:web` | Start Web app only |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed initial data |
| `pnpm sdk:gen` | Regenerate API SDK |

---

## Contributing

1. Create feature branch from `dev`
2. Make changes with tests
3. Run tests locally: `pnpm test && pnpm --filter @app/web test:e2e`
4. Push to `dev` (triggers CI)
5. Create PR to `main`

### Code Quality

- **Linting**: ESLint + Prettier
- **Type Safety**: Strict TypeScript
- **Testing**: >80% coverage target

---

## Documentation

- [Constitution](./docs/CONSTITUTION.md) - Project principles and standards
- [Development Plan](./docs/PLAN.md) - Implementation phases
- [LM Studio Setup](./docs/LM_Studio.md) - AI integration guide
- [Test Audit](./docs/TEST-AUDIT.md) - Testing strategy

---

## License

[**MIT** Licensed](./LICENSE)
