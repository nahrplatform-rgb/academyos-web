# Environment, credential-reference and DNS registers

> Current execution status (22 October 2026): actual resource bindings and credential names are consolidated in [the current configuration register](../07-handoff/configuration-status.md). The dated observations below are preserved history; claims such as no deployment/unapplied integrations are superseded by the [execution record](../07-handoff/setup-history.md).

Actual IDs/values remain **unfilled and unverified** except for the dated records below. This document contains no secret credential values. Fill account-specific metadata during authorized setup and put secret values only in the vault/provider secret store.

## Setup evidence — 21 October 2026

Latest Vercel screenshot and owner confirmation: workspace `AcademyOS` (`academy-os2`) is on Hobby (free); Projects overview shows no project deployed. Commercial deployment plan remains unresolved: current official Hobby guidance restricts it to personal noncommercial use (`https://vercel.com/docs/plans/hobby`). No upgrade, project import or deployment performed. Resolve eligible hosting before deploying this commercial SaaS, including its staging deployment.

Resend Configuration screenshot: tracking metrics offered through an unconfigured Configure action; individual click/open toggles not shown. TLS dropdown displays Opportunistic. No settings changed in this inspection.

### Resend — sending domain verified

Latest supplied screenshot on 21 October 2026 shows domain `notify.academy.nahr.dev` Verified, DKIM TXT and both sending CNAMEs Verified, Resend Forge Enabled, Ireland (`eu-west-1`), sending enabled and receiving disabled. This supersedes earlier Pending observations below. Application integration, API-key custody, tracking settings, test delivery and message authentication/alignment remain unverified.

Follow-up DNS verification on 21 October 2026: after correction of the first CNAME target, direct authoritative queries return `rsend.notify.academy.nahr.dev` → `rsend-euw1.forge.rmta.net.` and `send.notify.academy.nahr.dev` → `send.forge.rmta.net.`. TXT at `resend._domainkey.notify.academy.nahr.dev` is present, but full equality with the provider-issued DKIM value has not been checked because the supplied provider screenshot truncates it. Cloudflare screenshot shows DNS-only records. Both root iCloud MX records remain present. These checks supersede the earlier missing-record observation below. Resend Verified status and actual message delivery remain pending.

- Owner reports signup using GitHub and saving the three requested Cloudflare records.
- Screenshot identifies domain `notify.academy.nahr.dev`, resource ID `8706bb64-bc23-4979-83bd-0c81346d53a9`, Ireland (`eu-west-1`), status Pending / Checking DNS.
- Sending enabled; receiving disabled. Click/open tracking state remains unverified.
- Requested sending CNAMEs visible in screenshot: `rsend.notify.academy.nahr.dev` → `rsend-euw1.forge.rmta.net`; `send.notify.academy.nahr.dev` → `send.forge.rmta.net`. DKIM TXT content is truncated in screenshot and has not been transcribed.
- Public recursive DNS and direct queries to authoritative `rory.ns.cloudflare.com` returned no records for those two CNAME names or TXT at `resend._domainkey.notify.academy.nahr.dev` during this check. Actual saved Cloudflare names/values require inspection; domain verification is not complete.
- Root MX lookup still returns both iCloud mail servers at priority 10. No DNS mutations performed by the assistant. API keys, application delivery, tracking configuration and test-message authentication remain pending.

### Sentry — onboarding screenshots

- Owner reports signup using GitHub. Organization slug: `academyos`; organization URL: `https://academyos.sentry.io`.
- Creation form screenshot shows European Union (EU) storage selected; account-side residency settings have not been independently inspected.
- Onboarding displays an active trial with 14 days left on 21 October 2026. Post-trial plan and billing settings remain unverified; no paid upgrade authorized.
- Next.js setup screenshot identifies original project slug `javascript-nextjs`, automatically created during onboarding. Moamen subsequently confirmed renaming it to `academyos-staging`; provider rename warning text was not supplied and remains uninspected.
- Screenshot shows `Waiting for error`; SDK installation, DSN capture, privacy configuration, release/environment tags, alert delivery and synthetic error verification remain pending. No monitoring readiness claimed.
- GitHub repository integration and chat alert integrations were deferred in the guided setup; exact provider settings remain unverified. No onboarding run code or authentication secret stored.

### QStash EU — screenshot evidence

