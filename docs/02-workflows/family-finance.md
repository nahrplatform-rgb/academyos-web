# Family fees, bills, receipts, corrections and reconciliation

Requirements: AO-047–062. Decisions D-001, D-005, D-006, D-007 and D-010 must settle the actual commercial rules before financial implementation. This specification defines integrity and workflow, not tax or legal policy.

## Boundary and records

This domain records money owed by a family or payer to an academy. It is separate from trainer compensation and the academy's subscription to NAHR. Use a payer account with explicitly authorized people; a guardian link alone does not establish a shared family wallet.

Records include fee plan/version, effective assignment, bill, bill line, adjustment, receipt, receipt allocation, reversal/refund request, provider transaction, reconciliation item and audit event. Every amount has a currency and an integer minor-unit amount. Currency exponent comes from the supported currency catalog; never assume every currency has two decimals. Rates and prorations use decimal/rational arithmetic with a documented rounding boundary.

Posted bills and receipts are immutable financial evidence. Correct them with explicit compensating records. Drafts may be edited with version checks. Totals are reproducible from source lines and allocations, not manually editable cached fields.

## Decisions needed for fee calculation

For each plan record: charging basis, eligible population, effective dates, billing cycle, enrollment/end boundary, holidays, absences, cancellation/makeup policy, proration, sibling/discount eligibility, tax treatment, rounding and due-date rule. Test examples must be approved for joining mid-period, pausing, leaving, changing plans, overlapping assignments, future plans and an already billed period.

A future plan assignment must not remove the player's currently effective plan from this month's billing population. A bulk assignment operation reports each proposed change and uses stable item keys; retrying a partially completed batch cannot duplicate active plans or bills.

## Bill generation

An authorized finance operator previews a period and scope. The preview identifies eligible payers/players, applied plan versions, exclusions, totals and conflicts. Approving the preview freezes its input specification and calculation version. The generation operation has a unique business key for academy, period, charge scope and approved generation version.

Large runs may process in chunks, but each item has a receipt and the overall run records expected, completed, failed and skipped counts. Mark the run complete only when its reconciliation rules pass. Retrying uses the same frozen intent; a changed plan or new date range requires a new approved operation. A partial run is visible and repairable.

Bill states: draft → issued → partially settled → settled; other transitions include voided before settlement, disputed and adjusted. Exact overdue/grace treatment is policy. Show outstanding amount, settled amount, credits and due date separately. Do not label a balance as zero when the balance query failed or was not implemented.

## Manual receipt and allocation

1. Select the payer and verify current academy, permitted collector and relevant open bills.
2. Enter amount, currency, payment method, effective received time, external reference and optional private proof.
3. Review allocation across bills and any unapplied amount. Reject over-allocation, cross-currency allocation or foreign-academy references.
4. Submit one stable operation key and payload hash. In one transaction, create receipt, allocations, ledger effects and audit event.
5. Return the committed receipt ID and new balance/version. Repeated submission with the same payload returns the same receipt. Reusing a key for another payer/amount is a conflict.

Recorder identity is derived from the authenticated actor. The payer/player association is validated, never accepted simply because an ID exists. A timeout displays an unknown result and provides operation lookup; it does not invite the collector to create a new receipt with a new key.

## Online payment

The server creates a payment intent from authoritative bill amounts and selected merchant configuration. The browser receives only the hosted checkout/session information needed to pay. Browser success redirects are informational. Settlement requires a verified provider event or server-side reconciliation that matches merchant, mode, order, amount, currency and terminal provider state.

Event deduplication and financial allocation must be one recoverable operation. If event receipt is recorded but allocation fails, retry must resume allocation rather than discard the event as already seen. Out-of-order events follow a transition table. Never downgrade a settled transaction to pending because an older event arrived later.

The merchant model is an open decision. NAHR subscription collection and academies collecting family fees may require different merchant accounts, contracts and integrations. A platform-owned gateway key cannot silently authorize holding money for every academy.

## Corrections, reversals and refunds

An authorized requester names the original receipt, amount, currency, reason and allocation impact. A partial reversal must specify its amount; an omitted amount cannot mean “reverse everything.” Concurrency checks prevent total reversals/refunds from exceeding the available original amount.

Approval checks authority, self-approval restrictions and policy thresholds. Commit the correction and balance effects together. A correction referring to another academy's receipt is denied. Moving an allocation between bills updates both parent totals consistently or rolls back entirely.

A refund request is distinct from a confirmed refund. Provider submission may be pending or outcome unknown. Show that state, reconcile by the provider reference, and only record confirmed external money movement when evidence exists. A failed refund does not erase the original receipt. Manual reversal of a recording error does not imply cash was returned.

## Reports and acceptance

Cash collected, invoiced revenue, outstanding receivables, discounts, reversals, refunds and unapplied cash are different measures. Every dashboard/report defines its basis and date field. Net cash includes applicable reversals and confirmed refunds. The same period/filter on screen and exported report must reconcile to source rows.

Acceptance includes duplicate clicks, lost responses, concurrent allocations, wrong currency, provider amount mismatch, duplicate/out-of-order webhook, allocation failure after event receipt, partial bill run, future plan assignment, repeated bulk assignment, partial reversal and parent-total updates. Direct table writes/RPCs must not bypass the workflow. Use synthetic money and an approved reference calculation workbook; no production charging is needed to prove business arithmetic.
