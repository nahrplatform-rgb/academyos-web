# Membership connection — 21 October 2026

> Historical and incremental receipts follow in date order. For current deployed integration, backup proof and remaining work use [the setup index](setup-index.md). Earlier connector/configuration blockers below were subsequently resolved as recorded.

Implemented a server-only Supabase client that sends the current Clerk session token with a publishable key. No elevated application credential is used. The client accepts only the exact staging project URL, disables caching/session persistence, bounds request time, and returns an unavailable state on errors.

Two narrow RPCs operate over the private academy schema. Bootstrap derives the identity only from the authenticated JWT, is idempotent, and never creates memberships or roles. Membership lookup returns only active memberships for that identity. Both reject a wrong staging issuer and missing/invalid subject/role. No identity or academy argument is accepted. SECURITY DEFINER is intentional for these bounded operations: fixed empty search paths, fully qualified objects, revoked PUBLIC/anon execution, no direct table grants. Existing RLS remains enabled with no direct client policies. Platform-admin provisioning and tenant write operations are not implemented.

The workspace now distinguishes an unavailable membership service from a verified empty list. Active memberships are listed without enabling operational actions. Suspended/ended/invited memberships are excluded on every request.

## Verification

Local isolated PostgreSQL 17: replayed both migrations from empty state with a test-only auth.jwt harness. SQL tests cover idempotence, two-tenant separation, direct table denial, suspension, wrong issuer and anonymous denial. This validates SQL authorization logic, not Supabase gateway/JWT signature verification. Lint, build, TypeScript and six unit tests pass. Hosted Clerk sign-in succeeded according to user screenshots before this slice; hosted Supabase token acceptance remains untested.

The connected Supabase tool account lists only Shift projects and cannot currently access AcademyOS staging. No hosted migration or other project's data was changed. Database advisor checks through the AcademyOS provider remain pending.

## Remaining connection steps

1. Connect the Supabase plugin to the account/organization containing `snpphkenmvmhpjstbeul` so the migration baseline and current provider configuration can be inspected before apply.
2. Replay/apply the two reviewed migrations only to that staging project, after checking its existing state. Never run the test harness in the hosted project.
3. Set Vercel Production environment variables (this project hosts AcademyOS staging): `NEXT_PUBLIC_SUPABASE_URL=https://snpphkenmvmhpjstbeul.supabase.co` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from that project. No service-role key is needed.
4. Redeploy and sign in. Verify identity bootstrap and empty memberships using the actual Clerk JWT. Then test controlled synthetic memberships, isolation and revocation before any acceptance claim.

Invitation-led vs self-service onboarding, delegated roles and privileged initial provisioning require accepted policies. Signing up alone grants no academy access. Operational workflows and automated membership grants are not enabled.

Database test replay: on an empty disposable PostgreSQL database run psql with ON_ERROR_STOP=1 and the files `supabase/tests/harness.sql`, both migration files in timestamp order, then `supabase/tests/membership_boundary.sql`. Tests roll back synthetic records. The harness supplies claims and is not a JWT verification substitute.

## Hosted update — 21 October 2026

Supabase connection restored and target verified: only academyos-staging / snpphkenmvmhpjstbeul, eu-west-1, PostgreSQL 17.11. Baseline was empty except provider automatic-RLS trigger. Applied identity_baseline, membership_reads and restrict_auto_rls_trigger. Local filenames aligned to actual provider migration versions 20261021165259, 20261021165332 and 20261021165645 to avoid duplicate replay.

Hosted SQL permission tests passed under simulated authenticated/anonymous roles inside a rollback-only transaction. Verified RLS enabled, direct authenticated SELECT/INSERT absent, and synthetic records rolled back to zero rows. These SQL tests do not prove JWT signature verification or actual Clerk token acceptance at the Data API.

Removed unnecessary PUBLIC/anon/authenticated execution on the existing automatic-RLS event-trigger function. Its automatic table protection remains intact. Security advisor now reports three informational RLS-with-no-policy notices (intentional private-table denial) and two warnings for authenticated SECURITY DEFINER RPCs (intentional narrow caller-scoped boundary). No zero-finding security claim. Advisor reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

Vercel connector returned 403 for academy-os2; explicit-scope CLI fallback also failed. Vercel environment values and actual deployed end-to-end bootstrap remain pending user configuration. No service-role credential requested or used.

## Deployment identity update — 21 October 2026

Vercel blocked recent commits because they were authored by the separate moamenghareeb GitHub identity. Owner completed GitHub CLI browser authentication as nahrplatform-rgb. Verified authenticated GitHub user ID 345505218 and ADMIN access to this repository. Repository-local author identity now uses nahrplatform-rgb with its ID-based GitHub noreply address; global Git author configuration and existing commits were not changed. A new owner-account commit retries the deployment; successful hosted build and actual signed-in Supabase bootstrap still require verification.