- Supplied screenshot on 21 October 2026 shows EU Region, AWS `eu-central-1`, Free plan.
- Console resource identifier from screenshot URL: `ff0c1f1d-ac26-42dc-a1cb-1e8cf10bffe8`.
- `QSTASH_URL`: `https://qstash-eu-central-1.upstash.io` (public endpoint shown by provider).
- `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` are masked in the screenshot; no secret values captured in this register. Private credential storage is not yet confirmed.
- Dashboard shows zero messages and workflow runs. Availability of credentials is evidenced; application callbacks, signature verification, retries, schedules, queues, environment isolation and delivery tests remain pending. This is a regional account resource, not evidence of a dedicated staging queue or separate production credentials.

This updates earlier entries that described QStash configuration as pending; application configuration remains pending.

### Upstash account — owner report and screenshot

Follow-up creation evidence supplied on 21 October 2026 supersedes the account-only status below:

- Redis database: `academyos-staging`; ID: `475a4080-a7be-4afc-bb1e-8acfbc77742a`.
- Plan: Free Tier (selected by Moamen and visible in screenshot).
- Primary region: AWS Ireland (`eu-west-1`); dashboard also displays `Global`, which does not establish additional read-region configuration.
- REST URL: `https://fond-mudfish-179090.upstash.io` (non-secret endpoint).
- TLS/SSL: enabled; eviction: off, both visible in supplied screenshots.
- Screenshot displays allowances of 500k commands/month, 10 GB bandwidth and 250 MB storage; these are dated dashboard evidence, not guaranteed future limits.
- Tokens are masked; no secret values recorded. Vault custody, scoped ACL credentials, account MFA/recovery and application rate-limit behavior remain unverified. Security panel shows several upgrade-gated controls; no upgrade authorized or performed.
- QStash configuration remains pending.

- Moamen reports signup using GitHub on 21 October 2026; supplied screenshot shows the Upstash home dashboard in the Personal workspace.
- Account creation is evidenced; Redis database creation, region, plan, credentials, security/recovery settings and application connectivity remain unverified. QStash has not been configured according to current evidence.

### Clerk staging identity — screenshot evidence

- Application: `AcademyOS Staging`; instance: `Development`; workspace: `Personal Workspace` (Hobby label visible in supplied screenshot).
- Clerk domain / issuer: `https://immune-grizzly-7875.clerk.accounts.dev` (public configuration supplied by Moamen).
- Supabase compatibility: `Enabled` in the supplied Clerk setup screenshot on 21 October 2026.
- Earlier authentication screenshot shows required email, verification at signup and email-code authentication enabled. Other sign-in settings have not been comprehensively verified.
- Supabase-side registration: supplied screenshot on 21 October 2026 shows Clerk `ENABLED` in project `snpphkenmvmhpjstbeul` (`academyos-staging`), with domain `https://immune-grizzly-7875.clerk.accounts.dev` and successful creation notification. Both dashboard configuration steps are evidenced; token acceptance, application integration and tenant authorization remain untested.
- Production identity configuration remains separate and unverified. No secret keys recorded.

### Supabase staging project — owner-confirmed creation

- Project name: `academyos-staging`.
- Project reference / ID: `snpphkenmvmhpjstbeul`.
- Region: `eu-west-1`.
- Dashboard: `https://supabase.com/dashboard/project/snpphkenmvmhpjstbeul`.
- Status: creation and identifiers reported by Moamen on 21 October 2026; not independently inspected through the provider.
- Owner-confirmed security settings: “Automatically expose new tables” unchecked; “Enable automatic RLS” checked. Confirmed by Moamen on 21 October 2026; not independently inspected.
- Pending verification: actual plan, password custody, connection health and access roles; independent inspection of the confirmed security settings.
- No application connection, migrations, schema, tenant policies, storage buckets or Clerk integration have been verified. Production project remains unprovisioned according to the current record.

This supersedes the earlier account-only Supabase status below.

Follow-up owner confirmation: both Vercel and Supabase accounts are secured. Specific security controls and recovery methods have not been independently inspected. Initial academy customers will mainly be in Egypt; this establishes the primary market, not the contracting entity, currency, data-region decision or cross-border policy. Supabase region selection remains pending.

