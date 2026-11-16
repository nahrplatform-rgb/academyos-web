# AcademyOS — AI Project Context

> Current repository state is the primary source of truth for implemented behavior. This document summarizes the project for future OpenCode sessions; verify against source, migrations, tests, and `docs/07-handoff/*` receipts before changing behavior.

## Overview

**Later local-functional setup:** [current receipt](07-handoff/local-functional-environment-2026-11-13.md) records verified encrypted-archive recovery into local server memory, actual signed-in Owner Home/Players reads, and a clean local-production Players/Calendar offline-read plus Players reconnect checkpoint. Attendance offline save/reconciliation, installed-device and broader capability coverage remain open. Every implemented feature needs a usable local path; ordinary editing/Git does not require repeated promotions. This summary does not replace current tracker/evidence.

**13 November local delivery update:** follow [the live-development/compact-verification manual](06-delivery/local-development-and-verification.md) and [execution receipt](07-handoff/local-first-workflow-2026-11-13.md). The single tracker/generated continuation owns next work. A local frontend can connect to shared synthetic staging; configured settings or anonymous smoke do not establish signed-in data access, offline parity, hosted/installed proof or Owner acceptance. Resolve ordinary corrections within a connected batch and reuse only applicable intact evidence with its original timestamp.
- **Product:** AcademyOS (NAHR) — operating system for sports academies (owner, manager, trainer, guardian, player) with a separate Platform Owner business workspace.
- **Domain:** `academy.nahr.dev` (planned/canonical app domain per docs). Private EN/AR staging referenced in docs: `https://staging.academy.nahr.dev` (staging environment; promotion/release states are tracked separately in delivery docs).
- **Repository:** monorepo/workspace (`apps/web` as `@academyos/web`), Node 24 / npm 11.19.1 (`package.json`).
- **Current delivery posture (from repo docs):** extensive foundation + many implemented slices (identity/membership, onboarding M1, people/registration/guardian/trainer flows, scheduling/planning/publication, attendance/QR/corrections, evaluations, local-data/register/owner workspace work, PWA-delivery planning/integration tracks), with ongoing redesign/integration tracked in `docs/06-delivery/experience-execution.csv`, `docs/06-delivery/master-plan-v2/*`, and `docs/06-delivery/continue-academyos.md` (generated continuation).

## Architecture (implemented/planned boundaries)
- **Web app:** Next.js 16 / React 19 / TypeScript 6 app in `apps/web` (`next`, `react`, `@clerk/nextjs`, `@supabase/supabase-js`, locale-based EN/AR routes, PWA/service-worker headers in `next.config.ts`).
- **Identity:** Clerk for authentication/sessions; PostgreSQL/Supabase owns business memberships, roles, permissions, tenant scope (`docs/04-engineering/architecture.md`, migrations, README).
- **Data/backend:** Supabase PostgreSQL, RLS/policies/functions, migrations in `supabase/migrations/` (identity, membership, onboarding, programs/sessions/planning, attendance/QR/corrections, evaluations, calendar/workspace/read models, owner register/offline contracts, etc.). Private storage/buckets referenced.
- **Server boundary:** server-side authorization/capability checks and transactional domain operations are required (see `AGENTS.md`, `docs/04-engineering/*`, security reviews). Privileged keys are not a substitute for authorization.
- **Local/persistent data & sync (evolving):** LF-v2/LF-v3 direction and implemented subsets (owner register, workspace datasets, continuity/fallback/resume work) documented in `docs/06-delivery/local-data-and-sync-plan.md`, `docs/04-engineering/offline-*`, `docs/04-engineering/owner-*`, and handoffs. Durable local repository + sync coordinator architecture is the target; existing signed APIs/current DB authority remain canonical.
- **PWA/installable delivery:** planned/in-progress per `docs/06-delivery/pwa-delivery-and-readiness.md` (reuse existing protected data/sync, no competing root worker/engine); installed/browser contexts may differ.
- **Async/jobs/rate limiting/observability (as configured):** Upstash (Redis/ratelimit, QStash referenced), Sentry (`@sentry/nextjs`), email/backup/provider integrations tracked in `docs/05-services/*` and handoffs.

