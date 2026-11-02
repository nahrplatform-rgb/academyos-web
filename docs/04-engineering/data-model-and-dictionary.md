# Data model, dictionary and integrity rules

## Persistent local data and synchronization — LF-v2,2November2026

Future local model separately represents record revision, field-policy/scope epoch, collection/range coverage, checkpoint, tombstone and applied watermark. This is not an existing schema or retention policy. [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md) requires coherent snapshot/change design and explicit change-feed compaction/rebase before DB work. Do not infer absence/deletion from a partial cursor page.

This is the proposed logical schema, not executed SQL. Column names and physical indexes are finalized in migration review. All domain decisions in the decision register remain applicable.

## Shared conventions

Use UUID internal IDs; Clerk subjects are text and map uniquely to `app_users`. Tenant-owned records carry `academy_id`. A child reference uses an enforceable tenant relationship, normally a composite foreign key `(academy_id, target_id)` to a unique parent pair. A valid foreign UUID alone is insufficient. Global platform catalog tables are explicitly global and have separate administration policy.

Record `created_at`, `updated_at`, `version` and appropriate actor references. Use UTC instants for events, IANA timezone plus local recurrence definition for scheduling, and date-only types for birth dates/effective business dates where time is not meaningful. Effective intervals need a consistent inclusive/exclusive convention. Do not compare display strings for chronology.

Money uses integer minor units plus currency. Percentage/rate calculations use decimal or rational values and an approved rounding rule. Never use binary floating point for financial totals. Enumerated lifecycle states have documented transition operations; arbitrary client updates to status are denied.

## Entity dictionary

| Entity family | Key fields | Relationships / invariants |
|---|---|---|
| `app_users` | id, clerk_subject, lifecycle, preferred_locale | Unique non-null subject while linked; cleanup target retained until provider deletion succeeds |
| `academies` | id, name, country, timezone, currency, status | Currency/timezone changes require controlled effective policy |
| `academy_memberships` | academy, user, status, auth_version | Unique active relationship; roles stored separately |
| `membership_roles` / `branch_scopes` | membership, role/capability scope | Cannot reference another academy's branch |
| `invitations` | token_hash, academy, intended recipient/role, expiry, state | Hash only; single accepted identity; no preauthorization identity mutation |
| `delegations` | grantor, grantee, capability, scope, limit, validity | No self-escalation; revocation checked at use |
| `branches` | academy, name, timezone, effective interval, status | Historical references survive archive |
| `sports` / `academy_sports` | stable code, localized labels, enabled | Required configured seeds included in migrations |
| `players` | academy, profile fields, lifecycle | Login optional; sensitive fields separated |
| `guardian_profiles` / `guardian_links` | guardian user, player, authority, verification, validity | Current verified link required for access |
| `payer_accounts` / `payer_members` | academy, payer, authorized users | Financial authority separate from guardian relationship |
| `staff_profiles` / `staff_assignments` | user, branch, role, effective dates | Transfer atomic; confidential terms elsewhere |
| `qr_credentials` | token_hash, staff/player target, revoked_at | No embedded secret/private profile; revocable |
| `programs` / `recurrence_versions` | sport, branch, local schedule, zone, date range, capacity | Edits reconcile affected dated sessions |
| `sessions` | program, start_at, end_at, zone, status, capacity | End after start; full overnight interval |
| `enrollments` / `session_rosters` | player, program/session, effective dates, status | Tenant equality; concurrency-safe capacity; unique logical membership |
| `trainer_assignments` | trainer, session/program, effective range | Dated and recurring assignments both queryable |
| `schedule_exceptions` | conflict, approver, reason, scope | Narrow approved exception, never bypass boolean |
| `attendance` / `attendance_events` | session, target, state, actor, captured/received times | One canonical target/session; append-only change history |
| `attendance_corrections` | target, old version, proposed state, reason, approval | Approval and attendance change commit together |
| `fee_plans` / `fee_plan_versions` | currency, basis, rules, effective dates | Immutable applied version |
| `fee_assignments` | player/payer, plan version, validity | Current and future assignments resolved by applicable period |
| `family_bills` / `family_bill_lines` | payer, period, currency, basis, amount, state | Unique generation intent; posted lines not rewritten |
| `family_receipts` / `receipt_allocations` | amount, currency, payer, collector, bill allocation | Allocation sums bounded by receipt and bill policy |
| `family_adjustments` / `refunds` | original reference, amount, reason, approval, external state | Cumulative reversal/refund cannot exceed eligible amount |
| `trainer_contract_versions` | trainer, currency, formula, rate, validity | Effective contract resolved per earning event |
| `compensation_runs` / `compensation_items` | period, frozen intent, source versions, calculated amount | Retry-safe item keys; approved totals reproducible |
| `trainer_disbursements` | approved item/run, amount, method, reference | Earned, approved and paid remain distinct |
| `platform_plan_versions` | features, quotas, price, interval, effective dates | Global catalog with audited changes |
| `subscriptions` / `entitlement_overrides` | academy, plan version, lifecycle, expiry | Expiring overrides; current database authority |
| `platform_invoices` / `platform_payments` | academy, period, currency, amount, provider reference | Separate from family finance |
| `platform_payment_claims` | invoice, proof, submitter, review state | Proof ownership and invoice context bound |
| `evaluation_schemas` / `evaluations` | sport/schema version, player, period, lifecycle | Compatible comparisons only |
| `evaluation_values` / `publications` | metric, value, narrative, snapshot, publisher | Published snapshot immutable; private fields excluded |
| `upload_intents` / `media_objects` | academy, key, hash, type, size, lifecycle | Reserve/upload/verify/finalize; private by default |
| `media_tags` / `share_tokens` | player scope / token hash and expiry | Same academy; consent/relationship checks |
| `support_cases` / `messages` | participants, author, body, visibility, state | Recipient cannot edit author/content/tenant |
| `inventory_items` / `stock_movements` / `custody` | location, unit, quantity, actor, source/destination | Atomic transfers; serialized asset unique custody |
| `consents` / `privacy_requests` | subject, purpose, version, authority, state | Purpose-specific, revocable, policy-based retention |
| `notification_intents` / `delivery_attempts` | event, recipient, channel, template, provider receipt | Unique logical delivery; truthful states |
| `export_requests` / `artifacts` | frozen filters, snapshot, row count, object, expiry | Full authorized dataset; access rechecked at download |
| `operations` | actor scope, key, payload hash, result, state | Unique key scope; mismatch returns conflict |
| `outbox_events` / `jobs` / `job_attempts` | event, payload version, lease, fencing token, attempts | Durable scheduling; terminal exhaustion; replay receipts |
| `provider_events` | provider, environment, merchant, event_id, processing state | Unique provider event; processing separate from receipt |
| `audit_events` | actor, effective scope, operation, action, target, before/after summary | Append-only for ordinary users; redact sensitive values |

