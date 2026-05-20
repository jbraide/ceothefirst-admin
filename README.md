# CEOTHEFIRST Admin Interface

Admin dashboard for the CEOTHEFIRST platform — manage businesses, review KYC verifications, monitor analytics, and send notifications.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start dev server
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.ceothefirst.com/api/v1` | Backend API base URL |

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm test` | Run Vitest tests |
| `npm run test:ui` | Run Vitest with UI |

## Architecture

```
src/
├── components/       # Shared UI (Button, Card, Modal…) & layout (Sidebar, DashboardLayout)
├── features/         # Self-contained feature modules
│   ├── auth/         # Login, ProtectedRoute, auth store
│   ├── dashboard/    # Platform overview stats
│   ├── analytics/    # Revenue, signups, verification funnel, comparisons
│   ├── businesses/   # Business list, detail, suspend/activate
│   ├── verifications/# KYC pending list, approve/reject
│   ├── search/       # Global cross-entity search
│   ├── audit/        # Admin action log
│   └── notifications/# Broadcast + targeted push notifications
├── hooks/            # Shared custom hooks (useDebounce, useLocalStorage…)
├── lib/              # API client (Axios + interceptors)
├── pages/            # Route-level page components
├── store/            # Zustand stores (auth)
├── styles/           # Tailwind global styles
├── types/            # TypeScript API types
└── utils/            # Pure utilities (cn(), formatters…)
```

### Key Dependencies

| Library | Purpose |
|---|---|
| React 19 + Vite | Framework & build tool |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| TanStack Query | Server state & caching |
| Zustand | Client state (auth) |
| React Router v6 | Routing |
| Recharts | Analytics charts |
| Axios | HTTP client |
| Lucide React | Icons |
| clsx + tailwind-merge | Class merging |

### Feature Module Pattern

Each feature under `src/features/[name]/` is self-contained:
- `api/` — API call functions (one per endpoint)
- `components/` — Feature-specific React components
- `types.ts` — Feature-local types (or shared via `src/types/api.ts`)

Cross-feature imports are avoided. Shared logic lives in `src/hooks/`, `src/lib/`, `src/utils/`.

## Deployment

```bash
npm run build
# Deploy the dist/ folder to any static host (Vercel, Netlify, S3, etc.)
```

Set `VITE_API_BASE_URL` to the production API URL in your deployment environment.

## Security

- Admin JWT tokens are stored in `localStorage` under namespaced keys (`nf_admin_*`).
- This is vulnerable to XSS. For production, use HttpOnly cookies if the API supports them, and enforce a strict Content Security Policy (no `unsafe-inline`).
- Tokens are automatically attached to every API request via an Axios interceptor.
- On 401 responses, tokens are cleared and the user is redirected to `/login`.
