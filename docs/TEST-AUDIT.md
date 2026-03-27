# API Test Audit Report

**Date:** 2026-03-28
**Status:** In Progress - Issues Identified
**Branch:** phase3/backend-e2e

---

## Executive Summary

API tests are partially broken. Unit tests have 1/28 failures. E2E tests cannot run at all due to missing TypeScript path resolution configuration.

---

## Test Results

### Unit Tests (`pnpm test`)

```
Result: 27/28 passing
Command: pnpm test (in apps/api)
```

| Test File | Status | Tests | Details |
|-----------|--------|-------|---------|
| `auth.service.spec.ts` | ✅ PASS | 6 | |
| `tickets.service.spec.ts` | ✅ PASS | 9 | |
| `ai.service.spec.ts` | ✅ PASS | 6 | |
| `messages.service.spec.ts` | ✅ PASS | 6 | |
| `app.controller.spec.ts` | ❌ FAIL | 1 | Import path bug |

**Failure Details:**
```
TypeError: Cannot read properties of undefined (reading 'getHello')
 ❯ AppController.getHello src/app.controller.ts:10:28
 ❯ src/app.controller.spec.ts:21:36
```

**Root Cause:** `src/app.controller.spec.ts` line 1 imports `./app.service` which resolves to the spec file itself instead of `../app.service`.

---

### E2E Tests (`pnpm test:e2e`)

```
Result: 0/3 suites passing (cannot run)
Command: pnpm test:e2e (in apps/api)
```

| Test File | Status | Details |
|-----------|--------|---------|
| `auth.e2e.spec.ts` | ❌ FAIL | Cannot resolve '../src/app.module' |
| `tickets.e2e.spec.ts` | ❌ FAIL | Cannot resolve '../src/app.module' |
| `ai.e2e.spec.ts` | ❌ FAIL | Cannot resolve '../src/app.module' |

**Root Cause:** `test/vitest-e2e.config.ts` missing `vite-tsconfig-paths` plugin. The unit test config has it; the E2E config does not.

**Error:**
```
Error: Cannot find module '../src/app.module' imported from '...test/e2e/auth.e2e.spec.ts'
```

---

## Module Coverage Analysis

### Backend Modules

| Module | Unit Test | E2E | Notes |
|--------|-----------|-----|-------|
| Auth | ✅ Yes | ✅ Yes | |
| Tickets | ✅ Yes | ✅ Yes | |
| AI | ✅ Yes | ✅ Yes | |
| Messages | ✅ Yes | ❌ No | Missing E2E |
| Users | ❌ No | ❌ No | Not tested |
| Roles | ❌ No | ❌ No | Not tested |
| Dashboard | ❌ No | ❌ No | Not tested |
| Cron | ❌ No | ❌ No | Not tested |
| Notifications | ❌ No | ❌ No | Not tested |
| SSE | ❌ No | ❌ No | Not tested |

### Coverage Gaps

1. **Users Module** - Has service, repository, controller but zero tests
2. **Roles Module** - Has service, repository, controller but zero tests
3. **Dashboard Module** - Has service, controller but zero tests
4. **Cron Module** - Has service but zero tests
5. **Notifications Module** - Has service, processor but zero tests
6. **SSE Module** - Has service, controller but zero tests
7. **Messages Module** - Has unit tests but no E2E

---

## Issue Tracker

### P0 - Critical (Must Fix)

- [ ] **FIX-1:** `src/app.controller.spec.ts` line 1 has wrong import path
  - Current: `import { AppService } from './app.service';`
  - Should be: `import { AppService } from '../app.service';`

- [ ] **FIX-2:** `test/vitest-e2e.config.ts` missing `vite-tsconfig-paths` plugin
  - Needs: `plugins: [tsconfigPaths()]`
  - Same pattern as `vitest.config.ts`

### P1 - High (Should Fix)

- [ ] **TEST-1:** Run E2E tests after FIX-2 to verify they actually pass
- [ ] **TEST-2:** Add Messages E2E tests
- [ ] **TEST-3:** Add Users module unit tests
- [ ] **TEST-4:** Add Roles module unit tests

### P2 - Medium (Nice to Have)

- [ ] **TEST-5:** Add Dashboard module unit tests
- [ ] **TEST-6:** Add Cron module unit tests
- [ ] **TEST-7:** Add Notifications module unit tests
- [ ] **TEST-8:** Add SSE module unit tests

---

## Phase Alignment

### vs PHASE-3-TASK-GROUPS.md

| Task Group | Claimed Status | Actual Status |
|------------|----------------|---------------|
| #2 Test Infrastructure | ✅ Complete | ⚠️ E2E config incomplete |
| #3 Backend Unit Tests | ✅ Complete | ❌ 1 broken test |
| #4 Backend E2E | ✅ Complete | ❌ E2E cannot run |

### Phase 1-2 Backend Modules Not Covered by Tests

- Users, Roles, Dashboard, Cron, Notifications, SSE

---

## Action Plan

### Step 1: Fix Critical Issues
1. Fix `app.controller.spec.ts` import
2. Fix `vitest-e2e.config.ts` missing plugin
3. Run unit tests to confirm 28/28 passing
4. Run E2E tests to confirm they execute

### Step 2: Verify E2E Tests Actually Pass
E2E tests may have been committed but never verified. After fixing config:
1. Ensure Docker is running
2. Run `pnpm test:e2e`
3. Fix any test failures that surface

### Step 3: Fill Coverage Gaps
Per module priority:
1. Users - add unit tests
2. Roles - add unit tests
3. Messages - add E2E tests
4. Dashboard/Cron/Notifications/SSE - add unit tests

---

## Files to Modify

### Critical (for tests to work)

1. `apps/api/src/app.controller.spec.ts` - Fix import path
2. `apps/api/test/vitest-e2e.config.ts` - Add vite-tsconfig-paths

### Coverage Gaps (new test files)

3. `apps/api/src/modules/users/users.service.spec.ts`
4. `apps/api/src/modules/roles/roles.service.spec.ts`
5. `apps/api/src/modules/dashboard/dashboard.service.spec.ts`
6. `apps/api/src/modules/cron/cron.service.spec.ts`
7. `apps/api/src/modules/notifications/notifications.service.spec.ts`
8. `apps/api/src/modules/sse/sse.service.spec.ts`
9. `apps/api/test/e2e/messages.e2e.spec.ts`

---

**Last Updated:** 2026-03-28
**Next Action:** Fix app.controller.spec.ts import and vitest-e2e.config.ts plugin
