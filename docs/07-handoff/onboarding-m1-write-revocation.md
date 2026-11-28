# M1 write/revocation ordering — local verification packet

Scope: J04-A01–A03, M1-T03, AO-003/004/169/175/178. Continue the accepted [M1 contract](../06-delivery/onboarding-m1-decision-design-packet.md) and [hosted verification](onboarding-m1-verification.md). No policy or application behavior change is proposed.

The setup RPC checks current owner membership with a transaction-held shared row lock before replay or mutation. A membership suspension updates that same row. Verify both schedules deterministically in the existing disposable PostgreSQL 17 harness using separate connections and the actual migrations. Observe PostgreSQL's blocker graph before releasing the first transaction; a fast sequential test is insufficient.

- Save first: hold an authorized setup save uncommitted; suspension must wait for its membership lock. Commit the save, then let suspension commit. Exactly one setup operation/audit/version change may persist. Subsequent reads, new saves and replay of the successful save must deny current revoked authority.
- Suspension first: hold suspension uncommitted; setup save must wait for that membership row. Commit suspension; waiting save must fail with access denial, persist no branch/version/operation/audit, and expose no saved setup.

Use synthetic local subjects only. Configure finite statement/lock waits, release or roll back held sessions on failure, and remove the disposable cluster. No hosted membership change, owner restoration, email or grant is required. Existing source paths and assertions remain intact. Record results separately from hosted HTTP race evidence and independent review.

## Results — 22 October 2026

Added `Boundary.test_14_write_revocation_serializes_both_lock_orders` to the existing [database runner](../../scripts/onboarding/test_boundary.py). The focused test passed, followed by all **14/14** existing and extended groups in 4.279 seconds on disposable PostgreSQL 17. Both schedules observed the second backend blocked by the exact first backend using `pg_blocking_pids` before release; no arbitrary delay was used as proof of concurrency.

Save first: one branch, version increment, operation and setup audit committed; suspension then committed. Suspension first: the waiting save failed with SQLSTATE `42501`/Access denied; no branch, setup version increment, operation or setup audit persisted. In both schedules, the final membership was suspended and subsequent read, save and same-operation replay were denied. The disposable cluster was removed by the harness.

This verifies transaction ordering in the actual SQL contract under local simulated identity claims. It does not prove a hosted Clerk/Data API/browser race or establish independent security approval. No hosted state, application implementation or deployment changed.
