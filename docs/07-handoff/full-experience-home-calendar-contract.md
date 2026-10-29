# Connected redesign — role homes and dated calendar reads

## Authority and scope

The approved full-experience plan and connected8e0b667 proposal authorize bounded read-only Owner/Trainer/Guardian homes and calendars. Parent journey/action coverage remains J07/J08/J09/J10/J11/J12/J13/J15/J16 and their existing IMP action groups; S19/S22–S29/S31/S32/S46/S47; L04/L06/L07/L08/L09/L10 and corresponding SEC families. Parent AO/AT links remain in the approved preview coverage register. This contract adds no membership, relationship, rollout opt-in, salary, consent, payment, messaging or publication authority. Implementation and hosted evidence are not yet claimed.

## Source and reference assessment

Existing p5 dates expose saved ready occurrences; current effective ordering uses scheduled_date while retaining the original day identity. Publication heads/snapshots, current t4 Trainer appointment, g3 Guardian relationship, b11 training opt-in and e14 development opt-in are canonical. No generic membership role or client-selected actor substitutes for these checks. Owner private preparation jobs remain actor-bound. Existing API responses are capped at32KiB; signed gateway, same-origin allowlist, rate limits and no-store remain mandatory.

Re-inspected PYSA trainer/page.tsx and shared/calendar-grid.tsx alongside the scheduling source/audit review. Keep a dated weekly/monthly operating view and direct links to real roster/feedback tasks. PYSA's Trainer home derives work from recurring assignments while its schedule uses dated occurrences; avoid that mismatch, dated-assignment omissions EV-0095/0096, timezone drift and failure-as-empty behavior. Reference is read-only source/audit evidence, not fresh hosted verification. AcademyOS decisions govern.

## Bounded contracts

Use explicit role-specific read operations, each independently authorizing its current caller. Owner requires the existing active Owner check; incomplete setup returns a setup task with unavailable downstream panels rather than invented zero counts. Trainer requires the existing accepted active appointment and eligible branch. Guardian requires the current accepted link; training/development panels additionally require their existing separate enabled opt-ins. Selecting another actor/academy/link cannot expand authority.

Calendar accepts an inclusive finite civil-date period of1–42 days, a matching current scope and a deterministic continuation cursor. Return at most50 minimal summaries/page, with a smaller byte-bounded page if necessary; preserve a continuation whenever rows remain. Include scope, branch timezone, as-of timestamp, authoritative scoped total and explicit more/next. Counts must not derive from the loaded page. Never mark a partial or failed period complete. Preserve actual moved time and original occurrence identifiers; distinguish Owner draft/published/moved/cancelled. Trainer/Guardian only receive currently permitted published occurrences, never private plans or other players. No calendar projection includes contact details, private feedback, correction reasons or rosters.

Homes prioritize today's/next saved permitted sessions and direct tasks. Owner unfinished attendance respects the existing recording deadline; reviews distinguish current pending versus expired/stale/self-review restrictions. Unfinished programs and actor-bound private preparations open existing canonical tasks. Trainer sees only current assigned published dated work and their own drafts/requests. Guardian's selected-player session/attendance/feedback panels remain independently gated; future attendance says Scheduled and unrecorded never means Absent. A failed/disabled panel says Unavailable, never zero or an empty success.

Client navigation context stores only scope/date/filter/record identifiers; never profile/roster/feedback payloads. Revalidate on return/focus/account changes, abort prior responses, clear private data after denial, and keep every mutation on existing domain endpoints. Add addressable read/task destinations only where needed to open an exact existing record; no decorative dead links or future operational controls.

## Verification and delivery gates

Before apply: additive versioned migration, explicit search_path/revoke/grant, signed-method/target allowlist extension preserving all current targets, and disposable full-history migration replay. Tests must cover two academies, wrong role, revoked appointment/link, disabled opt-ins, foreign/old cursors, invalid/oversized ranges,42-day boundary,50+ results and byte continuation, moved/cancelled/private exclusions, exact authoritative counts, expired/self-review cases, unknown/error/empty separation and current Guardian mark/publication projection privacy. Existing write/atomicity/history tests remain intact.

Measure first useful task p75≤3s, local feedback p75≤200ms, ordinary reads p95<800ms and CLS≤0.1 on a declared dataset/network/device; record payload/query timings and limits. Do not infer performance or independent security closure from local UI tests. Rehearse backup/restore and verify unchanged domain fingerprints before staging apply. No actual access restorations are included; positive recipient hosted checks remain limited to currently authorized accounts.

Deliver source/API/data/UI together, update action/loading/security traceability, regenerate factual captures, then exact-source CI and staging. Track design approved, implemented, local tests, deployment, hosted checks and Owner acceptance separately. Rollback removes/reverts additive read exposure and presentation without modifying business records.
