# QA Review — NairaFlow Admin Interface (Full Pre-Merge Review)

**Date:** 2026-05-19
**Reviewer:** QA Specialist  
**Scope:** Full codebase audit of `admin-interface`  
**Verdict:** 🟡 REQUEST CHANGES

The codebase is well-structured and handles the major UX states (loading/error/empty) consistently, but it has zero test coverage, a few security concerns, and several code duplication issues that should be addressed before merging to `main`.

---

## 🔴 Blockers (must fix before merge)

### 1. Hardcoded API Base URL
- **[Security] `src/lib/apiClient.ts:4`** — `BASE_URL = "https://api.ceothefirst.com/api/v1"` is hardcoded. This makes it impossible to switch environments (dev/staging/prod) without changing source code. If committed to a public repo, the production API endpoint is exposed.

**Suggested fix:**
```ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.ceothefirst.com/api/v1";
```

---

### 2. Zero Test Coverage
- **[Test Coverage] Entire project** — No test framework (Vitest, Jest, Testing Library) is configured in `package.json`. Every component, hook, utility function, and API integration is untested. 75 source files, 0 test files.

**Suggested fix:** At minimum, add Vitest + React Testing Library and write unit tests for:

| Priority | Target | Rationale |
|----------|--------|-----------|
| P0 | `authStore.ts` | Core auth logic, localStorage persistence |
| P0 | `apiClient.ts` interceptors | Request auth header, 401 redirect, response unwrap |
| P0 | `ProtectedRoute.tsx` | Route guard logic |
| P1 | `fillMissingPeriods` / `fillMissingDays` (`utils.ts`) | Complex date math, multiple code paths |
| P1 | `LoginForm.tsx` | Success/error/validation flows |
| P2 | `useDebounce.ts`, `useLocalStorage.ts`, `useClickOutside.ts` | Shared hooks |
| P2 | `BusinessList.tsx`, `PendingVerificationsList.tsx` | Key business logic |

---

### 3. JWT Tokens in localStorage
- **[Security] `src/store/authStore.ts:58-62`** — JWT tokens are stored in `localStorage` with predictable keys (`nf_admin_token`, `nf_admin_refresh`). Vulnerable to XSS — any script running on the page can read and exfiltrate tokens.

**Suggested fix:** Use HttpOnly cookies for token storage if the API supports it. If localStorage is required, document the risk and enforce a strict Content Security Policy (no `unsafe-inline` scripts).

---

## 🟡 Important (should fix, but not necessarily blocking)

### 4. Duplicate `useDebounce` Hook
- **[Code Quality] `src/features/search/components/GlobalSearch.tsx:18-24`** — Defines its own `useDebounce` inline instead of importing the shared hook from `@/hooks/useDebounce`. The inline version is less type-safe.

**Suggested fix:**
```ts
// Delete lines 18-24 and add:
import { useDebounce } from "@/hooks/useDebounce";
```

---

### 5. Manual URL Construction in Audit Logs API
- **[Code Quality] `src/features/audit/api/getAuditLogs.ts:11`** — Constructs the URL with string interpolation:
  ```ts
  `/admin/audit-logs?page=${page}&limit=${limit}`
  ```
  Every other API function uses the axios `params` option. This is inconsistent and fragile.

**Suggested fix:**
```ts
const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>(
  "/admin/audit-logs",
  { params: { page, limit } },
);
```

---

### 6. Duplicate `naira` Currency Formatter
- **[Code Quality] Multiple files** — `Intl.NumberFormat("en-NG", ...)` is defined in four places:
  - `src/pages/DashboardPage.tsx`
  - `src/features/dashboard/components/StatsCards.tsx`
  - `src/features/analytics/components/TopBusinessesTable.tsx`
  - `src/features/analytics/utils.ts` (already exported!)

**Suggested fix:** Delete the three inline definitions and import from `@/features/analytics/utils`.

---

### 7. Missing `staleTime` on Several Queries
- **[Performance] Multiple components** — These `useQuery` calls have no `staleTime`, causing refetches on every mount:
  - `CategoriesChart` (`getCategories`)
  - `FeatureAdoptionCards` (`getFeatureAdoption`)
  - `PendingVerificationsList` (`getPendingVerifications`)
  - `BusinessList` (`getBusinesses`)
  - `BusinessDetailView` (`getBusinessDetail`)
  - `AuditLogList` (`getAuditLogs`)

The dashboard page alone fires 10+ queries on load. Without `staleTime`, navigating between pages causes unnecessary refetches.

**Suggested fix:** Set `staleTime: 60_000` on analytics queries and `staleTime: 30_000` on entity list queries.

---

### 8. Dead Code: `fillMissingDays`
- **[Correctness] `src/features/analytics/utils.ts:26-48`** — The `fillMissingDays` function is exported but never imported or called anywhere. All chart components use `fillMissingPeriods`.