## Key components & repository layout
- `apps/web/` — application source, routes/UI/server actions/API handlers, tests (`vitest`/tsx unit tests, Playwright e2e configs referenced).
- `supabase/migrations/` — schema, RLS, functions, domain contracts.
- `scripts/` — verification/build/continuation and other operational scripts (see root `package.json`, `AGENTS.md` verification rules).
- `docs/` — canonical product/governance/workflows/design/engineering/services/delivery/handoff records (very extensive; `docs/06-delivery/continue-academyos.md` generated).
- `design/` — experience review artifacts/captures.
- `AGENTS.md` — engineering/operational instructions for agents (must be followed).

## Implemented features (high-level, evidenced in repo/docs/migrations)
- Identity/tenancy foundation, memberships/roles, controlled onboarding/admission flows.
- People: player registration, guardian relationships/appointments/access, trainer/staff flows (scoped by slice).
- Scheduling/planning: branches/sports/programs, draft planning, publication, trainer schedules, session changes.
- Attendance operations: online/batch/QR attendance, corrections, trainer/guardian related views (slice-dependent), register/offline-related work.
- Evaluations/development feedback workflows (slice-scoped).
- Owner workspace/calendar/dataset and local/register continuity work (implemented subsets with tracked evidence).
- Bilingual EN/AR, responsive experience, role-specific journeys; visual direction evolved (compact blue → Charcoal spectrum / Operations reference per decisions/docs).
- Extensive verification, traceability, and handoff discipline (CSV matrices, receipts, generated continuation).

## Dependencies (from manifests)
- **Runtime:** Next.js 16.4.2, React 19.3.1, Clerk 7.9.18, Supabase JS 2.118.0, Upstash Redis/QStash/ratelimit, Sentry 11.8.0, `jsqr`, `qrcode`.
- **Dev/tooling:** TypeScript 6, ESLint 9, Playwright 1.64.x, tsx.

## Data model (orientation)
- Business authority in PostgreSQL with RLS and transactional functions; separate domains for tenancy/people/scheduling/attendance/evaluations/finance-planning concepts and offline/register artifacts as represented in migrations and `docs/04-engineering/data-model-and-dictionary.md`.
- Original operation/recovery, idempotency, auditability, and tenant scoping are core constraints (see `AGENTS.md`, architecture, workflow docs).

## Deployment & environments
- Vercel-hosted web app (root `apps/web`); staging/preview/production boundaries and promotion rules are explicitly governed (Owner-controlled promotions). Staging integrations/backups/provider setup tracked in `docs/05-services/*` and `docs/07-handoff/*`.
- Public-repo/CI policy and PWA delivery tracked in governance/delivery docs; do not infer release readiness from a single check or deployment label.

## Current progress & outstanding work (summary)
- **Progress:** large implemented/documented foundation and multiple working slices with local/source/hosted evidence recorded in handoffs; canonical planning consolidated in master-plan v2 and experience-execution tracker.
- **Outstanding / in-progress (tracked, not exhaustive):** complete full-app Operations redesign adoption, remaining EX/MP batches, full PWA installed acceptance across declared devices, full-app local/sync coverage for all domains/roles, unresolved policy/product gates (see open questions/traceability), Owner promotions/acceptances as required, and ongoing verification/reconciliation per tracker. Use `docs/06-delivery/continue-academyos.md` and `docs/06-delivery/experience-execution.csv` for the authoritative current priority.

## References
- `AGENTS.md`, `README.md`, `docs/06-delivery/master-plan-v2/*`, `docs/06-delivery/experience-execution.csv`, `docs/06-delivery/continue-academyos.md`
- Governance: `docs/00-governance/*`; Product/workflows: `docs/01-product/*`, `docs/02-workflows/*`; Design: `docs/03-design/*`
- Engineering/services/delivery: `docs/04-engineering/*`, `docs/05-services/*`, `docs/06-delivery/*`; Handoffs/evidence: `docs/07-handoff/*`
- Migrations: `supabase/migrations/*`; Verification: `scripts/*`, `.github/workflows/*` (if present)
