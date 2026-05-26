# World Cup Prode 2026

A family & friends World Cup 2026 prediction competition app. Users predict match results, compete in private groups, and track live scores and leaderboards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/prode run dev` — run the frontend (port 24123)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk Auth
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TailwindCSS v4 + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, groups, matches, predictions)
- `artifacts/api-server/src/routes/` — Express route handlers (users, groups, matches, predictions, leaderboard, dashboard)
- `artifacts/api-server/src/lib/scoring.ts` — points calculation logic
- `artifacts/prode/src/` — React frontend

## Architecture decisions

- Clerk for auth (email/password + Google) — cookie-based on web, no token handling needed in API calls
- OpenAPI-first workflow: spec → codegen → typed hooks and Zod schemas
- Points: correct winner = 5 pts, exact home goals = +1, exact away goals = +1 (max 7)
- Predictions locked 24 hours before tournament start (June 11, 2026 @ 20:00 UTC)
- Live match polling every 60 seconds via React Query refetchInterval
- 104 matches seeded: 48 group stage + knockout stages through the Final

## Product

- Landing page for unauthenticated users
- Dashboard with total points, group rankings, upcoming matches, recent results
- Full match center with flags, scores, predictions, filtering
- Group creation/joining via 8-character invite codes
- Per-group leaderboards with rank, points, correct winners, exact scores
- Profile editing

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after spec changes
- Run `pnpm --filter @workspace/db run push` after schema changes
- `nanoid` is used for generating group invite codes
- Match seeding is in the code_execution notebook (104 matches across 12 groups + knockouts)
- Clerk proxy path is `/api/__clerk` — hardcoded in the middleware template

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
