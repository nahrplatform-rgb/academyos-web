# Service directory and setup order

Prepared and public guidance checked 21 October 2026. **All setup steps are instructions for future execution, not changes made by this task.** Account names, IDs, regions, DNS targets and credentials must be obtained from the actual account. Proposed choices are subject to the decision register.

## Services and their purpose

| Service | Decision / purpose | When needed | Runbook |
|---|---|---|---|
| GitHub | Selected repository, review and CI | Before foundation | [GitHub](01-github.md) |
| Cloudflare | Selected domain/DNS authority; domain reported configured | Before domain integration | [DNS](02-cloudflare-and-dns.md) |
| Vercel | Selected web hosting; Pro proposed for commercial use | Foundation test deployment | [Vercel](03-vercel.md) |
| Clerk | Selected authentication; separate production issuer | Foundation | [Clerk](04-clerk.md) |
| Supabase | Selected PostgreSQL and private storage | Foundation | [Supabase](05-supabase.md) |
| Upstash Redis | Selected initial rate limits | Before exposed mutation flows | [Redis](06-upstash-redis.md) |
| PostgreSQL outbox + QStash | Durable job model selected in design; QStash proposed transport | First asynchronous workflow | [Jobs](07-background-jobs.md) |
| iCloud Mail | Selected company correspondence; reported configured | Verify existing setup | [Email](08-email-and-domain-delivery.md) |
| Gmail DEV SMTP | Selected temporary development-only option; eligibility unverified | Optional controlled testing | [Email](08-email-and-domain-delivery.md) |
| Resend | Proposed application transactional email | Before real external app email | [Email](08-email-and-domain-delivery.md) |
| Sentry | Proposed error/performance monitoring | Foundation staging | [Observability](09-observability.md) |
| Checkly or equivalent uptime service | Proposed external availability/synthetic checks | Before pilot | [Observability](09-observability.md) |
| Password vault + optional Infisical | Named access/recovery and managed secrets | Before credentials are created | [Secrets](10-secrets-and-access.md) |
| Stripe / Paymob / Kashier | Conditional candidates; entity and merchant decisions open | Sandbox before payment development | [Payments](11-payments.md) |
| Supabase backups + separate object backup | Recovery design; plan/retention to approve | Before real data | [Backup](12-storage-backups-and-recovery.md) |
| Cloudflare R2 | Optional independent backup destination, not a second default app store | If selected for recovery | [Backup](12-storage-backups-and-recovery.md) |
| Turnstile | Optional abuse control for exposed forms | If threat/traffic warrants | [Optional services](13-optional-services-and-future-platforms.md) |
| Expo/EAS, Apple, Google, APNs/FCM, Tauri signing | Future platform distribution and push | Native phase only | [Future platforms](13-optional-services-and-future-platforms.md) |
| Product analytics, SMS/WhatsApp, search, AI | Optional, purpose and budget required | Later validated need | [Optional services](13-optional-services-and-future-platforms.md) |

Do not create every optional account before development. Each additional service adds credentials, privacy review, cost and failure modes. The selected core supports the planned web product; optional integrations remain explicitly off until a requirement justifies them.

## Setup sequence and dependency gates

**A — Decisions and ownership before coding.** Confirm repository identity, named service owners, organization/billing owner, budget ceiling, domain authority, operating country/region, environment topology and pilot scope. Establish vault/recovery custody. Complete the required policy decisions for the first implementation slice.

**B — Accounts and configuration preparation.** Inspect existing GitHub/Cloudflare/iCloud state; create or reserve approved nonproduction service resources; set MFA/access roles; document project IDs and scopes. Prepare DNS changes and secret mappings without publishing unused routes. Production secrets stay out of nonproduction.

**C — Foundation integration.** A minimal app and database migrations are now necessary to verify callbacks, RLS, health routes, CI and deployment protection. Create the first deployment with explicit nonproduction configuration. Configure stable staging DNS, Clerk integration, webhook endpoints, Redis, job transport and monitoring. These cannot honestly be called tested before the test handlers exist.

**D — Feature sandbox verification.** Add transactional email, payment sandbox, storage finalization and provider retries as their workflows are implemented. Use controlled recipients and synthetic people. Complete permissions, failure and reconciliation cases.

**E — Real-data / production gate.** Approve commercial policies, provider plans, retention, region, backup/restore evidence, security results and owner acceptance. Configure live credentials and exact domains through a reviewed change. Run smoke checks on the intended deployment before opening customer access.

## Common configuration record

Every service record needs: purpose; status; accountable owner and backup; organization/project/resource ID; environment; region; billing plan and spend alert; data classes processed; credential names and vault references; allowed origins/endpoints; access roles; retention; verification evidence; rotation/recovery procedure; and last review date. Record non-secret metadata in the [registers](14-environment-and-dns-registers.md). Store secret values only in the selected vault/provider secret store.

## Marketplace and provider review

Read-only Vercel Marketplace discovery on 21 October 2026 for messaging/observability/payments/workflow/security returned Upstash Redis, Upstash QStash/Workflow, Resend, Sentry, Checkly and Stripe among relevant options. It did not install anything or verify an account's eligibility. Prefer a native integration where its environment mapping and access scope meet this handbook, otherwise configure the provider directly. Preserve one billing/resource owner and avoid accidentally creating duplicate databases. See the [provider source review](15-provider-sources-and-review-notes.md) for the public references used in this pack.

Current prices, quotas, regional availability and plan-gated controls must be captured at setup. Do not use historical “free tier” assumptions as a production budget or security plan.
