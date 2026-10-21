# Foundation implementation — 21 October 2026

User authorized start, commit and push. This is the first incremental foundation, not completion of F0 or acceptance of unresolved business policies.

Implemented: npm workspace with Next.js App Router/TypeScript, EN/AR entry pages and RTL content, light workspace/18px cards, optional Clerk provider and sign-in route, protected workspace with no default membership, process-only health route, staging configuration assertions, and an unapplied private-schema identity/academy/membership migration with RLS and no client grants.

No credentials are needed to build the informational starter. Authentication is unavailable without both Clerk test keys. Invalid partial/live keys or a supplied wrong service binding fail safely. No session grants academy permissions. The migration is source only; do not apply until database replay and authorization tests exist. Platform admin authority, branches, invitations, bootstrap/webhooks, role permissions, outbox, operational features and offline support are not implemented.

Supabase, Redis, QStash, Resend and Sentry values in the example file are preparation only: their runtime integrations are pending. No synthetic statistics or working operational actions are claimed. No secret is included.

## Run and deploy

Use Node 24 LTS and npm 11.19.1. From repository root run `npm ci`, then `npm run dev`. Copy `apps/web/.env.example` to `apps/web/.env.local` only when credentials are available. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Vercel: select Next.js, Root Directory `apps/web`, Node 24.x, default install/build/output settings with workspace files available. Set `APP_ENV=staging`. The project can build without provider keys and truthfully displays setup pending. To enable authentication, add both test Clerk keys privately and rebuild; set the allowed origin to the exact deployed URL and test sign-in separately. A Vercel deployment labeled Production for this staging-only project is still AcademyOS staging; never add live data/keys. Production is unsupported by this initial configuration.

Remaining evidence: authenticated browser journey, token/RLS checks, database replay, direct denied/allowed multi-tenant tests, provider connectivity, monitoring redaction, deployment protection, and role-owner acceptance. Fonts currently use system fallbacks; self-hosted brand typography remains pending.

## Verification evidence

Verified locally with Node 24.22.1: lint, production build, TypeScript, three configuration tests and three Playwright tests passed. Browser tests cover EN/AR rendering, phone reflow, unconfigured protected-route rejection, health response and unsupported locale. Desktop English and phone Arabic screenshots were visually inspected. Authenticated provider behavior was not exercised.

Dependency audit: production dependency audit reports zero known vulnerabilities at this check. Full audit reports five high-severity entries through the development-only Next.js ESLint glob/braces chain (GHSA-vfj7-8cjw-p6xm); current braces version is 3.0.3, with no patched version available from the registry at this check. This remains unresolved; do not interpret the production-only audit as a full security review.
