# TICOAI - Phase-Driven Development Plan

**Project:** AI-Powered Customer Support Ticket System  
**Root Branch:** `dev`  
**Planning Approach:** Phase-driven with GitHub Milestones and Issues

---

## Overview

This document outlines the phase-driven development approach for TICOAI. Each phase corresponds to a GitHub Milestone. Issues are created **just-in-time** when starting work on a phase, not in advance.

### Workflow

1. **Phase Selection:** When starting work on a phase, create detailed GitHub issues for all tasks in that phase
2. **Issue Creation:** Use GitHub CLI (`gh`) to create issues with detailed descriptions
3. **Branching:** For each issue, create a branch from `dev` using the pattern: `{issue-number}-dev-ticket-{issue-number}-{feature-name}`
4. **Development:** Complete the task, commit, and push
5. **Verification:** Manually verify the implementation
6. **Loop:** Continue to the next issue

---

## Phases & Milestones

### PHASE 1 - Foundation and Auth System Standby Readiness ✅

**Milestone:** `PHASE 1 - Foundation and Auth. system standby readiness`  
**Due Date:** March 28, 2026  
**Status:** **COMPLETE** (100%)

| # | Title | Status |
|---|-------|--------|
| 1 | [Foundation] Staging first-foundation-draft into dev | ✅ Closed |
| 3 | [Phase 1 Complete] Foundation and Auth System Standby Readiness | ✅ Closed |

**Completed Work:**
- PNPM monorepo structure established
- NestJS API scaffolding with modular architecture
- Angular v21 SPA scaffolding with Zoneless/Signals
- PostgreSQL + TypeORM with migrations
- Redis module for cache/session/queue
- BullMQ queue registration (ai-jobs, notifications)
- AI Processor with LM Studio integration
- JWT authentication (custom, no Passport)
- RBAC foundation with roles and permissions
- Permission guards with matrix enforcement
- Docker Compose for infrastructure
- Database seed script with default data
- Auth guards and HTTP interceptors (frontend)

---

### PHASE 2 - Rapid Implementations as First Draft 🚧

**Milestone:** `PHASE 2 - RAPID IMPLEMENTATIONS AS FIRST DRAFT`  
**Due Date:** March 30, 2026  
**Status:** **IN PROGRESS** (0%)

**Goal:** Implement core functional features as working first drafts. Focus on functionality over polish.

#### Backend Tickets

| # | Ticket | Description | Priority |
|---|--------|-------------|----------|
| 4 | [API] Complete Tickets Repository with Filtering and Pagination | Enhance tickets.repository.ts with comprehensive query support | High |
| 5 | [API] Complete Dashboard Module with Stats Aggregation | Implement dashboard.service.ts with stats aggregation | Medium |
| 6 | [API] Implement SSE Streaming for AI Job Status | Implement SSE controller/service for real-time job notifications | High |
| 12 | [API] Implement Notifications Module with Email Queue | Email notifications via BullMQ with Mailpit integration | Medium |
| 14 | [API] Implement Cron Jobs for Auto-Close and Cleanup | Automated housekeeping for stale tickets and old AI jobs | Low |

#### Frontend Tickets

| # | Ticket | Description | Priority |
|---|--------|-------------|----------|
| 7 | [WEB] Implement Auth Feature with Login/Register Components | Complete login/register/logout UI with validation | High |
| 8 | [WEB] Implement Ticket List Feature with Filters and Search | Ticket list with filtering, search, pagination | High |
| 9 | [WEB] Implement Ticket Detail with Message Thread | Ticket detail view with conversation thread | High |
| 10 | [WEB] Implement AI Panel with SSE Subscription for AI Actions | AI action buttons with SSE result streaming | High |
| 13 | [WEB] Build Shared UI Components Library | Reusable components: Button, Input, Badge, etc. | Medium |
| 15 | [WEB] Implement Admin Panel for User and Ticket Management | Admin panel for global queue and user management | Medium |
| 16 | [WEB] Implement Create Ticket Feature | Create ticket form with validation | Medium |
| 17 | [WEB] Implement Permission Directive for UI-Level RBAC | *hasPermission structural directive | Medium |

#### SDK & Integration Tickets

| # | Ticket | Description | Priority |
|---|--------|-------------|----------|
| 11 | [SDK] Setup Orval SDK Generation from OpenAPI Spec | Configure Orval for TypeScript SDK generation | High |

---

### PHASE 3 - Tests and QA Assurance & Iteration Loops on Demand ⏳

**Milestone:** `PHASE 3 - TESTS AND QA ASSURANCE & ITERATION LOOPS ON DEMAND`  
**Due Date:** March 31, 2026  
**Status:** **PENDING** (0%)

**Goal:** Add comprehensive test coverage and iterate based on findings.

#### Planned Tickets (to be created when Phase 3 starts)

- [API] Unit tests for services with Vitest
- [API] Integration tests with Testcontainers (PostgreSQL, Redis)
- [API] E2E tests for critical user flows
- [WEB] Component tests with Vitest + jsdom
- [WEB] Orval mock generation for isolated testing
- [QA] Bug fixes from test findings
- [QA] Performance optimization pass
- [QA] Security audit and fixes

---

### PHASE 4 - Final Readiness & Deployment, Hot-Fixes If Needed ⏳

**Milestone:** `PHASE 4 - FINAL READINESS & DEPLOYMENT, HOT-FIXES IF NEEDED`  
**Due Date:** April 3, 2026  
**Status:** **PENDING** (0%)

