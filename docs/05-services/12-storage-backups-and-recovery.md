# Storage, backups and recovery configuration

Decisions: D-015 retention, D-016 recovery objectives and D-019 region. Proposed targets are 99.9% availability, database RPO of one hour and whole-service RTO of four hours, pending cost/architecture approval and restore proof. Object RPO must be decided separately; database recovery does not restore file bytes.

## Recovery inventory

| Asset | Backup/recovery method to establish | Evidence required |
|---|---|---|
| PostgreSQL data/schema | Managed recovery plus approved independent logical export | Restore into isolated project; invariants and policy checks |
| Storage objects | Separate copy with keys, byte sizes and checksums | Sample/full manifest restore and authorized download |
| Clerk configuration/identity mapping | Protected configuration inventory and provider recovery process | Login/bootstrap reconciliation; no invented password export |
| Secrets and signing keys | Vault recovery with separate custody | Controlled recovery/rotation exercise |
| Git source/migrations | Private repository and approved independent recovery copy | Fresh checkout/rebuild |
| Provider settings/DNS | Versioned non-secret register and change receipts | Recreate/compare approved configuration |
| Financial/provider references | Database ledger plus provider reconciliation | No duplicated money effects after restore |

Supabase managed database backups exclude Storage object bytes. Daily backups and PITR have plan/compute requirements; choose the actual plan matching the approved RPO. Do not delete a project assuming its managed backups will remain available. [Supabase backups](https://supabase.com/docs/guides/platform/backups)

## Object-copy design

Use a private independent backup destination with separate access and lifecycle control. Cloudflare R2 is one candidate, not a mandatory second live application store. If selected, create an environment-specific private bucket, record account/bucket/region or jurisdiction settings, disable public access, and issue only the necessary bucket-scoped S3 credentials. Separate copy, restore and destructive-retirement capabilities where provider permissions allow. [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/)

Capture object key, source generation/version if available, size, hash, copy time and related database record in a manifest. A successful copy command is insufficient without destination verification. Encrypt backups according to the selected threat/retention policy and keep recovery keys separately recoverable. Do not assume provider at-rest encryption protects against an administrator deleting both live and backup copies.

Avoid mirror-delete jobs that immediately propagate accidental source deletion into all backups. Retention, lifecycle and immutability/bucket-lock settings require an approved policy and cost assessment. Use a quarantine/retirement manifest and verify restore coverage before deleting older copies. A backup is not a public artifact or a GitHub issue attachment.

## Restore rehearsal

1. Identify the incident/snapshot boundary and preserve current evidence.
2. Create an isolated recovery target with outbound email/payment/jobs disabled and no customer routing.
3. Restore database, functions, grants, policies and required configuration; compare migration fingerprint.
4. Restore referenced objects from verified manifests and check hashes/availability.
5. Reconcile Clerk mappings, pending jobs, provider payments and deletion requests after the snapshot boundary.
6. Run tenant-isolation, financial totals, attendance history, export and download checks.
7. Measure actual data loss and elapsed recovery time; compare with approved objectives.
8. Obtain release approval before routing users or re-enabling external side effects.

Restoring an older job/outbox state can replay side effects. Provider idempotency/reconciliation is mandatory before dispatch resumes. Privacy deletions after the snapshot must be replayed so erased data is not silently reintroduced.

## Operations and failure handling

Alert on backup age, failed export, missing parts, object-copy lag, manifest mismatch, insufficient capacity and overdue restore rehearsal. Report database bytes, object bytes, backup storage, build artifacts and provider billing usage separately. A failed upload of a diagnostic artifact is not automatically a failed database backup; inspect each receipt.

Proposed cadence: daily backup verification, weekly manifest coverage review and quarterly restore rehearsal, plus a rehearsal before the first real-data launch and material recovery changes. Cadence is a proposal; owners and budget must be recorded. No “backup ready” status is allowed without an actual successful restore record.
