# Independent staging backups

This workflow is for **Supabase snpphkenmvmhpjstbeul only**. It is not a production recovery service. `staging-backups` is a separate GitHub environment restricted to the `main` branch. It has no application runtime or PR access. Anyone allowed to change main/workflow code can access these credentials during a run; repository administration is part of the trust boundary.

## What is copied

- A PostgreSQL 17 custom-format logical dump of `academy`, `public` and `supabase_migrations`, including data, functions, policies, grants and constraints. Ownership is deliberately remapped during restore.
- All rows of the current Storage buckets/object inventory, plus the actual bytes of every object in the four reviewed private buckets. File names and metadata remain inside the encrypted archive.
- A separate schema-only Storage dump preserves its functions, policies and grants for review/recovery. It is not automatically applied to a managed service.
- A manifest with SHA-256 for every payload file and the source project/time window.

Provider-managed Auth, other managed schemas, account configuration, Clerk sessions/passwords, Redis, provider queues and secrets are **not** exported. Clerk is the identity authority; its configuration and recovery remain separate. Storage metadata is archived for reference, not written directly back into managed Storage tables. Use the Storage API to re-upload recovered objects when restoring to an isolated Supabase service.

`pg_dump` takes a transaction-consistent database snapshot. Storage is checked before and after copying; a changed inventory fails the run. This does not provide a single atomic snapshot across SQL and object storage. Stop writes for the initial recovery rehearsal and before any strict cross-system recovery boundary. Add write/version coordination when application writes are implemented.

## Encryption and destination

The only committed encryption key is the public age recipient. The private recovery key stays in the owner's vault and a local file with mode 0600. It must never be a GitHub or Vercel secret. Archive encryption happens on the runner before uploading to the private EU R2 bucket `academyos-staging-backups`. Public access and custom domains are disabled.

Every run uses a new UUID object prefix. It reads the uploaded ciphertext back and checks its exact size and SHA-256 before publishing a receipt. It does not mirror source deletions or delete backups. The R2 Object Read & Write permission also permits object deletion at provider level; the script never requests deletion. The active staging lock/expiry rules are recorded below; production retirement policy remains a separate decision.

Plaintext lives only in a permission-restricted temporary directory and is cleaned up on exit. No plaintext, credentials or decrypted object manifests are GitHub Actions artifacts. The job summary contains only a non-sensitive encrypted-copy receipt. A manual run can explicitly export an encrypted-only recovery package and its receipt as a private GitHub artifact retained for one day; scheduled runs do not. Recovery plaintext likewise needs private local storage and cleanup after rehearsal.

## Credentials — owner saves directly

Add these as **Environment secrets** under GitHub repository Settings → Environments → `staging-backups`:

| Name | Value |
|---|---|
| `BACKUP_DATABASE_PASSWORD` | This staging project's existing database password from the owner's vault. Never reset it just to configure a backup. No connection string or URL encoding is needed. |
| `BACKUP_SUPABASE_SECRET_KEY` | A dedicated `sb_secret_…` API key named `academyos_staging_backups` in this project's API Keys settings. Server-only; bypasses RLS. |
| `R2_ACCESS_KEY_ID` | Account token Access Key ID, Object Read & Write, scoped only to this backup bucket. |
| `R2_SECRET_ACCESS_KEY` | Matching R2 Secret Access Key. |

These credentials are privileged. The database connection can access the project even though the export subprocess is forced read-only. The dedicated Supabase key can read/write project data although the export script only downloads; the separately dispatched operator rehearsal can write/remove only its fixed synthetic fixtures. Do not put them in Vercel, source code, chat, build output, PR checks or broad organization secrets. Rotating them is a separate controlled task; no existing credential is reset by the workflow.

The non-secret GitHub environment variable `BACKUP_DATABASE_HOST` records the verified eu-west-1 session pooler host from this project's Connect dialog. The script fixes the project-specific username, database and port 5432, safely encodes the supplied password and validates the target. No connection URL is logged or passed as a command-line argument. Transaction pooler port 6543 is never used.

