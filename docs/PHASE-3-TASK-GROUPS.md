# PHASE-3 Task Grouping & Branch Strategy

**Milestone:** PHASE 3 - Tests and QA & iteration loops on demand
**Strategy:** Group related issues into tasks, work on shared branches, create PRs per task group

---

## Task Groups

### Task Group 1: API-First Foundation (CRITICAL - MUST BE FIRST)

**Branch:** `phase3/api-first-foundation`
**Issues:** #28
**Priority:** CRITICAL

| Issue | Title | Status |
|-------|-------|--------|
| #28 | [API] Enhance OpenAPI Documentation for All DTOs | ⏳ Pending |

**Work Items:**
- Add @ApiProperty to all DTOs
- Add @Exclude() to sensitive fields
- Add @ApiResponse for all status codes
- Create Response DTOs
- Add examples and summaries

**PR:** Will create PR to `dev` when complete

---

### Task Group 2: Test Infrastructure Setup

**Branch:** `phase3/test-infrastructure`
**Issues:** #29, #30, #31, #32
**Priority:** HIGH (depends on #28)

| Issue | Title | Type |
|-------|-------|------|
| #29 | [WEB] Setup Orval Mock Generation | Frontend |
| #30 | [API] Setup Vitest Configuration | Backend |
| #31 | [WEB] Setup Vitest for Angular 21 | Frontend |
| #32 | [WEB] Setup Playwright for E2E | Frontend |

**Work Items:**
- Configure Orval mocks (#29)
- Setup API Vitest (#30)
- Setup Web Vitest (#31)
- Setup Playwright (#32)

**PR:** Will create PR to `dev` when complete

---

### Task Group 3: Backend Unit Tests

**Branch:** `phase3/backend-unit-tests`
**Issues:** #33, #34, #35, #36
**Priority:** HIGH (depends on #30)

| Issue | Title | Module |
|-------|-------|--------|
| #33 | [API] Unit Tests for Auth Module | Auth |
| #34 | [API] Unit Tests for Tickets Module | Tickets |
| #35 | [API] Unit Tests for AI Module | AI |
| #36 | [API] Unit Tests for Messages Module | Messages |

**Work Items:**
- Auth module tests (#33)
- Tickets module tests (#34)
- AI module tests (#35)
- Messages module tests (#36)

**PR:** Will create PR to `dev` when complete

---

### Task Group 4: Backend Integration & E2E

**Branch:** `phase3/backend-e2e`
**Issues:** #37, #38, #39, #40
**Priority:** HIGH (depends on #33-36)

| Issue | Title | Type |
|-------|-------|------|
| #37 | [API] Integration Tests with Testcontainers | Integration |
| #38 | [API] E2E Tests for Auth Flows | E2E |
| #39 | [API] E2E Tests for Ticket Flows | E2E |
| #40 | [API] E2E Tests for AI Job Flows | E2E |

**Work Items:**
- Testcontainers setup (#37)
- Auth E2E tests (#38)
- Ticket E2E tests (#39)
- AI E2E tests (#40)

**PR:** Will create PR to `dev` when complete

---

### Task Group 5: Frontend Component Tests

**Branch:** `phase3/frontend-component-tests`
**Issues:** #41, #42, #43, #44
**Priority:** MEDIUM (depends on #29, #31)

| Issue | Title | Components |
|-------|-------|------------|
| #41 | [WEB] Test Shared UI Components | Button, Input, Badge, Modal, etc. |
| #42 | [WEB] Test Auth Components | Login, Register |
| #43 | [WEB] Test Ticket Components | List, Detail, Create |
| #44 | [WEB] Test AI Panel Component | AI Panel |

**Work Items:**
- Shared components (#41)
- Auth components (#42)
- Ticket components (#43)
- AI Panel (#44)

**PR:** Will create PR to `dev` when complete

---

### Task Group 6: Frontend E2E Tests

**Branch:** `phase3/frontend-e2e`
**Issues:** #45, #46, #47
**Priority:** MEDIUM (depends on #32, #42-44)

| Issue | Title | Flow |
|-------|-------|------|
| #45 | [WEB] E2E Test Auth Flows | Login, Register, Logout |
| #46 | [WEB] E2E Test Ticket Flows | CRUD, Filters, Messages |
| #47 | [WEB] E2E Test AI Features | AI Panel, SSE |

**Work Items:**
- Auth E2E (#45)
- Ticket E2E (#46)
- AI E2E (#47)

**PR:** Will create PR to `dev` when complete

---

### Task Group 7: QA Manual Testing

**Branch:** `phase3/qa-manual-testing`
**Issues:** #48, #49, #50, #51
**Priority:** HIGH (depends on all automated tests)

| Issue | Title | Area |
|-------|-------|------|
| #48 | [QA] Manual Testing - Auth Flow | Auth |
| #49 | [QA] Manual Testing - Ticket Flow | Tickets |
| #50 | [QA] Manual Testing - AI Features | AI |
| #51 | [QA] Manual Testing - Admin Panel | Admin |

**Work Items:**
- Manual auth testing (#48)
- Manual ticket testing (#49)
- Manual AI testing (#50)
- Manual admin testing (#51)
- Document findings in issue comments

**PR:** N/A (manual testing, creates bug issues as needed)

---

### Task Group 8: Bug Fixes & Optimization

**Branch:** `phase3/bug-fixes-optimization`
**Issues:** #52, #53, #54
**Priority:** HIGH (depends on #48-51)

| Issue | Title | Type |
|-------|-------|------|
| #52 | [QA] Bug Fixes from Test Findings | Bug Fixes |
| #53 | [QA] Performance Optimization Pass | Performance |
| #54 | [QA] Security Audit and Fixes | Security |

**Work Items:**
- Fix bugs from test findings (#52)
- Performance optimization (#53)
- Security audit (#54)

**PR:** May create multiple PRs depending on fix scope

---

### Task Group 9: Documentation

**Branch:** `phase3/documentation`
**Issues:** #55, #56, #57
**Priority:** MEDIUM (can be parallel, best at end)

| Issue | Title | Guide |
|-------|-------|-------|
| #55 | [DOC] API Testing Guide | Backend |
| #56 | [DOC] Frontend Testing Guide | Frontend |
| #57 | [DOC] Test Coverage Report | Coverage |

**Work Items:**
- API testing guide (#55)
- Frontend testing guide (#56)
- Coverage report (#57)

**PR:** Will create PR to `dev` when complete

---

## Workflow

### For Each Task Group

1. **Create Branch**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b phase3/<task-group-name>
   ```

2. **Work on Issues**
   - Complete all issues in the group
   - Commit per issue or logical unit
   - Push regularly

3. **Create PR**
   ```bash
   gh pr create \
     --base dev \
     --head phase3/<task-group-name> \
     --title "phase3: <task group name>" \
     --body "Closes #XX, #XY, #XZ"
   ```

4. **After PR Merge**
   - Delete branch
   - Update this document with PR link
   - Move to next task group

---

## Current Status

| Task Group | Branch | Issues | Status | PR |
|------------|--------|--------|--------|-----|
| 1. API-First Foundation | - | #28 | ⏳ Not Started | - |
| 2. Test Infrastructure | - | #29-32 | ⏳ Not Started | - |
| 3. Backend Unit Tests | - | #33-36 | ⏳ Not Started | - |
| 4. Backend E2E | - | #37-40 | ⏳ Not Started | - |
| 5. Frontend Component | - | #41-44 | ⏳ Not Started | - |
| 6. Frontend E2E | - | #45-47 | ⏳ Not Started | - |
| 7. QA Manual Testing | - | #48-51 | ⏳ Not Started | - |
| 8. Bug Fixes | - | #52-54 | ⏳ Not Started | - |
| 9. Documentation | - | #55-57 | ⏳ Not Started | - |

---

## Quick Reference

### Start Task Group 1 (API-First Foundation)
```bash
# Create branch
git checkout dev
git pull origin dev
git checkout -b phase3/api-first-foundation

# Work on issue #28
# ... make changes to DTOs, entities, controllers ...

# Commit
git add .
git commit -m "feat(api): enhance OpenAPI documentation

- Add @ApiProperty to all DTO fields
- Add @Exclude() to sensitive fields
- Add @ApiResponse for all status codes
- Create Response DTOs
- Add examples and summaries

Closes #28"

# Push and create PR
git push -u origin phase3/api-first-foundation
gh pr create --base dev --head phase3/api-first-foundation \
  --title "feat(api): enhance OpenAPI documentation for all DTOs" \
  --body "Closes #28

## Changes
- Complete OpenAPI documentation for all endpoints
- Response DTOs for all endpoints
- Error response schemas
- Examples for all status codes

## Checklist
- [ ] All DTOs have @ApiProperty with examples
- [ ] Sensitive fields excluded with @Exclude()
- [ ] All status codes documented
- [ ] SDK generation verified with pnpm sdk:gen"
```

---

**Last Updated:** 2026-03-27
**Document Version:** 1.0