**Goal:** Production deployment and stabilization.

#### Planned Tickets (to be created when Phase 4 starts)

- [DEVOPS] Production Docker configuration
- [DEVOPS] Environment hardening and secrets management
- [DEVOPS] CI/CD pipeline setup
- [DEVOPS] Database migration automation
- [DEVOPS] Health check endpoints and monitoring
- [FIX] Bug fixes from production testing
- [FIX] Performance tuning based on real load
- [DOC] API documentation completion
- [DOC] Deployment runbook

---

## Branch Naming Convention

All feature branches follow this pattern:

```
{issue-number}-dev-ticket-{issue-number}-{short-description}
```

**Examples:**
- `3-dev-ticket-3-api-tickets-module`
- `7-dev-ticket-7-web-auth-feature`
- `12-dev-ticket-12-sdk-orval-config`

**Rules:**
- Always branch from `dev`
- Use lowercase with hyphens
- Keep description concise but meaningful
- Include the issue number twice for traceability

---

## Issue Labels

| Label | Description | Color |
|-------|-------------|-------|
| `Ticket` | Standard development task | `#a3fb7c` |
| `bug` | Something isn't working | `#d73a4a` |
| `enhancement` | New feature or improvement | `#a2eeef` |
| `high-priority` | Important for current phase | `#ff9f1c` |
| `backend` | API / NestJS related | `#1f71ff` |
| `frontend` | Web / Angular related | `#ff6b6b` |
| `sdk` | SDK generation / Orval | `#9b59b6` |
| `devops` | Infrastructure / deployment | `#2ea44f` |

---

## Development Commands

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

# Run tests
pnpm test
```

---

## GitHub CLI Workflows

### Create Issue for Current Phase

```bash
gh issue create \
  --title "[API] Complete Tickets Module" \
  --body "## Description
Implement the full tickets.repository.ts with:
- Filtering by status, priority, assignee
- Cursor-based pagination
- Ownership scoping for non-admin users

## Acceptance Criteria
- [ ] findAll() supports all filter combinations
- [ ] Pagination returns cursor for next page
- [ ] Non-admin users only see their assigned tickets
- [ ] Admin users see all tickets

## References
- CONSTITUTION.md Section 10.3 (tickets entity)
- CONSTITUTION.md Section 11.3 (Tickets endpoints)" \
  --milestone "PHASE 2 - RAPID IMPLEMENTATIONS AS FIRST DRAFT" \
  --label "Ticket"
```

### Create Branch from Issue

```bash
gh issue view <issue-number> --json number,title
git checkout dev
git pull origin dev
git checkout -b <issue-number>-dev-ticket-<issue-number>-<feature-name>
```

### Example: Starting Work on Issue #4

```bash
# View issue details
gh issue view 4

# Create branch
git checkout dev
git pull origin dev
git checkout -b 4-dev-ticket-4-tickets-repository

# After completing work
git add .
git commit -m "feat: implement tickets repository with filtering and pagination

- Add findAll() with status, priority, assignee filters
- Implement cursor-based pagination
- Add ownership scoping for agents vs admins
- Add free-text search on title
- Add findRecent() for dashboard stats

Closes #4"
git push origin 4-dev-ticket-4-tickets-repository

# Create PR when ready
gh pr create --base dev --head 4-dev-ticket-4-tickets-repository --title "feat: implement tickets repository" --body "Closes #4"
```

---

## Phase Completion Criteria

### Phase 2 Completion Checklist

- [ ] All High priority tickets completed
- [ ] Core user flow works end-to-end:
  - [ ] User can register and login
  - [ ] User can create a ticket
  - [ ] User can view ticket list with filters
  - [ ] User can view ticket detail with messages
  - [ ] User can trigger AI actions and receive results via SSE
  - [ ] User can send messages in ticket thread
- [ ] Dashboard displays accurate stats
- [ ] Admin can manage users and tickets
- [ ] Email notifications queued (Mailpit visible in dev)
- [ ] SDK generation working and integrated
- [ ] No critical bugs blocking functionality

### Phase 3 Completion Checklist

- [ ] API unit test coverage > 70%
- [ ] Critical paths have integration tests
- [ ] Frontend components have unit tests
- [ ] E2E tests for happy-path flows
- [ ] All tests passing in CI
- [ ] Performance benchmarks met

### Phase 4 Completion Checklist

- [ ] Production Docker image builds successfully
- [ ] Database migrations run automatically
- [ ] Health checks responding
- [ ] Documentation complete
- [ ] Demo environment deployed and stable

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| LM Studio integration issues | High | Test with mock responses first; add fallback error handling |
| SSE connection instability | Medium | Implement reconnection logic in Angular client |
| BullMQ queue backlog | Medium | Monitor queue length; adjust concurrency |
| SDK drift from API contract | Medium | Make sdk:gen a pre-commit hook |
| Zoneless change detection issues | Low | Use async pipe alternatives; explicit markForCheck |

---

## Notes

- **Do not create issues for future phases in advance** - Only create issues when actively starting work on that phase
- **Keep issues atomic** - Each issue should be completable in a single work session
- **Update milestone progress** - Close issues as they are completed to track phase progress
- **Reference CONSTITUTION.md** - All implementation details are documented in the PRD/SRS

---

**Last Updated:** 2026-03-26  
**Document Version:** 1.0