TLS remains `verify-full`, using the Supabase Root 2021 CA from the staging project's Database Settings → Download certificate link. Its checked-in PEM is public trust material, not a credential. File SHA-256 is pinned in the script; certificate fingerprint is `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`, valid through 26 April 2031. Rotation requires a reviewed update. Source: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt and https://supabase.com/docs/guides/platform/ssl-enforcement

## Execution and receipts

The workflow runs daily at 02:17 UTC and can be started manually on main. This initial staging cadence does **not** meet the proposed one-hour production RPO. The independent Sentry schedule monitor and named-owner alert now cover failed/missed check-ins, with controlled failure/recovery and mailbox proof. The owner must still investigate GitHub failure status and validate encrypted-copy receipts; a green workflow does not establish whole-service recovery objectives.

The export refuses unexpected source hosts/projects, transaction-pooler connections, public/unreviewed Storage buckets, changed inventories or more than 2 GiB of payload. These are hard failures, never silent partial backups. New schemas/buckets or larger data require a reviewed coverage/limit update.

Before exporting, it also calls the Storage bucket-list API using the dedicated key and checks all four private buckets. This verifies API credential use even when there are no objects; object-download coverage remains separate.

Local dependencies: PostgreSQL 17 client tools, age, Python 3.12+, and the pinned requirements in a private virtual environment. Run the adversarial checks with `python3 -m unittest discover -s scripts/backups -v`.

## Recovery rehearsal

1. Retrieve the run's `receipt.json` and compare its digest to the trusted successful GitHub job summary at the reviewed source commit before executing restored SQL. A receipt retrieved only from writable R2 storage does not authenticate the publisher. Treat it as a pointer, not proof of restoration.
2. In a private shell with the R2 credentials supplied securely, run `backup.py recover --receipt <receipt-file> --identity <vault-recovery-key-file> --destination <new-private-directory>`. It downloads the named encrypted backup, verifies the ciphertext, decrypts, rejects unsafe archive paths/links and verifies every payload checksum. It never connects to a restore database.
3. Restore `database.dump` with `rehearse_local.py <recovered-directory>`. It creates a new PostgreSQL 17 cluster reachable only through a private local socket, supplies the expected Supabase roles/auth baseline, restores with errors treated as failures, runs the membership tests and stops/deletes the disposable cluster. It preserves initdb's default public schema ACL baseline while applying explicit archived grants. It accepts no remote target. Never run `supabase/tests/harness.sql` against hosted data.
4. Check migration inventory, row counts, constraints, RLS/grants and the existing membership boundary suite. Preserve evidence separately from source and never print restored identity data in logs.
5. Verify all file checksums. With nonempty files, re-upload into a separate isolated service using the Storage API and test authorized downloads; local checksum verification alone is not this service test.
6. Record actual run ID, counts, duration and what was not restored. An empty Storage inventory proves only empty-inventory coverage. No green backup claim replaces the full launch recovery rehearsal.

Independent backup publication, local database restoration and full hosted service restoration are separate evidence layers. Do not reconnect recovery targets to email, payments or jobs without a reviewed side-effect reconciliation.

For the temporary GitHub package, `backup.py recover` also accepts `--ciphertext <downloaded-backup.tar.age>` so R2 secrets need not be copied to the operator computer. The ciphertext digest is still checked against the reviewed receipt. Its recovery key remains local.

`synthetic_roundtrip.py --identity <private-key-file>` is a separate local test: a disposable PostgreSQL source, one fixed non-personal file through a mocked HTTP transport, real dumps/encryption/decryption and a second isolated database restore. It proves the local pipeline and key pairing; it does not contact Supabase or R2.

## Independent failure / missed-run monitoring

