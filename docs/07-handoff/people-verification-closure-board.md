# People foundation — consolidated verification board

25 October 2026. Covers bounded M1/I1, I2a and I2b outcomes, not all J01–J08 requirements. This board consolidates existing evidence; it does not rerun tests, retire scope or supply independent approval. Latest working I2a and I2b wording/usability accepted; wider security/release acceptance remains open.

## Evidence already obtained — preserve rather than repeat

| Slice | Implemented/deployed | Local evidence | Focused hosted evidence | Owner acceptance |
|---|---|---|---|---|
| M1/I1 | Academy admission, Owner invitation/context, resumable first branch/sport/timezone; bounded admission presentation | SQL/API/React, keyboard/emulated phone, operation and permission cases; scale observations | Initial create/accept/setup, two accounts, role denials and scoped suspension/restoration; see dated receipts | M1 wording/usability and selected visual design accepted; wider family/I1 acceptance remains scoped |
| I2a | Owner-only fictional registration, duplicate review, profile |9 people SQL groups plus inherited M1, route/React, recovery/scale | Create/reopen/duplicate; actual conflicting reviews; before-send cancellation; committed-response-loss recovery | Working EN/AR wording/usability accepted25Oct |
| I2b | Owner appointment, verified recipient accept, minimal linked-player projection and ending |9 guardian SQL groups plus25 inherited; route/worker/React; both lifecycle lock orders | One authorized email/accept/link/end; separate Safari EN/AR; Owner-management and other-academy Guardian denial; next refresh excludes ended link | Working wording/usability accepted25Oct; no full security approval |

Sources: [M1 verification](onboarding-m1-verification.md), [M1 HTTP](onboarding-m1-http-boundary.md), [I1](m1-admission-presentation.md), [I2a implementation](i2a-registration-implementation.md), [I2a recovery](i2a-hosted-verification-2026-10-25.md), [I2b implementation](i2b-guardian-implementation.md), [I2b exact hosted test](i2b-guardian-hosted-test.md).

## Remaining bounded batches

| ID | Case / expected result | Existing evidence and precise gap | Next safe execution / authority |
|---|---|---|---|
| PV-01 | Current recipient cannot read ended selected link, foreign player/academy or Owner profile/receipt directly; fields minimal | I2b local SQL passes; hosted route denial and list exclusion pass. Exact selected-link/direct HTTP capture still open | Use existing recipient session after ended test; no restored link/new grant. Capture only response keys/codes/bytes, no tokens/cookies/private payloads. |
| PV-02 | Owner B cannot directly list/read/register/reconcile people in A; Owner A cannot do same in B | I2a local two-tenant cases and A→B hosted route denial; reverse HTTP cases open | Existing two authenticated sessions; deny-only reads/input validation. No foreign registration mutation should commit. |
| PV-03 | I2a current membership revocation denies open profile and next write/replay | Local SQL lock orders pass; old M1 scoped revocation proof is not I2a proof | Any new hosted suspend/restore requires separate exact authorization. Prepare restoration before suspension. Never reuse22Oct one-time authorization. |
| PV-04 | Guardian commit response loss, duplicate acceptance and accept/end/revoke races produce one consistent outcome | Actual SQL/React/worker adapter cases pass; hosted write/recovery/race not all executed | Needs a separately authorized fresh exact appointment. Existing ended link cannot be restored/reused as a shortcut. Batch all planned effects before seeking authorization. |
| PV-05 | Private HTTP cache/referrer and context/identity changes never retain foreign data | Current headers and local React identity clearing pass; broader hosted route/context matrix open | Existing sessions, read-only/navigation. Do not export tokens or widen telemetry. |
| PV-06 | First useful view/read/mutation meet declared budgets under named device/network/load | Local DB function timings and focused M1 hosted timings exist; no full I2 HTTP p95 or realistic contention proof | Predeclare samples/rates/stop conditions; reuse ordinary reads, obey shared limiter. No unbounded burst or new synthetic writes merely for counts. |
| PV-07 | Provider command/usage evidence supports cost limits | Provider meter unavailable in earlier receipts; unavailable is not zero | Read-only current provider counters if accessible; distinguish commands, billing-period usage and per-journey attribution. No purchase/upgrade. |
| PV-08 | Physical phone/native select/screen reader/keyboard support confirmed | Automated viewport/keyboard evidence exists; physical-device and screen-reader checks not complete | Named tester/device and exact tasks. Do not label emulated360px a real-phone pass. |
| PV-09 | Fresh independent human security assessment and disposition | Implementing-agent reviews/packets and advisor observations exist; no independent human audit | Named independent reviewer with authorized access, or gate stays pending. Do not contact/share automatically; no AI substitution. |
| PV-10 | Full family/requirement coverage reconciled before operational pilot | Narrow evidence does not complete transfers, archives, Manager delegation, all profile roles or lifecycle requirements | Keep canonical IDs and remaining scenarios; specify each as its domain becomes implementable. No blanket100% claim. |

## Current environment / grant boundary

Latest product source d68faa8 at READY restoration deployment `dpl_8bWgT5xGcZiDvAoqseCYx7ZZbe3X`; exact source CI40190277910/40190273493 passed. One guardian link is ended, zero active links; its Guardian membership remains active with no linked-player authority. Existing original email destination restored and new guardian recipients disabled. No new invitation, link restoration or membership suspension is authorized by consolidating this board.

Priorities: PV-01/02/05 are the next read/denial-only hosted batch when existing sessions are available; PV-03/04 need distinct effects authorization; PV-06/07/08 require declared measurement/tester context; PV-09 remains independent. In parallel, [I2c trainer entry policy](../06-delivery/i2c-trainer-entry-decisions.md) can be reviewed without waiting for unrelated future policy.

## Status/reporting rule

Record actual cases with date/source/environment/expected/actual/projection scope and limitations. Append links to this board and canonical rows after execution. A reviewed procedure is prepared, not tested. Do not rerun passing suites for counts or create fresh grants to make a dashboard look complete. Do not postpone a demonstrated access leak behind this board: stop the affected release, contain and repair first.
