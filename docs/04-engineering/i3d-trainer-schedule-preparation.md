# I3d — publication and assigned-Trainer schedule preparation

27 October2026. **Policy accepted for design preparation27 October2026; connected design/implementation not approved.** [Decision packet](../06-delivery/i3d-trainer-schedule-decisions.md). This preparation changes no authority or current product behavior. I3c acceptance does not close its outstanding independent verification gates.

## Trust crossings and minimal data

Current Owner → same-origin limited API → fixed signed RPC → current membership/branch/ready program/date-plan version → private publication preparation → atomic published revision and redacted audit. Current Trainer → authenticated scoped list/detail → current accepted appointment plus exact dated assignment plus published revision. No privileged client key, client-only role gate, direct table/helper grant, public private-data cache or generic proxy.

Publication snapshot must reference exact date/plan versions. Existing q6 individual edits and r7 whole-program activation share the same lifecycle lock and must deny published-target mutation. Publication/withdrawal versus edit, staff ending and roster changes must serialize with consistent lock order; one command cannot publish a roster that changed after its review. Withdraw does not erase the plan/audit. Do not implement an unlocked visibility flag and separately fetched mutable roster.

## Bounded retrieval and freshness proposal

- Schedule: explicit7-day branch-local view,25 rows plus sentinel with stable date/start/ID cursor; other periods selected deliberately. This is a retrieval window, not maximum program duration. Minimal session headers and capacity/count only; player names deferred until authorized selected detail.
- Detail roster:25 names/IDs plus sentinel, stable scoped cursor, exact published revision; no profile/contact join. Do not fetch every roster for a calendar list or truncate a roster and call it complete.
- Owner review: bounded25-date preparation pages, exact selected target set/count/version. No effective visibility during preparation; all-or-none final activation. Unknown original operation reconciles/fences before replacement.
- Current authority revalidated at every request. No shared cache of private projections. Invalidate confirmed publication/withdrawal/date/assignment changes; coalesced focus/resume refresh clears stale confirmation and denial clears displayed private names. A failed read is unavailable, never zero sessions. An already rendered offline page is not proof of continuing authority; no offline roster storage authorized.

## Proposed measurements and acceptance cases

Use representative20/40/100/1000 dated targets and1/25/1001-player selected rosters. Count list/detail requests and bytes; one list read must not fan out per session. Measure SQL p95 (initial target300ms, unchanged3s outer statement budget), transaction locks, memory/WAL and multi-academy fairness; larger cross-product feasibility remains evidence-driven. Proposed useful-view target2.5s p95 on declared phone/10Mbps down/1Mbps up/150ms RTT; confirmed small interactions1s p95. State cold/warm identity/network and actual versus simulated devices separately. Do not claim these budgets passed from a prototype or the earlier I3c smoke.

Required negatives: two academies, same branch but another Trainer, dated-only assignment, draft/non-published lookup, wrong role, foreign date/player IDs, changed expected version, ended/suspended/revoked Trainer, no active appointment, identity handoff/late responses, changed publish set, failed conflict query and all dates rejected on one invalid target. Trainer list and direct detail must enforce the same conjunction; hiding a navigation link is insufficient.

Required integrity/recovery: duplicate/payload-changed operations, failure before/after first/middle/last activation/audit write, publish versus single-date save/program apply/withdraw/staff ending in both orders, interrupted preparation, lost final response, confirmed result/read failure and cancellation fence. Never delete assignment/roster first and recreate it as a recovery strategy. Published edit guards must cover direct RPCs and all existing callers.

Independent human security review, physical device/screen-reader, sustained hosted load and remaining I3c actual-account/direct-API/race cases stay open. No active Trainer provisioning is authorized by this plan; present truthful missing prerequisites until separately authorized. No new provider, paid service or real data is needed for design preparation.

Connected local design is now prepared: [action/state contract](../06-delivery/i3d-trainer-schedule-design-contract.md). Simulation/type/layout checks are design evidence only; no expanded real Trainer access or product/schema/provider changes.
