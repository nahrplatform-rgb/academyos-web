# Staging service setup — 22 October 2026

## Scope

Owner authorized continuation of the service setup and will retain credentials in their secure vault. This work targets only `academyos-web` under Vercel `academy-os2`, Supabase `snpphkenmvmhpjstbeul`, Redis `fond-mudfish-179090`, QStash EU, Sentry `academyos/academyos-staging`, and Resend `notify.academy.nahr.dev`. Vercel's Production environment serves AcademyOS staging. No production tenant infrastructure or business records are introduced. The owner separately activated Cloudflare R2 billing/terms before the private EU backup bucket was created; no other paid upgrade was made.

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

Only names and public configuration belong here. Owner has reported saving the Upstash token/signing keys, Sentry build token and Vercel callback bypass key in their vault and Vercel Secret variables. Verify deployed use without exposing values. No provider credentials are copied into Git or local .env files. Backup credentials are stored separately as GitHub environment secrets; the age recovery key is held locally with mode 0600 and the owner confirmed a vault copy.

The Vercel connector returns 403 for the AcademyOS scope; the signed-in Chrome dashboard is the available management path. The Upstash connector sees no databases in its authorized account; do not provision a duplicate. Use existing application credentials against the verified staging resource.

## Validation and remaining work

Local unit tests exercise privacy filtering, recipient/sender restrictions, stable email idempotency, QStash key rotation/body/URL/expiry rejection, and fail-closed rate limits. English/Arabic and mobile browser checks continue to pass. Hosted source-map upload, browser/server event receipt, Redis throttling and QStash callback delivery require runtime receipts below.

Still separate: actual email inbox delivery; tenant-aware Storage object tests; scheduled database and object backups to an approved independent destination; restore rehearsal; uptime/alert delivery; production configuration and launch acceptance. A configured key or private bucket is not proof these are complete.

## Sources consulted

- https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- https://supabase.com/docs/guides/storage/buckets/creating-buckets
- https://resend.com/docs/dashboard/emails/idempotency-keys
- Installed pinned Upstash SDKs and their plugin guides for signature verification and rate-limit timeout behavior.

## Rollout receipt

- Source commit `33ad085be1ecc2f7ea9d8d774a98f1fb20864d11` pushed to main under verified `nahrplatform-rgb` identity. GitHub verification check succeeded.
- Local build/typecheck/lint, 15 unit tests and 3 browser tests passed. Production dependency audit reports no known advisories; five pre-existing development dependency advisories remain as documented in the foundation handoff. This is not a comprehensive security audit.
- Initial Vercel deployment `66fB5SzQx5cVavZgPLxqFhNVjoUc` Ready on the exact commit. A subsequent exact-source redeploy `DfqwwZUQAe6TN9ZY6ACyFxZkkncc` includes the temporary setup flag and approved one-mailbox allowlist. Runtime checks completed below.
- Owner explicitly approved one setup email to `nahr.platform@gmail.com` and reported saving the domain-scoped sending key. No email is sent by the generic service-check button; the separate email action requires a deliberate request.
- Authenticated deployed check returned HTTP 200: Redis PING and actual allow/allow/deny throttling passed. QStash published the synthetic test and the callback receipt was subsequently read as `received=true` for `0c0f4dc7-41b8-46db-a3b4-c9357df44b28`.
- Server Sentry event `01db5aaa2115411e9622188c64c2803f` and browser event `23bfbd0790f04b2b9eb3ed4fd40861a2` flushed. Sentry UI independently confirms both issues (`155300875`, `155300876`) in the correct project, with mapped application source locations.
- Email API returned accepted receipt `01a16075-681d-7c27-bfff-e443f75b56c3`; Resend UI independently shows `Delivered` to the approved mailbox with the fixed staging subject. This proves recipient-server delivery, not inbox placement or message reading.
- Owner activated R2 and a private Standard EU bucket `academyos-staging-backups` was created. Public access/development URL/custom domains remain disabled. No destructive lifecycle rule or bucket lock was added. The provider default aborts incomplete multipart uploads after seven days.
- Owner saved the recovery key in their vault. R2 account-token credentials scoped to this bucket and dedicated Supabase backup credentials are present as four GitHub `staging-backups` environment secret names. This environment permits only the `main` branch. The verified session pooler host is `aws-0-eu-west-1.pooler.supabase.com`.
- Backup source and recovery instructions are in [scripts/backups](../../scripts/backups/README.md). Daily 02:17 UTC/manual export is staging-only, encrypted before upload, checks the complete downloaded ciphertext, and distinguishes publication from restoration. No deletion/retirement is automated. Initial hosted publication/restoration receipt is still pending.
- Six adversarial backup tests passed. A local synthetic database/file roundtrip using real PostgreSQL 17 and age passed encryption/decryption, file checksums, restoration and the membership boundary suite. Run `9f716de5-d25b-4946-9a03-4e2a49b02232` is synthetic only; it contacted neither Supabase nor R2.
- Sentry project IP prevention/default scrubbers are enabled. Additional sensitive fields and advanced rule `[Remove] [Anything] from [$user.geo.**]` are saved. Fresh browser event `3c8b72df783c4091b4b91b03000593af` was independently inspected: no user/geolocation/request context appears, while mapped application source is retained. Historical events are unaffected.
- `SERVICE_SETUP_ENABLED=false` is saved and independently revealed in Vercel. It requires a new deployment; authenticated route closure remains to be checked after rollout.