The workflow sends Sentry Cron check-ins to the existing EU project: start before installation, success only after a valid encrypted-copy receipt, and error on a failed job. Schedule `17 2 * * *`, timezone UTC, 90-minute dispatch grace, 30-minute runtime, one failure to open an issue and one success to recover. Sentry watches missed check-ins independently of GitHub, including a workflow that never starts. A monitor transport failure does not stop the backup export; it still makes the final workflow status fail for investigation.

Only status, staging environment, a derived run identifier and schedule configuration are transmitted. No row values, object inventory, passwords, private keys or backup payloads enter Sentry. Its public DSN/check-ins are observability telemetry, not cryptographic proof of backup authenticity; use the trusted workflow receipt and R2 verification for that. Operator email routing and provider acceptance of this monitor must have a runtime receipt before claiming notification coverage.

Source: https://docs.sentry.io/product/monitors-and-alerts/monitors/crons/getting-started/http/

## Narrow hosted file rehearsal

`Private staging file recovery rehearsal` is a main-only manual operator workflow. It accepts only a fixed 50-byte non-personal CSV, the private `exports` bucket, and a canonical UUID4 rehearsal prefix. It cannot change buckets/policies, upload arbitrary data, or overwrite existing paths. Operations:

1. `create`: upload `__setup_recovery__/<uuid>/source.csv`, download with the privileged key and compare exact bytes; reject public readability.
2. Run the encrypted backup with the temporary encrypted-only package enabled, compare the trusted job receipt, then recover locally with the vault key. Find the source object in the decrypted inventory and verify its payload/hash.
3. `restore`: supply base64 of those recovered CSV bytes as `recovered_fixture_base64`, re-upload as `restored.csv`, then verify authenticated download and denied public access.
4. `cleanup`: inspect both exact paths, refuse any content that differs from the fixed fixture, and remove only matching test objects. Verify both are absent. No backup copy is deleted.

The new restore path is isolated from the source object but remains in the same staging service. This is actual hosted object transport/re-upload proof, not disaster recovery to an independent Supabase project or tenant authorization acceptance. A separate production whole-service rehearsal remains required. Source and restored fixtures are disposable technical test data; no personal/academy records are involved.

Sources: https://supabase.com/docs/guides/storage/uploads/standard-uploads and https://supabase.com/docs/guides/getting-started/api-keys

For an explicit operator alert rehearsal, a manual backup can set `exercise_monitor_failure=true`. It sends start/error on a separate, clearly marked synthetic check-in ID derived from that actual workflow run, then performs the real backup normally. Its successful verified-copy check-in provides recovery. This changes monitor telemetry only; it never simulates a failed backup receipt. Leave the option false for routine/scheduled runs.

## Active staging retention and lock — 22 October 2026

The private EU bucket now has `staging-backup-lock-7d` on prefix `staging/`: seven days of overwrite/deletion protection. It also has owner-approved `staging-backups-expire-30d` on that same prefix: delete uploaded objects after 30 days. The default incomplete-multipart abort after seven days remains. No Infrequent Access transition or public URL is enabled. Lifecycle deletion is asynchronous, not a guarantee of deletion at an exact minute.

The lock is a provider-enforced bucket rule, not an irreversible compliance hold: an administrator with bucket-configuration permissions can remove it. The main backup credential is only Object Read & Write and cannot change bucket rules. No automatic source deletion mirroring exists. Production/customer retention remains a separate policy decision.

Manual `verify_bucket_protection=true` writes one new fixed 49-byte non-personal probe under `staging/protection-checks/<uuid>/`. It verifies overwrite and deletion are rejected, then checks unchanged read-back. It never targets an actual backup. The probe remains until the approved 30-day lifecycle removes it after its seven-day lock; routine backups do not create probes.

Sources: https://developers.cloudflare.com/r2/buckets/bucket-locks/ and https://developers.cloudflare.com/r2/buckets/object-lifecycles/
