# Test strategy, evidence and formal acceptance

## Connected operating acceptance — 2 November2026

Use the [working-behaviour contract](../03-design/academy-working-behavior-contract.md), [EX-11 working-day specification](academy-working-day-acceptance.md), [32 planned cases](academy-working-day-cases.csv) and [single tracker](experience-execution.csv). The new case IDs are execution coverage, not new AO/AT business requirements or evidence that tests ran. Current-source architecture and dependent WB-P decisions are prepared in EX-10. Existing tests/evidence and per-journey approvals remain; all separate gates below remain mandatory.

Validate cold and repeated visits, direct links, Home→Calendar→session/register→Back→People/review,18-player/40-date volume, focus/reconnect, dirty/unknown/confirmed-read-failed states, concurrency, paging, account/scope changes, denied/revoked access and applicable version/storage failures. Match source/role/data/view/locale/profile across before/after. Wait for semantic task completion, not a route announcer or old row. Record visible blank/blocked time, retained context/input, authoritative outcomes, requests/bytes/speculative waste and measured service/query costs separately. No request-count-only or skeleton-only acceptance.

Measurement is part of every affected implementation batch, not deferred until EX-08 at the end. Declare local/fixture/hosted/physical limits and actual sample sizes; targets are not measured percentiles. Owner acceptance of the working-day subset is separate from approval of a preview or policy. Do not manufacture positive role coverage through an unapproved access restoration. Remaining roles/device/load/independent-security checks stay open explicitly.

The [requirements matrix](requirements-traceability.csv) defines 180 planned requirements and acceptance scenarios. The [audit mapping](audit-to-requirements.csv) carries all 89 referenced PYSA findings into preventive AcademyOS requirements. Neither file claims tests have run.

## Evidence layers

| Layer | What it proves | What it does not prove |
|---|---|---|
| Design / source inspection | Contract and implementation intent | Runtime behavior or deployed policy |
| Pure domain tests | Calculations, parsing and transitions for fixtures | Database/provider integration |
| Local database tests | Actual constraints, RLS, grants, functions and transactions | Hosted parity or real provider tokens |
| Signed HTTP integration | Handler/auth contract under stated environment | Browser usability or unrelated roles |
| Browser tests | Actual rendered flow and visible state | Physical offline behavior on all devices |
| Hosted staging | Deployed configuration and selected provider integration | Production configuration/merchant approval |
| Provider sandbox | Real provider test-mode behavior | Live settlement and production eligibility |
| Physical-device tests | Selected device/browser interruption and recovery | Every supported device/version |
| Owner/role acceptance | Business outcome accepted against criteria | Absence of all future defects |

## Test data and personas

Use synthetic Academy A/B, two branches each, owner/manager/trainer/guardian/player/platform-admin accounts, dual-role users, revoked memberships, linked/unlinked guardians, archived players, effective/future fee plans, overlapping contracts, overnight sessions, full capacity and multi-page datasets. Include English/Arabic names, long strings, missing optional fields and currency edge cases. No real child records or official private financial screenshots in fixtures.

## Required test families

Authorization: positive and negative read/write/export/object access through UI, API, database function and direct exposed table routes. Include stale sessions, tenant swapping, field projection, role escalation and revoked guardian links.

Integrity: atomic multi-record changes, idempotency/payload mismatch, concurrent capacity/allocation/approval, effective dates, immutable history, currency/rounding and reference calculations. Tests assert persisted state, not only response codes.

Recovery: failure before/after commit, lost response, partial batch, provider acceptance before database receipt, duplicate/out-of-order webhook, lease expiry, failed terminal-state write, object deletion failure and account provisioning repair.

Experience: keyboard, screen reader, focus, contrast, zoom/reflow, phone/tablet/desktop, EN/AR/RTL, dark/light, empty/error/unknown/partial states and valid onboarding links. Check each role's meaningful task, not only a generic login screenshot.

Operations: fresh migration replay, hosted drift, secret isolation, protected previews, release gate enforcement, redacted alerts, backup/object restore and external synthetic checks. Dependency scanning is included but never reported as the whole security review.

