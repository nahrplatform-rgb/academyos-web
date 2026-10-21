# Durable work, retries and idempotency

Requirements: AO-149–160 and domain-specific retry cases. Proposed transport: QStash, with PostgreSQL owning job state. The transport can change without changing business identity or completion rules.

## Operation ledger

For every durable command store actor/service identity, academy, operation type, caller key, normalized payload hash, state, result reference, timestamps and correlation ID. A unique constraint establishes the key's scope. Same key plus same intent returns the earlier outcome; same key plus different intent returns conflict. Do not use a random new key for each network retry.

The business mutation, operation receipt, audit event and outbox intent commit together. If the transaction rolls back, none are acknowledged. External side effects happen after this commit. Keep external provider idempotency/reference IDs so an interrupted call can be reconciled instead of repeated blindly.

## Outbox and dispatch

An outbox row records event ID, type, schema version, aggregate ID/version, academy and minimal payload. A dispatcher leases undispatched rows, publishes the event ID to the selected transport and records the provider message reference. Publishing twice is possible; consumers must deduplicate. A dispatcher crash after publish but before acknowledgment cannot create duplicate business effects.

Avoid putting full child profiles or payment proofs in queue payloads. Workers load current scoped records by ID. For delayed work, capture the original intent and recheck mutable authority/eligibility at execution. An audit records both the initiating user and executing service.

## Job state machine

`queued → leased → running → succeeded` with branches `retry_wait`, `failed`, `cancelled` and `needs_reconciliation`. Each attempt records start/end, lease expiry, attempt number, worker fencing token, provider reference and safe error category. An expired lease is recoverable; an exhausted final attempt becomes a terminal visible failure instead of remaining in progress forever.

Fencing prevents an old timed-out worker from marking a newer attempt complete. Heartbeat extension is bounded. Retry exponential backoff with jitter for temporary failures; stop on permission denial, invalid input, unsupported schema or permanent provider rejection. Operator retry records who retried and why and preserves the original payload. A changed intent is a new operation.

## Batch semantics

Bill runs, payroll, media uploads, broadcasts and exports have an overall manifest and item-level outcomes. Define whether an operation is atomic or intentionally partial. Count expected, committed, skipped, failed and unresolved items. Success requires the documented completion invariant, not simply that a loop reached its end.

On restart, read existing item receipts and resume unresolved work. A failed state-write is itself an operational error and must be surfaced. Do not swallow the error while reporting a terminal failure that was never persisted.

## Reconciliation jobs

Schedule checks for: provider events received but unprocessed; settled payments without allocations; old upload intents and unreferenced objects; deletion-pending objects; expired job leases; bill/payroll partial runs; notification provider outcomes; stale entitlement cache; identity mappings without valid provider targets; exports whose object/manifest disagree; and drift between desired and actual provider configuration.

Each reconciliation proposes or performs a narrowly defined idempotent repair, captures evidence and escalates ambiguous cases. Never repair money by guessing a payer or amount. Destructive cleanup requires validated scope and the retention policy; absence from one query is not deletion authority.

## Required failure injection

Crash before commit, after commit before response, after provider acceptance before local receipt, during item N of a batch, after lease expiry, and during terminal-state update. Replay the same event concurrently. Demonstrate one business effect, observable unresolved state, bounded retry and operator recovery. Tests must assert stored results and external sandbox receipts, not only returned HTTP codes.