## Index and transaction plan

Start with indexes for current memberships by subject/user and academy; active guardian links; trainer dated assignments; sessions by academy/branch/start; roster by session/player; bills by payer/status/due date; operation key/hash; jobs by status/available time; and audit by academy/time/target. Use measured query plans before adding speculative indexes. Index columns used by RLS lookups and avoid a separate remote check for every displayed row.

Use unique constraints for business idempotency and canonical attendance. Use row locks or appropriate transactional constraints for capacity, allocation balances and stock. Avoid read-check-write races. Database functions that approve a correction, allocate a receipt or replace assignments commit all affected records or none. Long external provider calls occur outside database transactions through durable intents.

## RLS, grants and exposed surfaces

Enable RLS for every exposed tenant table and apply explicit table/column/function grants. Evaluate reads and writes separately; updates need both existing-row authorization and valid resulting-row checks. Views must preserve invoker security where applicable. Privileged functions use fixed safe search paths, schema-qualified objects and restricted execution grants. Review default PUBLIC function execution. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

Clerk `sub` is text; do not cast it to UUID or assume `auth.uid()` represents the internal AcademyOS user. Resolve it through a narrowly scoped identity mapping. Avoid policies that recurse through their own membership table. A shared helper must be audited for tenant binding and performance.

## Migration and retention rules

Migrations include schema, constraints, indexes, policies, grants, functions and required seeds. Replay from empty database and compare with staging definitions. Use expand/migrate/contract for incompatible changes; old mobile clients and queued events may still use the previous schema contract. Record cleanup jobs and compatibility windows before dropping columns.

Archive business history separately from personal-data erasure. Tenant deletion is a coordinated workflow, not an unrestricted cascade from the academy table. The retention matrix must identify each entity family, purpose, retention trigger, period, exceptions, object copies and backup handling before real personal data is admitted.