**Suggested fix:** Remove it or add a comment documenting its planned use.

---

### 9. README Is Stock Template
- **[Documentation] `README.md`** — Still the default Vite + React template. Contains no project-specific information about NairaFlow Admin, setup instructions, environment variables, API contracts, or deployment.

**Suggested fix:** Replace with:
- Project overview and purpose
- Prerequisites (Node version, etc.)
- Setup instructions (`npm install`, env vars, `npm run dev`)
- Available scripts
- Architecture overview (folder structure, key dependencies)
- Deployment guide

---

## 🔵 Nitpicks / Suggestions (optional improvements)

### 10. Duplicate `useToast` Logic
- **[Code Quality] `src/features/notifications/components/NotificationForm.tsx:30-38`** — Defines a `useToast` function inline. A shared hook in `@/hooks/useToast.ts` would benefit future components.

---

### 11. White Flash on Login Redirect
- **[UX] `src/pages/LoginPage.tsx:16`** — Returns `null` when already authenticated, causing a brief white flash before the redirect to `/`. A centered spinner would be smoother.

---

### 12. `useClickOutside` Uses `mousedown`
- **[UX] `src/hooks/useClickOutside.ts:15`** — Listens on `mousedown` instead of `click`. If a user starts a drag inside a modal and releases outside, the modal closes prematurely.

---

### 13. `eslint-disable` in CategoriesChart
- **[Code Quality] `src/features/analytics/components/CategoriesChart.tsx:73`** — Uses `eslint-disable-next-line @typescript-eslint/no-explicit-any` for the Recharts legend renderer. Recharts exports `LegendPayload` which can replace the `any`.

---

### 14. `actionVariant` Catch-All Default
- **[Maintainability] `src/features/audit/components/AuditLogList.tsx:22-29`** — Returns `"secondary"` as a fallback for unknown actions. If the backend adds a new action type, it silently gets the wrong badge color.

---

### 15. Inconsistent Code Style
- **[Code Style] Project-wide** — Mix of single and double quotes, inconsistent semicolon usage. Prettier is configured (`npm run format`) but hasn't been run.

**Suggested fix:** Run `npm run format` before merge.

---

## ✅ What Looks Good

- **UX State Handling** — Every data-driven component has proper loading spinners, error messages with retry context, and thoughtful empty-state messaging. This is thorough and consistent across all 75 source files.

- **TypeScript Types** (`src/types/api.ts`) — Comprehensive, well-documented type definitions covering every API response shape. The `AnalyticsRange` discriminated union and the `ComparisonData` delta types are particularly well-designed.

- **Auth Store** (`src/store/authStore.ts`) — Correctly handles SSR safety (`typeof window` checks), localStorage errors (try/catch with graceful degradation), and derived state (`isAuthenticated`). The `setTokens` action for token refresh is a nice touch.

- **API Client Interceptors** (`src/lib/apiClient.ts`) — Cleanly unwraps the `{ success, data }` API envelope and handles 401s with logout + redirect. The pattern is well-applied across all API functions.

- **Protected Route Guard** (`src/features/auth/components/ProtectedRoute.tsx`) — Correctly uses the Zustand store and supports both `children` and `Outlet` rendering patterns. Clean and minimal.

- **Chart Components** — Consistent pattern across all 7 chart components: `RangeSelector` + `useQuery` + `fillMissingPeriods` + Recharts with custom tooltips. The `TransactionsVolumeChart` (composed bar + line chart with dual Y-axes) is a particularly polished implementation.

- **Accessibility** — Modals use `aria-modal`, `aria-labelledby`, `aria-describedby`, and `role="dialog"`. Inputs use `aria-invalid` and `aria-describedby` for error states. Toast uses `role="alert"` and `aria-live="assertive"`. Pagination uses `role="navigation"` and `aria-current="page"`. Table rows on the business list are keyboard-navigable.

- **Feature-Based Folder Structure** — Clean separation of concerns: each feature has its own `api/` and `components/` directories. Shared UI components, hooks, and utilities are properly hoisted to the top level.

---

## Summary

The NairaFlow Admin interface is a solidly built React + TypeScript dashboard with excellent UX state handling and a clean feature-based folder structure. The main concerns are the complete absence of test coverage (a blocking issue for production), hardcoded API credentials, and token storage in localStorage without XSS mitigation. There's also a pattern of code duplication (`useDebounce`, `naira` formatter, `useToast`) that should be consolidated before the codebase grows further. The inconsistent code style suggests the Prettier format script hasn't been run — a quick `npm run format` would clean this up. With tests added and the few security and duplication issues addressed, this would be ready for merge.

---

## Issue Count Summary

| Severity | Count |
|----------|-------|
| 🔴 Blockers | 3 |
| 🟡 Important | 6 |
| 🔵 Nitpicks | 6 |
| **Total** | **15** |
