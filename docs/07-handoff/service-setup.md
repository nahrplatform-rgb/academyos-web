# Staging service setup — 22 October 2026

## Scope

Owner authorized continuation of the service setup and will retain credentials in their secure vault. This work targets only `academyos-web` under Vercel `academy-os2`, Supabase `snpphkenmvmhpjstbeul`, Redis `fond-mudfish-179090`, QStash EU, Sentry `academyos/academyos-staging`, and Resend `notify.academy.nahr.dev`. Vercel's Production environment serves AcademyOS staging. No production tenant infrastructure, paid upgrades or business records are introduced.

## Implemented source

- Staging URL validated and used for metadata. The legacy Vercel hostname redirects page GET/HEAD requests to staging on hosted production deployments. Clerk tokens are restricted to explicit approved origins; no wildcard origins.
- Sentry browser/server/edge initialization with a strict event allowlist. User information, HTTP payloads/headers/cookies/query parameters, breadcrumbs, arbitrary error text, extra context, logs, metrics, performance tracing and session replay are excluded. Error class, safe frame positions, release, environment and source-map debug identifiers remain. Source-map generation/upload is enabled only when the build token exists; generated maps are deleted after upload.
- Redis rate-limit adapter uses the exact staging endpoint, short request timeouts and hashed subjects. SDK permissive timeout results are rejected. No rate-limit analytics containing user identifiers.
- QStash receiver verifies signature, issuer, raw-body digest, expiry and exact canonical callback URL, with current/next signing keys. The only implemented job is a synthetic setup receipt. Repeated deliveries write the same Redis receipt using SET NX and a one-hour expiry; no business side effects exist.
- Email setup adapter accepts one configured mailbox, the exact staging sender and reply address, and a fixed test message. Provider idempotency uses the deployment commit, with Resend's 24-hour retention. This is not durable business-email dispatch or an invitation implementation.
- `/en/service-setup` and its setup endpoints require `SERVICE_SETUP_ENABLED=true`, staging configuration and Clerk authentication. Browser write requests also require the canonical Origin. The receiver requires QStash authentication. The screen creates only synthetic events/keys. Disable the setup flag after verification. Do not use these endpoints for ordinary operations.

## Hosted storage receipt

Migration `20261021212039_private_staging_buckets.sql` applied to the named staging project. Verified four nonpublic buckets: `academy-media`, `payment-proofs`, `support-attachments`, `exports`; explicit size and MIME limits are in the migration. `storage.objects` has RLS and no client policies. Uploads and signed downloads intentionally remain unavailable pending tenant-aware authorization and actual object-access tests. No file bytes uploaded.

Security advisor still reports the pre-existing three private tables without client policies and two deliberately callable narrow SECURITY DEFINER identity/membership RPCs. This is not a zero-finding security assessment. Review rationale in membership-connection.md. Advisor reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Credential custody

Only names and public configuration belong here. Owner has reported saving the Upstash token/signing keys, Sentry build token and Vercel callback bypass key in their vault and Vercel Secret variables. Verify deployed use without exposing values. No credentials are copied into Git or local .env files.

The Vercel connector returns 403 for the AcademyOS scope; the signed-in Chrome dashboard is the available management path. The Upstash connector sees no databases in its authorized account; do not provision a duplicate. Use existing application credentials against the verified staging resource.

## Validation and remaining work

Local unit tests exercise privacy filtering, recipient/sender restrictions, stable email idempotency, QStash key rotation/body/URL/expiry rejection, and fail-closed rate limits. English/Arabic and mobile browser checks continue to pass. Hosted source-map upload, browser/server event receipt, Redis throttling and QStash callback delivery require runtime receipts below.

Still separate: actual email inbox delivery; tenant-aware Storage object tests; scheduled database and object backups to an approved independent destination; restore rehearsal; uptime/alert delivery; production configuration and launch acceptance. A configured key or private bucket is not proof these are complete.

## Sources consulted

- https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- https://supabase.com/docs/guides/storage/buckets/creating-buckets
- https://resend.com/docs/dashboard/emails/idempotency-keys
- Installed pinned Upstash SDKs and their plugin guides for signature verification and rate-limit timeout behavior.
