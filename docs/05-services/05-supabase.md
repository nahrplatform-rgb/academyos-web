# Supabase database and storage configuration runbook

Selected PostgreSQL and private storage provider. Status: not provisioned or configured by this task. Use stable supported products; do not adopt alpha/beta database variants merely because they appear in the catalog.

## Projects, organization and region

Create/confirm a NAHR-owned organization with named administrators and MFA. Proposed resources: a dedicated production project and a separate staging/nonproduction project, plus disposable local databases for development and CI. Preview access must use synthetic nonproduction data with restricted credentials. If sharing a staging database among previews causes migration races, use isolated branches/projects with verified plan support or serialize previews; do not run competing migrations against a shared acceptance database.

Choose region after residency/latency decision D-019. Record project reference, region, database version, plan, compute, disk, connection limits, backup capability and billing alerts. A daily-backup plan does not meet a proposed one-hour RPO by itself. Approve PITR or revise the objective before real data.

## Keys and database connections

Use the current publishable key for permitted public client initialization; it is not authorization by itself. Keep secret/service-role capabilities server-side and narrowly consumed. Production direct database credentials belong only to controlled migration/recovery consumers, not the browser or general build job.

Copy connection strings from the actual project connection dialog. Choose a transaction pooler for compatible short-lived server workloads; use a supported direct/session connection for migrations according to the actual client and network. Validate prepared-statement compatibility and connection budgets. Do not invent a host/port or assume the direct host supports every runner's IP stack.

| Configuration | Proposed setting |
|---|---|
| Authentication | Native Clerk third-party provider for the matching environment |
| Business access | Current membership and RLS; restricted RPCs for critical transitions |
| Exposed schemas | Only deliberately reviewed API-facing schemas |
| Tenant tables | RLS enabled, explicit grants, tenant-bound constraints |
| Realtime | Off by default; enable only reviewed tables/channels and authorization |
| Storage | Private buckets; constrained upload/finalize/download workflows |
| Logs | Redacted, bounded retention and restricted operators |
| Migrations | Repository-controlled; clean replay and hosted drift comparison |

## Clerk integration and policies

Follow [Clerk runbook](04-clerk.md). Do not add a separate Supabase email/password login path unless a new identity decision explicitly requires it. Clerk subjects are text; map them to internal UUIDs. Verify issuer isolation and current membership checks on both reads and writes.

Review RLS, grants, views and functions together. Enabling RLS alone does not prove all RPCs/views/storage are protected. Restrict function execution, use safe search paths for privileged functions and review both `USING` and `WITH CHECK` for updates. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Buckets and object policy

Proposed private buckets: `academy-media`, `payment-proofs`, `support-attachments` and `exports`. Set allowed types and size caps per workflow after volume decisions; proposed starting caps are 10 MB image/proof, 20 MB support attachment and explicit video policy before video uploads. These are product defaults to review, not provider limits. Use random object keys prefixed by academy and upload intent, never names or emails.

Storage policy validates current tenant/resource relationship and staged upload ownership. A prefix alone is not sufficient authorization. Prevent arbitrary overwrite; object finalization binds the record to verified bytes/type/size. Signed links have approved short expiry. Define object backup separately from database metadata.

## Verification and recovery

Rebuild an empty local database from migrations, test all six roles across two academies, inspect function/table grants, compare staging schema/policies with the source, and exercise native Clerk JWTs against the hosted staging API. Test foreign references, stale roles, anonymous access, direct mutations and private object reads. Capture actual project/version/commit and distinguish local from hosted results.

Database backups do not include Storage object bytes, and project deletion removes associated managed backups. Recovery therefore needs an independent object-copy strategy and tested database restoration. [Supabase backups](https://supabase.com/docs/guides/platform/backups)

Public changelog reviewed 21 October 2026: scoped personal access tokens are available; use project/organization-scoped permissions where supported. Review the announced November 2026 HTTP TLS cipher change against future native clients rather than weakening TLS. [Supabase changelog](https://supabase.com/changelog)

On migration failure, stop dependent release, retain logs without secrets and use the approved compatible recovery plan. Do not manually edit hosted policies to “make the UI work” without a matching reviewed migration and retest.
