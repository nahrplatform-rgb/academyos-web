# Trainer contracts, earned compensation and payment runs

## Current planning integration —7 November 2026

The [canonical master plan v2](../06-delivery/master-plan-v2/README.md) and [finance simplification specification](../06-delivery/master-plan-v2/finance-simplification-and-control.md) govern current delivery. Preserve canonical earning/approval/payout/history outcomes and exact authority. Do not import PYSA formulas or add review at every intermediate state. The effective contract, required preparation/approval separation, recoverable original and explained statement remain; specific rate/delegation choices are still decisions.

Requirements: AO-063–072. D-008 must settle formulas and contract policy; D-007 settles approvals. This is an operational compensation ledger, not an assumption that AcademyOS replaces statutory payroll or accounting.

## Contract model

A protected contract version records trainer, academy, currency, effective interval, compensation basis, rate or salary terms, eligible session types, substitution/coverage terms, leave treatment, rounding, adjustment rules and approver. Keep confidential terms outside general staff-directory responses. Contract changes create new versions with non-overlapping effective intervals or an explicitly approved precedence rule.

Examples to decide include hourly versus per-session pay, partially attended sessions, cancellations, late substitutions, cross-midnight sessions, paid leave, unpaid leave and corrections after a run closes. The product must not guess these from PYSA behavior. Write approved examples and expected amounts before implementing the calculator.

## Prepare a run

An authorized preparer selects period, trainers and branches. The system identifies the effective contract for each earning event's applicable date, not simply the trainer's latest contract. It records source attendance/session IDs and versions, contract version and calculation version. Missing/overlapping contracts, unresolved corrections and invalid durations are exceptions that block the affected item.

Run lifecycle: draft → calculating → review required → approved → payment pending → partially paid or paid → closed. A failed calculation can be retried with the same frozen input intent. Item-level unique keys prevent duplicated earnings when a run was only partly saved. Completion requires reconciliation of expected and generated items.

The review screen explains how each amount was calculated: eligible units, rate, adjustments, gross result and rounding. Separate earned compensation from disbursement. An approved statement does not mean money has been transferred.

## Approval and payment

The owner approves the run unless an explicit delegation policy says otherwise. A manager with preparation authority cannot approve through a direct RPC. Stale membership/role claims cannot preserve approval authority. Use step-up authentication where configured for sensitive approvals.

Approval freezes the calculation and captures actor, timestamp, reason and approved totals. Payment records name the approved item/run, amount, currency, method, reference and evidence. Partial payments preserve the remaining liability. Repeated payment recording uses idempotency and cannot exceed the eligible balance without a separate approved adjustment.

Corrections after approval create adjustment lines or a successor run, preserving the original statement. Do not edit closed earnings in place. Reopening, if supported, is a privileged audited workflow with explicit downstream effects.

## Trainer experience

The trainer sees their own statement, period, approved earnings, payment status and understandable line explanations. They can raise a dispute or ask for clarification through a linked case. They cannot read another trainer's rates, management notes or full academy payroll. A notification says a statement is available and links to authenticated access; it does not send private amounts to an unverified contact.

## Acceptance

Use two contract versions spanning a period, a mid-period substitution, overnight session, excluded absence, correction and partial payment. Test failed chunk/retry, duplicate preparation, concurrent approval, revoked preparer, manager direct approval, foreign trainer ID and historical statement consistency. Verify the sum of items equals the approved total and the sum of confirmed payments plus remaining liability equals that total after approved adjustments.
