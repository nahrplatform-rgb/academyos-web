# Repository and local development contract

No application directories or executable workflows are created by this handbook task. This document tells the future builder what to establish after the pre-development gate.

## Proposed repository layout

```text
apps/web/                 Next.js application and route handlers
packages/contracts/      Schemas, API types and error codes
packages/domain/         Pure money/date/calculation logic
packages/ui/             Accessible components and semantic tokens
packages/i18n/           English/Arabic messages and formatting
packages/config/         Shared TypeScript/lint/tool configuration
supabase/migrations/     Schema, policies, functions and seeds
supabase/tests/          Database invariants and permission cases
tests/e2e/               Role journeys and browser recovery
tests/fixtures/          Synthetic multi-tenant records only
scripts/                 Explicit verification and maintenance tools
docs/                    This handbook, decisions and evidence pointers
.github/                 Reviewed CI, issue and PR templates
```

Use one package manager with a committed lockfile and pinned package-manager version. Select an actively supported Node LTS compatible with the actual Next.js/Vercel/SDK versions at kickoff, record the choice and enforce it locally/CI/hosting. Do not copy old version numbers from PYSA or use floating `latest` in CI. Keep installation reproducible with frozen-lockfile mode.

## Local setup sequence

1. Verify the intended repository owner/name and clone the correct private repository when development is authorized. Do not create a second repository because the source blueprint omitted its URL.
2. Install the declared runtime/package manager and container runtime needed for a local disposable Supabase stack. Record supported host operating systems.
3. Create ignored local environment files from the documented template, using only nonproduction credentials. Validate required values with a startup schema that reports missing names, never secret values.
4. Start local database/services; replay migrations and synthetic seed fixtures. The seed includes two academies, all six roles, active/revoked relationships, multiple branches, configured sports and financial test cases.
5. Run the web app and verify sign-in/bootstrap against the designated nonproduction Clerk issuer. Automated tests that need no provider should use local signed fixture claims against a controlled test verifier, with separate real-provider staging checks.
6. Run the declared foundation checks before opening a PR. New developers should reproduce the result without production secrets or a developer's private files.

## Environment loading

Keep secret-bearing `.env*` files ignored; allow only a reviewed blank/example template. `NEXT_PUBLIC_` values are browser-visible and inlined at build time, so never put secret keys behind that prefix. Changing a server deployment environment does not rewrite an already built browser bundle. Next.js tests intentionally differ in environment-file loading, including skipping `.env.local` for test mode. [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)

Use validated environment access modules that separate public configuration from server secrets. Never dump the full environment to logs or use shell tracing in secret-handling scripts. Test fixtures cannot depend on personal app passwords or hosted production data.

## Required future command interface

Define scripts for `dev`, `build`, `typecheck`, `lint`, `test`, `test:db`, `test:e2e`, `test:contracts`, `test:a11y`, `verify:env`, `verify:migrations` and `verify:docs`. These are desired script names, not commands that currently exist. Keep ordinary development fast; run meaningful broader suites at PR/release boundaries.

Database tests rebuild from empty state and test policies/functions directly. Browser tests cover real role paths and UI status. Provider sandbox checks run in staging with restricted credentials. Tests must not auto-provision paid services or mutate production. Destructive reset scripts require an unmistakable disposable-environment assertion.

## Contribution rules

Each PR states problem, resulting behavior, requirements, migrations, permission implications, failure recovery, tests and open limitations. Use short branches and reviewed changes. Protect main with checks supported by the actual GitHub plan. Do not assume automatic Vercel Git deployments wait for GitHub checks. Keep migration application and production promotion as explicit controlled release steps.

Never copy PYSA secrets, real data or legacy schema wholesale. Reference it for lessons and behavior evidence, then implement AcademyOS's own contracts. Record differences as decisions and keep the old product read-only.
