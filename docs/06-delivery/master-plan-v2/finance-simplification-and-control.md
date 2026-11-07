# Finance: simple operating journeys with reliable control

## Purpose and authority

Owner direction on 7 November: PYSA finance was a mess and contained unnecessary work. AcademyOS must make money understandable and routine work efficient, rather than reproduce every legacy mechanism. This is a planning specification, not approval of prices, tax treatment, accounting standards, rates, refunds, merchant/provider arrangements, automated money movement or new role powers.

Keep canonical **AO-047–084**, their AT cases and the three domain contracts: [family finance](../../02-workflows/family-finance.md), [Trainer compensation](../../02-workflows/trainer-compensation.md) and [platform billing](../../02-workflows/platform-billing.md). Relevant unresolved choices remain D-001/D-005–010 and [MP-Q06–10](decision-dependencies.csv). Preserve accepted separation of preparation/approval and auditable financial changes; change a rule only through its actual decision. Simpler interaction must still implement those outcomes.

## Three separate money stories

| Ledger | User's main questions | Simple target journey | Authority |
|---|---|---|---|
| Academy family billing | What does this family owe? For which period/service? What was received? What remains? | Agreed fee assignment → clear charges/statement → record or receive payment once → current balance → source-linked correction when needed | Academy scope and approved payer/Guardian view; no automatic right from a typed contact |
| Trainer compensation | What was earned? Under which terms? What was approved/paid? Why is an exception pending? | Effective contract → explained earning statement → required review → payout record → history | Exact contract/effective scope, separation of preparation/approval and permitted statement access |
| Platform subscription business | Which academy is on which plan? What is due/settled? What service/restriction applies? | Effective plan → platform invoice/payment → reconciled subscription state → renewal/recovery → history | Platform merchant/ledger and explicit academy relationship; no implicit child-data access |

Each has one canonical financial record and its own scope, state machine, currency and correction semantics. They may share amount/date/receipt UI primitives; they must not share a universal balance, a client-derived Paid flag or a generic timestamp-wins writer. A platform payment is not family revenue. An earning approval is not cash disbursement. A device save is not a settled payment.

## Design the job before choosing mechanisms

The first meaningful screen explains amount, period, status, why it exists and the next permitted action. It offers drilldown to source and retained history without forcing a full ledger investigation for routine work. Show authoritative totals and a separate Unavailable/partially prepared state. A profile should link its permitted financial context rather than hold a second editable balance.

Prefer accepted effective defaults, explained calculation previews and one concise confirmation for the meaningful financial action. Calculate routine results automatically only once the rule is accepted and reproducible. Required independent approval remains clear and actionable; do not add a further manual review for every intermediate technical state. Batch operations where they have an explicit atomic/per-item contract, and show only genuine exceptions requiring attention.

For each proposed mechanism—manual proof, credit wallet, refund request, family payer arrangement, extra-session charge, adjustment type, recurring generation, payout review—identify the underlying job and current canonical requirement. Decide whether the mechanism is required now, conditionally exposed, later scope, replaced with a simpler valid implementation, or awaiting policy. **No silent retirement of an agreed financial outcome.** Full future scope does not require every mechanism on the first screen or in the first release.

## What to retain and what to avoid from PYSA

Reference root: `/Users/moamenghareeb/Pro Youth Football Academy`. These are historical audit observations at inspected source `37d8901c`; they are not newly executed AcademyOS tests or current hosted incident claims. The coordinator verified the cited finding text after a bounded read-only reference review.

