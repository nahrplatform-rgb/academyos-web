# Current staging configuration register

Updated 22 October 2026. Current configuration and proof are distinct. [Execution history](setup-history.md) explains the order; [service receipts](service-setup.md) retain exact identifiers. Never copy credential values here.

## Environment and resource bindings

| Layer | Actual binding | Current evidence / limit |
|---|---|---|
| Workspace | `/Users/moamenghareeb/AcademyOS`; web source `apps/web` | Canonical local repository; private GitHub origin |
| GitHub | `nahrplatform-rgb/academyos-web`, main | Correct owner CLI/commit identity; checks passing at latest recorded source `6ca2b25` |
| Vercel | team `academy-os2`, project `academyos-web`, Hobby | Deployed private staging; Vercel Production is AcademyOS staging; commercial launch plan still a gate |
| Staging origin | `https://staging.academy.nahr.dev` | Valid DNS/TLS and browser health; EN/AR entry routes |
| Original hostname | `https://academyos-web.vercel.app` | Protected; page GET/HEAD redirect to canonical staging; API routes keep canonical validation |
| DNS authority | Cloudflare account `3fda84919501e78157a07d5225d61299`, zone nahr.dev | Nameservers retained; staging CNAME `ff2f9c41e048d8bd.vercel-dns-017.com`, DNS only; root iCloud mail retained |
| Clerk | AcademyOS Staging, Development issuer `https://immune-grizzly-7875.clerk.accounts.dev` | Actual registration/verification/sign-in; explicit approved origins; no automatic academy authority |
| Supabase | `snpphkenmvmhpjstbeul`, eu-west-1, PG17 | Four applied migration files; actual identity boundary and restored-data checks. Production project not provisioned |
| Redis | `https://fond-mudfish-179090.upstash.io` | Deployed PING and allow/allow/deny rate limit passed; no raw subject keys/analytics |
| QStash | EU `https://qstash-eu-central-1.upstash.io` | Signed synthetic callback delivered; no business outbox/jobs implemented |
| Application email | Resend, `notify.academy.nahr.dev`, eu-west-1 | Domain verified; sender `notifications@notify.academy.nahr.dev`, reply `support@nahr.dev`, test allowlist `nahr.platform@gmail.com`; recipient-server delivery passed |
| Sentry errors | org `academyos`, project `academyos-staging` (`4512294699728976`), EU project | Browser/server events and source maps verified; strict source/provider privacy filtering; no replay/traces/logs/metrics |
| Sentry uptime | monitor `2491612`, GET `/api/health`, environment staging | Scheduled check-ins verified: HTTP 200, displayed 100% uptime; alert routing/delivery is being tightened. Check data may be outside EU |
| Sentry project alert | `1400964`, Send a notification for high priority issues | Existence verified; recipient/action delivery to refresh |
| Independent backup | private Standard EU R2 `academyos-staging-backups` | Encrypted upload/download, actual local database restoration and first scheduled run passed; no hosted object restoration proof |
| Backup endpoint | `https://3fda84919501e78157a07d5225d61299.eu.r2.cloudflarestorage.com` | Exact EU endpoint; private bucket, no public URL/custom domain |
| Payments | Disabled | No gateway or live merchant credentials configured; provider/entity/money-flow decisions remain |

## Security settings and deliberate boundaries

- Vercel Authentication covers All Deployments; source maps protected. Callback/monitor automation uses the owner's saved bypass key. That bypass does not create a Clerk session or academy membership.
- Supabase automatic table exposure is off; auto-RLS protection is on. Private academy tables have RLS without direct client policies. Only narrow caller-derived RPCs are intentionally callable by authenticated roles. Advisor rationale is recorded, not dismissed as a full audit pass.
- Server-side database SSL enforcement was enabled on 22 October; the provider completed its restart and the dashboard switch was verified on. Backup clients retain verify-full and the pinned provider CA. A post-change encrypted backup is being verified.
- The four Storage buckets are private. No tenant client upload/download policies exist yet; this is deliberate until permission implementation.
- `SERVICE_SETUP_ENABLED=false`; temporary verification routes are closed after proof. Process health is only process liveness.
- Public app Data API calls use the publishable key/current Clerk token. Privileged backup credentials are not app runtime credentials.

## Private bucket inventory

| Bucket | Maximum file size | Allowed MIME types | Client access |
|---|---:|---|---|
| academy-media | 10 MiB | JPEG, PNG, WebP | No client policies yet |
| payment-proofs | 10 MiB | JPEG, PNG, WebP, PDF | No client policies yet |
| support-attachments | 10 MiB | JPEG, PNG, WebP, PDF | No client policies yet |
| exports | 20 MiB | CSV, PDF, XLSX | No client policies yet |

## Credential location and purpose — names only

| Store | Names | Use / verification |
|---|---|---|
| Vercel staging Secret | CLERK_SECRET_KEY | Matching Development instance; real sign-in/identity connection |
| Vercel staging Config | NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Browser-safe keys/URL; authenticated server boundary still enforces scope |
| Vercel staging Secret | UPSTASH_REDIS_REST_TOKEN | Verified actual Redis commands/rate limiting |
| Vercel staging Secret | QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY | Publisher and rotating signature checks; delivered callback |
| Vercel staging Secret | RESEND_API_KEY | Domain-scoped sending; approved fixed-recipient setup delivery |
| Vercel staging Secret | SENTRY_AUTH_TOKEN | org:ci source-map/release upload; upload and mapped source verified |
| Vercel protection store + staging Secret | JOB_PROTECTION_BYPASS_SECRET / staging-callbacks | Same owner-created bypass value; signed callback and uptime test passed; also saved in Sentry uptime header by owner |
| Vercel Config | APP_ENV, NEXT_PUBLIC_APP_URL, QSTASH_URL, JOB_CALLBACK_BASE_URL, EMAIL_*, STORAGE_*_BUCKET, SENTRY_*, SERVICE_SETUP_ENABLED | Exact staging bindings; APP_ENV existing entry is stored as Secret; no duplicate needed |
| GitHub environment staging-backups Secret | BACKUP_DATABASE_PASSWORD, BACKUP_SUPABASE_SECRET_KEY | Existing DB password + dedicated sb_secret key; DB and actual Storage API bucket-list checks passed |
| GitHub environment staging-backups Secret | R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY | Token scoped to backup bucket; actual upload and read-back passed |
| GitHub environment staging-backups variable | BACKUP_DATABASE_HOST | Verified session pooler `aws-0-eu-west-1.pooler.supabase.com`, port fixed 5432 |
| Owner vault + local restricted file | age recovery key | Vault copy owner-confirmed; local encryption/decryption pairing and actual restore passed; never stored in GitHub/Vercel |

No provider token, password, private key, bypass value, browser session or restored identity value is included in this register. Owner is the current accountable operator; independent backup operator/recovery-custody testing remains a launch governance decision.

## Schedule, recovery and cost boundaries

Backup workflow: daily 02:17 UTC, currently 05:17 Cairo on 22 October. Cairo daylight-saving changes affect local display, not the UTC schedule. GitHub can delay dispatch; first scheduled run started around 02:43 UTC. This is an initial daily staging cadence, not the proposed one-hour production RPO.

No application backup deletions/retention rule or bucket lock was applied at the previous stop. Only the provider's default incomplete-multipart-abort rule exists. R2 billing was activated by the owner; no other paid plan upgrade is recorded. Production regions/plans/retention/cost caps must be explicitly reviewed before customer data. Refer to [remaining work](remaining-configuration.md).
