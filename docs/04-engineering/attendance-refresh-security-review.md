# Attendance register redesign security review

29 October 2026. J12 / IMP-J12-A01, S28/S29/L08, SEC-J12 and unchanged J13 correction boundary. Policy and connected design accepted separately; [change packet](../06-delivery/attendance-refresh-design-contract.md).

## Changed boundary

Same current principal, academy, published occurrence, Trainer assignment/branch or active Owner authority. A bounded set of new marks now enters one transaction. Same-origin API keeps stream/body validation, no-store and existing subject rate limits. Signed gateway explicitly admits only the new fixed RPC. Database uses current verified subject; no privileged service key, new grant to people, new role or public data projection. Table ACL/RLS and immutable history remain intact.

Validate every unique player belongs to the same published roster and current academy/branch. Only version0 initial marks are accepted; saved records remain correction-only. Acquire the existing academy lock and actor/operation lock; canonicalize the full set before hashing. Validate the entire set before inserts; commit marks, histories, compact receipt and audit together. Recheck the server deadline after all writes; any exception rolls back the whole statement. Duplicate concurrent replay returns one result. Reconcile the original operation or fence it before replacement. Same operation ID cannot substitute a different event/set/capture time or reuse a canceled receipt.

Browser draft is memory-only, principal/academy/occurrence scoped; only pending operation ID is in the existing scoped sessionStorage key. Denial clears names/draft/history. Unknown/pending hides roster and blocks replacement/navigation; confirmed commit plus failed read offers read-only retry. Unselected and unloaded players are never inferred absent. Current access is rechecked on every server read/write, not only client visibility. Retained saved marks, private reasons and history follow existing rules. No Guardian access is expanded.

## Bounded retrieval and privacy

Reuse50-row/24KiB roster pages, explicit cursor/loading state. At most1000 selected new marks (existing session-size bound), batch body at most128KiB; other commands retain8KiB. Receipt includes event/operation/count only, under existing32KiB response cap. No names in pending storage, new logs, notifications or telemetry. No unbounded cross-tenant or family load. Existing limiter budgets are unchanged; larger transaction/WAL/lock cost needs staging measurement.

## Required evidence and residual gates

Disposable PG checks cover mixed stale/new zero-effects, duplicate IDs, replay/fence, concurrent existing/batch marks, failure rollback across history/receipt/audit, deadline crossing,1000 marks, revoked and wrong-role/tenant/branch access. Real React tests use synthetic session/HTTP adapters and independently cover review, recovery and clearing; they do not prove hosted policy. Existing attendance/correction/QR regressions remain necessary. Independent human security review, hosted adversarial concurrency/API checks, broader device/accessibility and measured HTTP/load/WAL/cost remain open. This is engineering review, not an independent audit or a production-release approval.