| Legacy finding / source anchor | Observed problem and evidence boundary | AcademyOS requirement and prevention |
|---|---|---|
| FND-0005, `engineering-audit/02-findings/high/FND-0005.md:11–24` | Payment insert followed by allocation failure is acknowledged on retry without repair; synthetic helper fault, real corruption unverified | AO-053–056: one original intent and atomic/recoverable payment/allocation completion; existence alone is not success |
| FND-0009, `high/FND-0009.md:11–25` under the same findings root | Authentic synthetic Checkout events can be unpaid; currency is dropped before mocked persistence; no live payment | AO-055/057: verify merchant/invoice/settlement/currency/amount, preserve event ordering and reconcile unknown outcomes |
| FND-0018, `high/FND-0018.md:10–18` | Roster commits before billing; a retry sees unchanged roster and skips failed charge work; synthetic DB boundary | Keep scheduling and money consequences explicitly contracted; atomic internal consequences or a durable resumable transition; no automatic fees beyond accepted policy |
| FND-0074, `medium/FND-0074.md:10–24` | Bill header can survive missing required item; generation retry does not repair it; modeled fault and separately constructed local SQL state | AO-050/051/054: stable generation intent, reconciled items/totals and recoverable incomplete state; no normal issued result from a header alone |
| FND-0035, `medium/FND-0035.md:10–20` | Ready earning header can lack required items; retry blocks and incomplete record can reach paid; injected SDK fault plus separately constructed local SQL, no transfer | AO-065/066/068/072: atomic/recoverable generation, contract-aware completeness and immutable approved evidence |
| FND-0036, `medium/FND-0036.md:10–18` | Future/expired active contracts contribute to an earning preview; actual function with mocked data, not hosted SQL | AO-063: effective-period eligibility shared by preview and commit; proration is a separate accepted rule |
| FND-0033, `medium/FND-0033.md:10–14` | Cash projections ignore reversals; real local SQL plus modeled/actual DAL paths, no hosted UI proof | AO-061: define gross receipt, correction, effective amount and actual cash movement separately; one reconciled projection contract |
| FND-0083, `medium/FND-0083.md:9–17` | Directory hardcodes zero despite a nonzero bill/dashboard; actual synthetic local browser/DB plus isolated tests, not ledger corruption | No fabricated balance. Reuse scoped authoritative projection, with freshness/completeness and Unavailable |
| FND-0028, `medium/FND-0028.md:10–28` | Export reports success after truncation; later actual local worker/DataAPI/Storage evidence yields 1,000 of 1,006, no hosted incident | Complete ordered snapshot/chunk reconciliation and explicit partial results; loaded-page counts are not financial totals |
| FND-0077, `medium/FND-0077.md:16–26` | Mismatched administrator key can reuse a different proof payment in local privileged SQL; mounted UI derives proof-specific keys, no hosted incident | AO-078/079: bind idempotency to complete immutable tenant/invoice/proof/currency/amount intent; validate it at the authoritative boundary |

These examples justify retaining integrity and recovery controls. They do not justify importing legacy formulas, every option in its UI, a global approval hierarchy or all previous accounting categories. Broader findings remain in the [reference inventory](pysa-reference-audit.md); further form/pipeline/provider review is still required in financial batches.

## Required authoritative contracts

| Contract | Required specification before its writer |
|---|---|
| Amount and period | Currency/minor-unit precision, rounding, effective timezone/period, allowed inputs and worked examples; no invented tax or pro-rata |
| Source and history | Immutable plan/contract/charge source version, payer/recipient relationship, actor and retained correction chain |
| Intent and transaction | Original operation ID, full semantic payload binding, authorization/version checks and commit boundary; safe concurrent duplicate handling |
| State | Difference between draft/prepared/approved/received/allocated/settled/paid as applicable to that domain; exact allowed transitions and truthful user labels |
| Provider integration | Merchant eligibility, authentic event plus business validation, ordering/retry, external attempt identity and reconciliation; client success is not proof |
| Aggregation | Balance/statement/dashboard/export definitions reconcile to source across corrections, periods, currencies and all pages |
| Delegation | Who prepares, approves, records payment and corrects it; branch/amount limits if chosen; distinct-account requirements retained where canonical |
| Local/sync | Exact permitted read projection and any future typed draft/command; local acknowledgement, deadline/version/conflict/refusal and protected recovery |

For offline finance, the full-app local direction remains. Prepare permitted statements and operational context as each finance module is built. New financial drafts/queued operations need explicit command contracts; do not treat the approved attendance queue as authority to settle money offline. A confirmed settlement, cash transfer or irreversible provider action requires the current canonical/provider checks. Local capture time is evidence of intent, not power to rewrite financial history.

## Concrete review examples for MP-B06, MP-B07 and MP-B08

1. Owner opens a family statement and can explain every amount/period/source; no manually entered duplicate balance.
2. Payment receipt and allocations either complete together or expose recoverable original progress; interrupted retry produces one result.
3. Partial receipt, unallocated money, correction and cash refund remain distinct under accepted examples; cross-currency values never silently sum.
4. A contract change affects the correct future period while a closed earning statement keeps its original terms.
5. A delegated preparer and authorized approver complete the required review with no extra technical ceremony or self-approval bypass.
6. Platform subscription state follows the correct academy invoice/provider or approved proof; foreign proof/key replay cannot allocate money elsewhere.
7. Dashboard, detailed statement and complete export reconcile for the same source period, including reversals and incomplete preparation.
8. Timeout, stale version, access loss and account/academy switch retain the original and show a focused safe action; no optimistic Paid.

Use synthetic worked amounts only after arithmetic policy is chosen. This checkpoint provides scenarios and defect prevention, not results. Measure actual task effort/request volume and comprehension at the connected financial batch review. Owner acceptance and actual provider/hosted proof remain separate.
