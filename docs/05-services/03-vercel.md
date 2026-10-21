# Vercel configuration runbook

Selected hosting provider. Proposed plan: **Pro for this commercial SaaS**, subject to budget approval. Hobby is restricted to personal noncommercial use; the historical free-plan assumption should not govern AcademyOS. [Vercel Hobby](https://vercel.com/docs/plans/hobby)

## Project and environment topology

Use the NAHR-owned team, named owner/backup and MFA. Link only the confirmed AcademyOS repository through the GitHub integration. Proposed application root is `apps/web` after scaffolding. Select Next.js framework detection, the repository's pinned package manager, lockfile install, build command and compatible supported Node runtime. Record exact resolved versions in the foundation evidence.

Target environments: Development, Preview, protected stable Staging and Production. Vercel custom environments are plan-dependent; Pro/Enterprise support them. If the selected topology cannot safely isolate staging, use a separate nonproduction project with explicit resources instead of quietly sharing production. **The first project deployment uses Production environment variables**, so initial bootstrap must deliberately contain only the approved nonproduction setup or remain undeployed until configured. [Vercel environments](https://vercel.com/docs/deployments/environments)

| Setting | Proposed configuration |
|---|---|
| Project ownership | NAHR team, exact IDs recorded |
| Production hostname | `academy.nahr.dev` after release approval |
| Staging hostname | `staging.academy.nahr.dev`, protected |
| Preview | Protected deployment URLs; synthetic data and test providers |
| Region | Near selected database region, after D-019 |
| Build | Frozen dependency installation; type/build checks recorded |
| Runtime | Supported Node version pinned across local/CI/hosting |
| Logs | Redacted request/operation IDs; retention/cost recorded |
| Spend controls | Budget alerts and reviewed hard-limit behavior where supported |

## Variables and integrations

Enter public values as Config and sensitive values as Secret where the dashboard supports that distinction. Current Vercel guidance distinguishes readable Config from write-only Secret. Changes apply to new deployments, not already running builds. Verify each variable's environment and branch/custom-environment mapping. [Environment variables](https://vercel.com/docs/environment-variables)

Use the [environment register](14-environment-and-dns-registers.md). In particular, Clerk keys/issuer, Supabase URL/keys, Redis, QStash, email, Sentry and payment mode must form a consistent environment set. Provider marketplace integrations may map a custom environment to a provider's Preview/default resource; inspect the actual mapping and reject production inheritance. Do not export production secrets to a developer laptop for routine setup.

## Deployment controls

Protect preview/staging with the available deployment protection mechanism. Webhooks and job callbacks need a reviewed machine-access path: use a narrowly scoped supported bypass credential/header or route exception, plus the provider's own signature validation. Do not disable protection for the whole site just to make callbacks work. Keep bypass credentials server-side and out of share links/logs.

A Git-connected production deployment may start without waiting for GitHub CI. Choose and prove an enforced release mechanism: supported Deployment Checks, or staged production deployment followed by authorized promotion after tests. A test of a preview build does not automatically prove a later production rebuild with different variables.

Proposed release: pass checks → apply compatible migration under release control → build production target without assigning live domain → verify that deployment with production-safe checks → explicitly promote → monitor. Use current CLI/dashboard commands at execution and capture deployment ID/commit/build environment; this document does not execute them.

## Security, performance and caching

Enable suitable Vercel firewall/rate controls and review their plan limits. Do not rely on Cloudflare WAF when DNS is DNS-only. Restrict public caching to genuinely public content. Authenticated API, finance, personal data, callbacks and private artifacts require explicit cache policy. Set upload/body/time budgets and route large work through bounded jobs instead of extending every request timeout.

Configure security headers after Clerk/payment/embed tests. Verify source maps are uploaded privately to monitoring and not inadvertently published. Avoid logging request bodies containing private data. Check function/database round-trip latency in the chosen region before scaling geographically.

## Verification and recovery

Prove staging cannot reach production data or send live payments/email; protected preview rejects anonymous access; authorized callbacks work; invalid signatures fail; domain resolves to the intended environment; production release cannot bypass its selected gate. Record build/deployment IDs and settings, not secret values.

On a bad release, stop promotion or route back to the known-good compatible deployment. Database changes require their own forward-fix/rollback plan; redeploying old code does not undo a migration. Secret rotation requires a new deployment and validation. Track provider spend, build failures, function errors and production latency separately.
