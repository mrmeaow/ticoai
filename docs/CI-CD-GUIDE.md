# CI/CD & E2E Testing Guide

Comprehensive guide for TICOAI's CI/CD pipeline, Playwright E2E testing, and local testing strategies.

---

## Table of Contents

- [CI/CD Overview](#cicd-overview)
- [Workflows](#workflows)
- [E2E Test Reports](#e2e-test-reports)
- [Testing CI Locally](#testing-ci-locally)
- [Manual Test Execution](#manual-test-execution)
- [Troubleshooting](#troubleshooting)

---

## CI/CD Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Trigger: PR to main OR Push to dev                      │   │
│  │                                                          │   │
│  │  ┌─────────────┐     ┌───────────────┐                   │   │
│  │  │   API CI    │────▶│ Unit Tests    │                   │   │
│  │  │             │     │ E2E Tests     │                   │   │
│  │  │             │     │ Lint          │                   │   │
│  │  └─────────────┘     └───────────────┘                   │   │
│  │                                                          │   │
│  │  ┌─────────────┐     ┌───────────────┐                   │   │
│  │  │   Web CI    │────▶│ Unit Tests    │                   │   │
│  │  │             │     │ Playwright E2E│                   │   │
│  │  │             │     │ Lint          │                   │   │
│  │  └──────┬──────┘     └───────────────┘                   │   │
│  │         │                                                │   │
│  └─────────┼────────────────────────────────────────────────┘   │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────────┐                                       │
│  │  E2E Report         │                                       │
│  │  (After Web CI)     │                                       │
│  └──────────┬──────────┘                                       │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │   GitHub Pages      │                                       │
│  │   HTML Report       │                                       │
│  └─────────────────────┘                                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  External: Render PaaS                                   │   │
│  │  - Builds API + Web                                      │   │
│  │  - Deploys to production                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow Triggers

| Workflow | PR to `main` | PR to `dev` | Manual |
|----------|:-------------:|:-------------:|:------:|
| API CI   | ✅ | ✅ | ❌ |
| Web CI   | ✅ | ✅ | ❌ |
| E2E Report | ✅ (push) | ✅ (push) | ✅ |

### CI Philosophy

> **CI validates code. Render deploys.**

- **CI's job:** Run tests, lint, verify code quality
- **Not CI's job:** Build for production, deploy to servers
- **Render's job:** Build and deploy (handles builds automatically)

---

## Workflows

### 1. API CI (`.github/workflows/api-ci.yml`)

**Purpose:** Validate API code quality through tests and linting.

**Triggers:**
- Pull request to `main` branch
- Pull request to `dev` branch

**Jobs:**

| Job | Services | Description |
|-----|----------|-------------|
| `api-unit-tests` | Redis | Runs Jest unit tests |
| `api-e2e-tests` | PostgreSQL, Redis | Runs E2E tests with real database |
| `api-lint` | None | Runs ESLint (non-blocking) |

**Environment Variables:**
```yaml
NODE_ENV: test
DB_HOST: localhost
DB_PORT: 5432
DB_USERNAME: ticoai
DB_PASSWORD: ticoai_secret
DB_DATABASE: ticoai_test
REDIS_HOST: localhost
REDIS_PORT: 6379
JWT_SECRET: test-jwt-secret-ci
```

**Artifacts:**
- `api-coverage` - Unit test coverage (7 days retention)
- `api-e2e-coverage` - E2E test coverage (7 days retention)

---

### 2. Web CI (`.github/workflows/web-ci.yml`)

**Purpose:** Validate Web frontend through tests, Playwright E2E, and linting.

**Triggers:**
- Pull request to `main` branch
- Pull request to `dev` branch

**Jobs:**

| Job | Services | Description |
|-----|----------|-------------|
| `web-unit-tests` | None | Runs Vitest unit tests |
| `web-e2e-tests` | PostgreSQL, Redis | Runs Playwright E2E tests |
| `web-lint` | None | Runs Angular build (lint equivalent) |

**Note:** Build verification is **not** included because Render handles production builds.

**Important:** The `web-e2e-tests` job:
1. Builds shared packages (types, sdk)
2. Builds Angular web application (for testing only)
3. Runs API migrations and seeds
4. Starts API server (via Playwright's `webServer` config)
5. Installs Chromium
6. Runs Playwright tests
7. Uploads report as artifact

**Artifacts:**
- `web-coverage` - Unit test coverage (7 days retention)
- `playwright-report` - HTML report (30 days retention)
- `playwright-test-results` - Screenshots & videos (30 days retention)

---

### 3. E2E Report (`.github/workflows/e2e-report.yml`)

**Purpose:** Deploy Playwright HTML report to GitHub Pages for team viewing.

**Trigger:**
- Automatically after Web CI completes (both `main` and `dev`)
- `workflow_dispatch` - Manual trigger

**How it works:**
1. Downloads `playwright-report` artifact from Web CI
2. Deploys to GitHub Pages

**Jobs:**

| Job | Description |
|-----|-------------|
| `deploy-report` | Downloads artifact and deploys to GitHub Pages |

**GitHub Pages Setup:**
1. Go to Repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Workflow will auto-deploy to `https://<org>.github.io/<repo>/`

---

## Branch Strategy & CI Flow

```
feature/* ──▶ dev ──▶ main ──▶ Render (production)
                  │       │
                  │       └──▶ PR checks run
                  │           API CI + Web CI
                  │           E2E Report deploys
                  │
                  └──▶ Push checks run
                      API CI + Web CI
                      E2E Report deploys
```

### What runs on each event:

| Event | API CI | Web CI | E2E Report | Render Deploy |
|-------|:------:|:------:|:----------:|:-------------:|
| PR to `main` | ✅ | ✅ | ✅ | ❌ (on merge) |
| Merge to `main` | ❌ | ❌ | ❌ | ✅ |
| Push to `dev` | ✅ | ✅ | ✅ | ❌ |

---

## E2E Test Reports

### Accessing Reports

#### Option 1: Download from CI

1. Go to **Actions** tab
2. Select the workflow run
3. Scroll to **Artifacts** section
4. Download:
   - `playwright-report` - Interactive HTML report
   - `playwright-test-results` - Screenshots & videos

#### Option 2: GitHub Pages (Deployed Report)

After E2E Report workflow runs:
```
https://<your-org>.github.io/<repo-name>/
```

### Report Features

#### HTML Report

The Playwright HTML report includes:

| Feature | Description |
|---------|-------------|
| **Test List** | All tests with status (passed/failed/skipped) |
| **Timeline** | Visual representation of test duration |
| **Filtering** | Filter by project, status, file, or search |
| **Trace Links** | Direct link to trace viewer for each test |

#### Trace Viewer

Each test has an associated trace file. Click the trace icon to open:

```
┌─────────────────────────────────────────────────────────────┐
│ Timeline │ Metadata │ Console │ Network │ Source            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▶ Click any action to see DOM state at that moment        │
│  📸 Screenshots at each action step                        │
│  🖱️ Hover elements to see selectors                        │
│  🌐 Network requests with responses                        │
│  📝 Console logs from the test                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Test Artifacts

Each test produces:

| File | Description |
|------|-------------|
| `test-finished-*.png` | Final screenshot |
| `video.webm` | Full test video (on failure or retry) |
| `trace.zip` | Interactive trace |
| `console-logs.txt` | Console output |

---

## Testing Locally

### Direct Commands (Recommended)

Run the same commands locally that CI runs:

#### API Tests

```bash
# Unit tests
cd apps/api
pnpm test

# E2E tests (requires Docker for testcontainers)
cd apps/api
pnpm test:e2e

# Lint
cd apps/api
pnpm lint
```

#### Web Tests

```bash
# Unit tests
cd apps/web
pnpm test

# E2E tests (requires API + database)
docker compose up -d
pnpm dev:api &
cd apps/web
pnpm test:e2e

# Build verification
cd apps/web
pnpm build
```

#### Full CI Simulation

```bash
# 1. Start services
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Build shared packages
pnpm build:types
pnpm build:sdk

# 4. Run API tests
pnpm --filter @app/api test
pnpm --filter @app/api test:e2e
pnpm --filter @app/api lint

# 5. Run Web tests (no production build - Render handles that)
pnpm --filter @app/web test
pnpm --filter @app/web test:e2e

# 6. View E2E report
pnpm --filter @app/web e2e:report
```

---

### Option 3: Using Docker Compose

Create a test-specific compose file:

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ticoai
      POSTGRES_PASSWORD: ticoai_secret
      POSTGRES_DB: ticoai_test
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ticoai"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
```

Then run:

```bash
# Start test services
docker compose -f docker-compose.test.yml up -d

# Run tests
NODE_ENV=test pnpm test

# Cleanup
docker compose -f docker-compose.test.yml down
```

---

## Manual Test Execution

### Quick Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all unit tests |
| `pnpm --filter @app/api test` | Run API unit tests |
| `pnpm --filter @app/web test` | Run Web unit tests |
| `pnpm --filter @app/api test:e2e` | Run API E2E tests |
| `pnpm --filter @app/web test:e2e` | Run Web Playwright tests |
| `pnpm --filter @app/web test:e2e:ui` | Run with Playwright UI mode |
| `pnpm --filter @app/web test:e2e:debug` | Debug mode with browser |
| `pnpm --filter @app/web e2e:report` | Open HTML report |

### Playwright UI Mode

For interactive test development:

```bash
cd apps/web
pnpm test:e2e:ui
```

Features:
- Click any test to watch it run live
- See DOM snapshots at each step
- Inspect network requests
- Run tests in specific order
- Filter and search tests

### Playwright Debug Mode

For step-by-step debugging:

```bash
cd apps/web
pnpm test:e2e:debug
```

Opens browser with:
- Pause at each action
- Inspect elements
- Step through code
- View console logs

---

## Troubleshooting

### Common Issues

#### 1. E2E Tests Fail Locally but Pass in CI

**Cause:** Different environment or timing.

**Solution:**
```bash
# Ensure fresh install
rm -rf node_modules
pnpm install

# Reset database
docker compose down
docker compose up -d
pnpm db:init
```

#### 2. Playwright Browser Installation Fails

**Solution:**
```bash
# Clear Playwright cache
rm -rf ~/.cache/ms-playwright

# Reinstall
cd apps/web
pnpm exec playwright install --with-deps chromium
```

#### 3. CI Takes Too Long

**Optimization:**
- Enable caching (already configured)
- Use `--frozen-lockfile` for faster installs
- Run tests in parallel where possible

#### 5. Tests Flaky in CI

**Solutions:**
```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env['CI'] ? 2 : 0,  // Already set
  timeout: 60_000,  // Increase timeout
});
```

### Debugging CI Failures

1. **Check workflow logs:**
   - Go to Actions tab
   - Click failed workflow
   - Expand failed step

2. **Download artifacts:**
   - Screenshots show final state
   - Videos show full test execution
   - Traces show step-by-step replay

3. **Reproduce locally:**
   ```bash
   # Match CI environment
   CI=true pnpm test:e2e
   ```

---

## Appendix

### GitHub Secrets

E2E Report deployment uses GitHub Pages (no secrets required).

### Useful Links

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Render Documentation](https://docs.render.com)
- [Conventional Commits](https://www.conventionalcommits.org/)