| Item | Recorded value | Evidence / remaining checks |
|---|---|---|
| GitHub repository | `https://github.com/nahrplatform-rgb/academyos-web.git` | Supplied by Moamen. Current CLI account could not resolve the repository; visibility, permissions, default branch, plan and protections remain unverified. Do not create a duplicate. |
| Repository description | AcademyOS — Multi-tenant sports academy management SaaS | Supplied by Moamen; provider value not inspected. |
| Vercel account | Created using GitHub login; screenshot shows workspace `AcademyOS`, URL team slug `academy-os2` | Reported account-only setup. Screenshot shows private `academyos-web` available for import. No project import/deployment claimed; plan, permissions and recovery remain unverified. |
| GitHub access through Vercel | Repository visible in import list with private lock icon | Screenshot supplied by Moamen on 21 October 2026. Confirms Vercel repository visibility; does not resolve local CLI access or verify branch protections. |
| Supabase account | Created using GitHub login | Reported by Moamen as account-only setup. No database project created according to this report; organization, plan, region and access remain unverified. |
| iCloud+ addresses | `hello@nahr.dev`, `support@nahr.dev`, `admin@nahr.dev` | Reported configured by Moamen; sending/receiving not tested. |
| Cloudflare DNS and 2FA | Reported complete | Supplied by Moamen. Dashboard access, recovery custody and account configuration not inspected. |
| Root MX | Priority 10: `mx01.mail.icloud.com.` and `mx02.mail.icloud.com.` | Public DNS lookup matched both records. |
| Root SPF | `v=spf1 include:icloud.com ~all` | Public DNS lookup matched. |
| Apple domain verification TXT | Present | Public DNS lookup matched the user-supplied verification record. |
| iCloud DKIM CNAME | `sig1._domainkey.nahr.dev` → `sig1.dkim.nahr.dev.at.icloudmailadmin.com.` | Public DNS lookup matched the CNAME; signed-message validation not performed. |
| DMARC | `_dmarc.nahr.dev`: `v=DMARC1; p=none; rua=mailto:8df4ce0f4f3948fbbff3b602a3229fb4@dmarc-reports.cloudflare.net` | Public DNS lookup matched; policy is monitoring-only. |

Public DNS evidence does not establish mailbox delivery, Cloudflare 2FA, dashboard proxy settings or application email readiness. No provider setting, DNS record or GitHub repository was changed during this inspection.

## Environment matrix

| Environment | Origin | Identity | Database/storage | Email/payment | Access |
|---|---|---|---|---|---|
| Local | Actual localhost port | Nonproduction Clerk or isolated test verifier | Disposable local stack/synthetic data | Sink; disabled/sandbox | Developer only |
| Automated test | Isolated runner | Controlled fixtures; selected integration tests separate | Fresh migrations/fixtures | Fakes/sandbox; no real recipients | CI scope |
| Preview | Actual protected deployment URL | Nonproduction allowed origins | Isolated test resources or safely shared synthetic reads | Sink/allowlist; sandbox | Reviewed collaborators |
| Staging | Proposed `https://staging.academy.nahr.dev` | Dedicated nonproduction issuer configuration | Dedicated staging project/buckets | Allowlist; sandbox | Protected acceptance users |
| Production | Selected `https://academy.nahr.dev` | Production AcademyOS issuer | Dedicated production project/buckets | Verified sender; live only after gate | Real permitted users |

Public preview origins may be dynamic. Decide a safe Clerk origin strategy: stable branch domain or explicit reviewed origins, not unrestricted wildcard trust. A nonproduction issuer is never accepted by production.

## Configuration key register

Names below are proposed application contracts. Provider SDKs may require a documented adapter; exact names must be validated at implementation. P = public configuration; C = server configuration; S = server secret; B = restricted build/release secret. Every key gets an environment-specific value/reference.

