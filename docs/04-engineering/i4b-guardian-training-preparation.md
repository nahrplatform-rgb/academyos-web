# I4b — family training read boundary preparation

28 October 2026. **Planning only; proposed policy awaiting Owner decision.** SEC-J15/I4b, J15/IMP-J15-A01, L09, partial AO-014/015/016. [Decision and PYSA reference packet](../06-delivery/i4b-guardian-training-decisions.md), [security gate](journey-security-review.md), [existing I4a evidence](../07-handoff/i4a-attendance-implementation.md).

## Changed trust boundary

Signed-in Guardian → same-origin family read → signed current subject → current academy membership and accepted active exact player link → current publication head and that player's immutable published-roster entry → minimal session/own-mark projection. Check target academy/player/event together. No service key, client role, contact match, previous response or supplied child ID establishes authority. No table grants or weakening of attendance's Owner/Trainer capture boundary. Guardian must not receive the Trainer roster endpoint or history/receipt payload.

Reuse current Clerk/gateway/body validation, private schema/RLS and g3 relationship helpers after inspecting lock/current-principal semantics. Publication/attendance sources remain canonical. New public read signatures, internal shared predicates, indexes and any additive schema need review after policy/design approval. Do not decide a persisted capability or historical lower bound silently. No migration is authorized by this planning packet.

## Retrieval, freshness and recovery proposal

- Active linked-player chooser: at most25 plus sentinel, deterministic cursor, minimal link/player/name/branch. Fetch selected player only; no all-child fan-out.
- Selected schedule: seven-day query windows, at most25 occurrences plus sentinel per page, stable `(effective start, occurrence/event)` cursor. Browse previous/next windows and all pages; this is a request bound, **not a seven-day program/history limit**. Next-session lookup uses the same scoped source with a minimal limit; past retained periods follow the Owner's selected historical-access rule. Any calendar design must retain every dated occurrence and explicit coverage.
- Selected detail: one authorized event and own current mark/version/last-update, no joined full roster/contacts/private history. Keep each response below32KiB uncompressed; byte-aware pages if names require fewer rows. Avoid N+1 child/session queries and undefined all-time aggregates.
- Private `no-store`; scope client memory by subject/academy/link/player/period/event. Abort superseded reads and discard obsolete results. Clear the previous child immediately on switch; clear all private regions on denial. Independently retry failed period/detail reads without pretending they are empty or replacing a confirmed current mark with cached data.
- Revalidate on opening, period/child change, focus and reconnect. No routine polling or permanent manual-refresh prerequisite. Re-read current link/publication/mark each request; account sign-out and context changes invalidate state. A revoked view becomes unavailable; no hidden replay of private data through a read receipt.

## Verification cases

Current linked Guardian sees own player's published dated session/current status, including multiple same-day occurrences, moved effective time and a corrected mark. New historical choice is covered explicitly on both sides of link acceptance. Never infer Absent from an absent mark.

Deny foreign academy, other child (including sibling without explicit link), pending/expired invitation, ended link, suspended membership, Guardian role without active link and attempted Owner/Trainer marking/history endpoints. Verify no another-child data survives a switch, late response, failed request, sign-out or revocation. Withdrawal, mark correction and link-ending interleavings must return one currently valid projection or denial, with no private partial result. Ending one link must preserve separately approved links. Show exact page coverage and no missing/duplicate same-day events at cursor boundaries.

Keep unchanged domain counts/fingerprints for read-only tests. Hosted tests may need a newly reviewed link/recipient because the earlier authorized test link was ended; policy/design approval never restores it. Rehearse additive migration/rollback only if later implementation needs schema changes; preserve existing marks/history and all prior acceptance.

## Measurable targets and evidence separation

Proposed workload:25 active links, up to1000 retained dated sessions for a selected fictional player, repeated periods and two academies. Current-link/schedule/detail SQL p95≤300ms; stable-network authenticated end-to-end next-session and detail p95≤1500ms; useful initial view≤2.5s on a declared phone/network; each response≤32KiB. Measure cold/warm separately with sample counts, query plans/rows/bytes, request counts and provider time. Initial view may load chooser then one selected child, not25 child summaries. No new telemetry containing names/marks/reasons, retention claim or paid service.

No target has been measured for I4b. Local SQL/HTTP/React tests, hosted role/data proof, real devices/accessibility, cost/load and Owner working acceptance are independent evidence. Independent human security remains required; this packet and AI review do not supply it. Existing I4a active-Trainer replacement and broader open gates remain tracked, without claiming this new read-only slice resolves them.