## Browser/device coverage

Before pilot declare supported current and prior major browser versions based on customer needs and actual framework support: desktop Chromium/Firefox/Safari, iOS Safari and Android Chrome are candidate targets. Record exact tested versions at execution. Physical offline attendance requires actual network disablement, close/reopen, storage pressure and reconnect on declared phones. Simulated network failures alone do not close that gate.

## Performance and capacity acceptance

Proposed initial targets, to validate against a measured workload: p95 ordinary authorized reads under 800 ms server time, p95 attendance commit under 1 second on the chosen regional staging setup, initial useful phone view within 3 seconds on the agreed test network, and no missed/doubled commits during a simultaneous session check-in burst. Separate server latency from device/network time. Large exports show progress and complete within a documented size-dependent target; do not force them into the ordinary request budget.

Use workload dimensions rather than arbitrary row counts alone: academies, active players, sessions/day, concurrent trainers, marks/minute, files/day, bytes/file and export size. Test normal load, burst and dependency outage. Capacity limits and paid-plan selection follow observed results.

## Completion and defect policy

A requirement moves from Planned → In progress → Implemented → Verified → Accepted, with Blocked/Deferred carrying a reason, owner and scope decision. A test failure is never converted to pass because the suite itself exited successfully. Skipped/unavailable tests remain visible. Evidence automation must fail when required outputs are missing, stale, truncated or indicate errors.

Release blockers include tenant/privacy leakage, unauthorized financial approval, silent loss/duplication of business records, unrecoverable required flows, unverified real-data backup recovery and missing approved business policy. Lower-risk issues may be accepted only with an owner, workaround, due date and explicit scope. No new AcademyOS requirement is marked fixed merely because an analogous PYSA finding has a proposed remedy.

## Evidence record template

Record requirement/test ID; source commit; migration fingerprint; environment/project; provider mode; device/browser; fixture; steps; expected/actual result; result status; redacted artifact location; tester; date; limitations; and acceptance owner. Keep hosted screenshots free of secrets and unnecessary personal data. A live deployment, Git push and owner acceptance each receive separate evidence.

The documentation verification report checks this pack's structure and traceability only. It is not application test evidence.

## Journey acceptance and coverage

Use the [experience blueprint](../03-design/experience-blueprint-and-journey-governance.md) and [journey register](../03-design/journey-register.csv) alongside requirements. Before coding, require the action contract, handoffs and applicable state matrix. Before milestone completion, reconcile actual UI/API/deep-link actions with individually specified journeys and tests. Family rows alone do not prove every action is covered.

Include Platform Owner, Academy Owner, Manager, Trainer, Guardian and eligible Player tasks; first-use/returning and dual-role/revoked personas; EN/AR/RTL, keyboard/screen reader and phone/desktop. Record completion without coaching, wrong turns, context mistakes, saved-state uncertainty and recovery success. Proxy walkthroughs are distinct from real participant usability research. Design review, implementation, deployed verification and owner acceptance each retain separate status and evidence.

## Five-dimension journey acceptance

For each upcoming slice, answer usability, speed, correctness, cost and recovery independently using the [experience/performance plan](../03-design/experience-performance-and-data-loading.md). Verify critical/deferred retrieval and bounds, cold/warm first useful time, declared sample sizes/percentiles, server versus network/rendering time, bytes and query work, revocation/cache isolation, lost responses and partial dependency failure. Declare device/network/dataset/concurrency; physical offline evidence remains separate. A fast skeleton, simulated network result, small fixture or aggregate score cannot establish full journey acceptance. New AO-169–176/AT-169–176 cases remain planned until executed.

## Security evidence and engineering discipline

Follow the [engineering charter](../00-governance/engineering-charter.md), [journey security review](../04-engineering/journey-security-review.md) and [coverage matrix](../04-engineering/journey-security-matrix.csv). Require named negative cases and detection/containment/recovery proof at the appropriate layers. Action-level security verification and owner acceptance remain separate from family planning coverage and passing foundation CI. Planned AO-177–180/AT-177–180 track this obligation; documentation presence is not an executed runtime test.
