# QA Review — Admin Role-Based Access Control

**Date:** 2025-05-18  
**Reviewer:** QA Specialist  
**Scope:** Admin RBAC — roles, admin CRUD, schema, seed, auth, docs  
**Files changed:** 9 files (2 new, 7 modified)

---

## Verdict
🟢 **APPROVED** — All issues resolved. Ready to commit.

> **Resolution log:** Dead `createAdmin` removed from auth service, self-deactivation guard added to `deactivateAdmin`, self-role-change guard added to `updateAdmin`, `console.error` migrated to NestJS `Logger`.

---

## Scope of Changes

| File | Status | Summary |
|------|--------|---------|
| `api/prisma/schema.prisma` | Modified | Added `isActive` field to `SuperAdmin`, updated `role` comment |
| `api/prisma/seed.ts` | Modified | Seeds 3 admin accounts (SUPER_ADMIN, SUPPORT_ADMIN, ANALYST) + formatting |
| `api/src/auth/auth.service.ts` | Modified | `adminLogin` checks `isActive`; dynamic role from DB; added `createAdmin`; extended `generateTokens` role union |
| `api/src/auth/strategies/jwt.strategy.ts` | Modified | Dynamic role detection via `adminRoles` array; returns actual `admin.role` |
| `api/src/auth/dto/create-admin.dto.ts` | **New** | Validated DTO: email, password (min 6), name, role (enum) |
| `api/src/auth/dto/update-admin.dto.ts` | **New** | Validated DTO: name, role, isActive — all optional |
| `api/src/admin/admin.controller.ts` | Modified | Method-level `@Roles()` on every endpoint; admin CRUD endpoints; section reorganization; removed dead `resolveTimeRange` import |
| `api/src/admin/admin.service.ts` | Modified | Admin CRUD: `createAdmin`, `getAdmins`, `getAdminDetails`, `updateAdmin`, `deactivateAdmin` |
| `api/docs/modules/admin.md` | Modified | Role system docs, seeded accounts table, param tables for all endpoints |

---

## Findings

### 🟡 Important (should fix before committing)

#### 1. [Code Quality] Dead `createAdmin` in `auth.service.ts`

**Location:** `api/src/auth/auth.service.ts`, lines 134–166.

Both `auth.service.ts` and `admin.service.ts` contain a `createAdmin` method with identical logic and audit logging. The controller calls `this.adminService.createAdmin()`, so the auth service version is unreachable dead code. Two copies invite divergence and confusion.

**Resolution:** Remove `createAdmin` and its `CreateAdminDto` import from `auth.service.ts`. The admin service owns this logic.

**Severity:** Medium — won't cause runtime errors but is a maintenance hazard.

**✅ Resolved:** `createAdmin` method and its `CreateAdminDto` import removed from `auth.service.ts`.

---

#### 2. [Security] No self-targeting guard on `deactivateAdmin`

**Location:** `api/src/admin/admin.controller.ts`, `deactivateAdmin` method.

A SUPER_ADMIN can deactivate their own account by passing their own ID, locking themselves out with no way to reactivate.

**Resolution:** Add a guard in the controller:
```typescript
if (admin.userId === id) {
  throw new BadRequestException('Cannot deactivate your own account');
}
```

**Severity:** Medium — self-lockout risk.

**✅ Resolved:** Guard added — `if (admin.userId === id) throw new BadRequestException('Cannot deactivate your own account')`.

---

#### 3. [Security] No self-targeting guard on `updateAdmin` role change

**Location:** `api/src/admin/admin.controller.ts`, `updateAdmin` method.

A SUPER_ADMIN can change their own role (e.g., downgrade to ANALYST), losing access to manage admins and perform business mutations.

**Resolution:** Add a guard in the controller:
```typescript
if (admin.userId === id && dto.role !== undefined) {
  throw new BadRequestException('Cannot change your own role');
}
```

Note: changing one's own `name` is harmless and can be allowed. Only block `role` self-modification.

**Severity:** Medium — self-downgrade risk.

**✅ Resolved:** Guard added — `if (admin.userId === id && dto.role !== undefined) throw new BadRequestException('Cannot change your own role')`.

---

### 🔵 Nitpicks / Suggestions

#### 4. [Consistency] `console.error` in controller catch blocks

The admin service uses `private readonly logger = new Logger(AdminService.name)`, but the controller's audit-log catch blocks still use `console.error`. Pre-existing issue, but since the controller is being heavily reorganized, this is a good time to switch to `Logger`.

**✅ Resolved:** Controller now uses `private readonly logger = new Logger(AdminController.name)` and all catch blocks use `this.logger.error(...)`.

#### 5. [Typing] DTO `role` fields are `string` instead of union type

`CreateAdminDto.role` and `UpdateAdminDto.role` are typed as `string`. The `@IsIn()` decorator catches invalid values at runtime, but a TypeScript union type (`'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'ANALYST'`) would provide compile-time safety as well.

#### 6. [Edge Case] Deactivating the last active SUPER_ADMIN

If the platform has only one SUPER_ADMIN and they get deactivated, no one can create new admins, reactivate accounts, or perform business mutations. Consider a service-level guard that checks the count of active SUPER_ADMINs before allowing deactivation. This can be deferred to v2 but should be tracked.

---

### ✅ What Looks Good

- **Role system design** — three-tier (`ANALYST` → `SUPPORT_ADMIN` → `SUPER_ADMIN`) with method-level `@Roles()` overrides. The class-level default of `SUPER_ADMIN` means new endpoints default to most restrictive access.
- **Controller reorganization** — section comments (`Stats & Dashboard`, `Analytics`, `Business read-only`, `Business mutations`, `Admin account management`) make the file scannable and maintainable.
- **`isActive` check on login** — deactivated admins cannot authenticate. Correct placement in the auth flow.
- **JWT strategy returns dynamic `role`** — no longer hardcoded to `'SUPER_ADMIN'`. The `adminRoles` array makes adding future roles a one-line change.
- **DTOs are well-validated** — `@IsEmail`, `@MinLength(6)`, `@IsIn([...])`, `@IsBoolean`. All fields covered.
- **Password/refresh hash never leaked** — all `select` clauses in `getAdmins`, `getAdminDetails`, `updateAdmin`, `deactivateAdmin`, and `createAdmin` return exclude sensitive fields.
- **Audit logging on every admin mutation** — `ADMIN_CREATED`, `ADMIN_UPDATED`, `ADMIN_DEACTIVATED` all logged with try/catch wrappers around the log calls.
- **Seed file** creates all three role accounts for local development with documented credentials.
- **Documentation** is comprehensive and up to date — role table, seeded accounts, per-endpoint param tables, updated error messages.

---

## Summary

Solid RBAC implementation with clean separation of concerns. Three items to address before committing:

1. Remove dead `createAdmin` from `auth.service.ts`
2. Add self-deactivation guard to `deactivateAdmin`
3. Add self-role-change guard to `updateAdmin`

After these fixes, approved for merge.