| Key / group | Class | Source / intended consumer |
|---|---|---|
| `APP_ENV` | C | Explicit local/test/preview/staging/production enum |
| `NEXT_PUBLIC_APP_URL` | P | Approved canonical origin for that build |
| `DEFAULT_LOCALE`, `SUPPORTED_LOCALES` | C | Proposed en; en,ar, validated parser |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | P | Matching Clerk instance |
| `CLERK_SECRET_KEY` | S | Approved server identity operations |
| `CLERK_ISSUER_URL`, `CLERK_AUTHORIZED_PARTIES` | C | Exact instance and approved origins |
| `CLERK_WEBHOOK_SIGNING_SECRET` | S | Exact Clerk webhook endpoint |
| Clerk sign-in/up path settings | P | Match installed SDK and real routes |
| `NEXT_PUBLIC_SUPABASE_URL` | P | Matching project API base URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | P | Matching publishable key; RLS still required |
| `SUPABASE_SECRET_KEY` | S | Restricted privileged adapter only; never general browser client |
| `DATABASE_URL` | S | Approved runtime connection if direct SQL is used |
| `DATABASE_MIGRATION_URL` | B | Migration-only compatible connection |
| `SUPABASE_ACCESS_TOKEN` | B | Scoped management/CLI token when required |
| `SUPABASE_PROJECT_REF` | C | Non-secret target assertion for release tooling |
| `STORAGE_MEDIA_BUCKET`, `STORAGE_PROOF_BUCKET`, `STORAGE_SUPPORT_BUCKET`, `STORAGE_EXPORT_BUCKET` | C | Private bucket names from runbook |
| `SIGNED_DOWNLOAD_TTL_SECONDS` | C | Approved short expiry, proposed 60–300 seconds by resource |
| `UPSTASH_REDIS_REST_URL` | C | Matching Redis resource endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | S | Rate-limit write credential |
| `RATE_LIMIT_NAMESPACE` | C | Environment + policy version |
| `QSTASH_TOKEN` | S | Publisher only |
| `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | S | Receiver rotation pair |
| `QSTASH_URL`, `JOB_CALLBACK_BASE_URL` | C | Actual selected region/API and stable callback origin |
| `JOB_PROTECTION_BYPASS_SECRET` | S | Only if hosting requires supported machine bypass |
| `EMAIL_PROVIDER` | C | sink/smtp/resend/disabled validated enum |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | C | Verified sender and monitored reply mailbox |
| `EMAIL_ALLOWED_RECIPIENTS` | C | Nonproduction allowlist; reject unrestricted nonprod sends |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_TLS_MODE`, `SMTP_USER` | C | Development-only SMTP configuration |
| `SMTP_PASSWORD`, `RESEND_API_KEY`, `EMAIL_WEBHOOK_SIGNING_SECRET` | S | Only the selected adapter's credentials |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | P/C | DSN may be public; account auth token is not |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` | C | Correct project/environment/release metadata |
| `SENTRY_AUTH_TOKEN` | B | Restricted source-map upload |
| `PAYMENTS_PROVIDER`, `PAYMENTS_MODE` | C | Disabled until approved; explicit test/live |
| Provider merchant/integration/catalog IDs | C | Approved provider-specific adapter configuration |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | S | Only if Stripe selected |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | P | Only if selected checkout requires it |
| Paymob API/secret/HMAC keys | S | Exact API-generation-specific names in adapter addendum |
| Kashier server secret / Payment API Key | S | Separate documented purposes; never assume interchangeability |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | P/S | Optional approved widget and server validator |
| Backup endpoint/bucket/access key/secret | C/S | Recovery job only; never application browser/runtime by default |
| `VERCEL_TOKEN`, organization/project IDs | B/C | Only selected release tooling; use scoped access where available |
| Infisical machine identity/bootstrap values | B/S | Only if selected; scope to environment/path |

Optional integrations must validate as disabled when credentials are absent. Core required values fail startup with safe names-only errors. Production rejects nonproduction issuers, sandbox payment mode for an enabled live-payment feature, test sender domains and local database URLs. Preview rejects production project references and live payment credentials.

## DNS desired-state register

| Host | Type | Value source | Proxy | Status |
|---|---|---|---|---|
| `nahr.dev` mail | MX/TXT/CNAME as issued | Existing iCloud configuration | DNS-only where applicable | Reported existing; inspect/preserve |
| `academy.nahr.dev` | Provider-issued record | Exact Vercel production project target | DNS-only proposed | Not verified |
| `staging.academy.nahr.dev` | Provider-issued record | Exact staging target | DNS-only proposed | Proposed, not created |
| Clerk-issued hostnames | CNAME/TXT as issued | Exact production Clerk dashboard | DNS-only | Not created/verified |
| `notify.academy.nahr.dev` and issued selectors | TXT/CNAME/MX as issued | Selected transactional provider | DNS-only | Proposed, not created |
| Domain ownership TXT | TXT | Exact provider verification token | Not proxied | Only if requested |
| `_dmarc` at appropriate sender scope | TXT | Approved deliverability policy | Not proxied | Existing root policy reported; inspect |

Record actual name/type/value/TTL/proxy state, change owner, previous value, evidence and rollback for every executed change. Do not put sample Vercel/Clerk targets into live DNS.

## Endpoint register

For each Clerk/payment/email webhook and job callback record environment, exact HTTPS URL, event allowlist, signature algorithm/SDK, secret reference, timeout, retry policy, body-size limit, protection bypass mechanism if any, last test and owner. Production and staging endpoints have separate secrets and provider subscriptions. Public exposure of a callback is acceptable only with its documented authentication and abuse controls.
