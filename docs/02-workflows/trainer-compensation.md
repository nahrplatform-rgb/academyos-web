# Trainer contracts, earned compensation and payment runs

## Current planning integration —7 November 2026

The [canonical master plan v2](../06-delivery/master-plan-v2/README.md) and [finance simplification specification](../06-delivery/master-plan-v2/finance-simplification-and-control.md) govern current delivery. Preserve canonical earning/approval/payout/history outcomes and exact authority. Do not import PYSA formulas or add review at every intermediate state. The effective contract, required preparation/approval separation, recoverable original and explained statement remain; specific rate/delegation choices are still decisions.

Requirements: AO-063–072. D-008 must settle formulas and contract policy; D-007 settles approvals. This is an operational compensation ledger, not an assumption that AcademyOS replaces statutory payroll or accounting.

## Approved synthetic EX-22 scope · 22 November 2026

The [approved worked example](../07-handoff/ex22-trainer-compensation-readiness-2026-11-22.md#approved-first-synthetic-workflow) selects effective per-session terms in fictional units, Owner-verified actual coverage, branch-eligible substitutes, separate preparation and approval, linked reasoned corrections and confirmed manual partial payouts. The Trainer sees their own approved statement. The broader contract below retains the additional decisions and capabilities required for later scope.

## Required product direction · Trainer QR and payslips · 22 November 2026

The Owner requested this combined workflow be documented. It extends, but does not replace or broaden, the accepted EX-22 per-session synthetic trial. Detailed roles, sequences, examples, decision gates and acceptance cases live in [Trainer QR attendance and payslips](../06-delivery/trainer-qr-and-payslip-requirements.md). Implementation must wait for its exact policy dependencies; this direction alone does not settle the open calculations, access, attendance or payment rules.

- Trainer contracts can use **per-session**, **fixed weekly/monthly**, or **fixed plus eligible sessions**. Per-session pay is a normal choice for regular Trainers and can be the academy's common model. Earning basis is independent of weekly or monthly statement frequency and actual payout timing.
- One authorized Attendance task should recognize Trainers and trainees. A Trainer scan records arrival, not proof of completed work, payroll coverage or permission. One arrival can associate with a visible contiguous back-to-back block; every occurrence still has its own coverage state. Substitutes use their own effective terms. Trainer QR/offline availability cannot be claimed before implementation and verification.
- An approved statement explains its period, applicable terms, original lines, adjustments, approved amount, confirmed payout and remaining liability. Preserve immutable approved evidence and expose only the Trainer's own statement.

**D-008 still needs concrete examples before calculation work:** week boundaries, effective changes, fixed-pay proration, monthly amounts allocated across weekly periods, included versus extra sessions, leave/absence/cancellation/short sessions, overnight boundaries, rounding and residual handling. Do not divide a monthly amount by four by assumption or deduct fixed pay for attendance without an approved term.

## Contract model

A protected contract version records trainer, academy, currency, effective interval, compensation basis, rate or salary terms, eligible session types, substitution/coverage terms, leave treatment, rounding, adjustment rules and approver. Keep confidential terms outside general staff-directory responses. Contract changes create new versions with non-overlapping effective intervals or an explicitly approved precedence rule.

Other examples to decide include hourly rates, partially attended sessions, cancellations, late substitutions, cross-midnight sessions, paid leave, unpaid leave and corrections after a run closes. The product must not guess these from PYSA behavior. Write approved examples and expected amounts before implementing the calculator.

## Prepare a run

An authorized preparer selects period, trainers and branches. The system identifies the effective contract for each earning event's applicable date, not simply the trainer's latest contract. It records source attendance/session IDs and versions, contract version and calculation version. Missing/overlapping contracts, unresolved corrections and invalid durations are exceptions that block the affected item.

Run lifecycle: draft → calculating → review required → approved → payment pending → partially paid or paid → closed. A failed calculation can be retried with the same frozen input intent. Item-level unique keys prevent duplicated earnings when a run was only partly saved. Completion requires reconciliation of expected and generated items.

The review screen explains how each amount was calculated: eligible units, rate, adjustments, gross result and rounding. Separate earned compensation from disbursement. An approved statement does not mean money has been transferred.

## Approval and payment

The owner approves the run unless an explicit delegation policy says otherwise. A manager with preparation authority cannot approve through a direct RPC. Stale membership/role claims cannot preserve approval authority. Use step-up authentication where configured for sensitive approvals.

Approval freezes the calculation and captures actor, timestamp, reason and approved totals. Payment records name the approved item/run, amount, currency, method, reference and evidence. Partial payments preserve the remaining liability. Repeated payment recording uses idempotency and cannot exceed the eligible balance without a separate approved adjustment.

Corrections after approval create adjustment lines or a successor run, preserving the original statement. Do not edit closed earnings in place. Reopening, if supported, is a privileged audited workflow with explicit downstream effects.

## Trainer experience

The Trainer sees their own approved statements by weekly or monthly period, approved earnings, confirmed payouts, outstanding liability and understandable line explanations. Provide a latest-statement path and prior-period history; any download is authenticated and scoped. The Trainer can request a linked correction. They cannot read another Trainer's rates, drafts, internal reviewer notes, bank references or full academy payroll. A notification says a statement is available and links to authenticated access; it does not send private amounts to an unverified contact.

## Trainer QR arrival and back-to-back sessions

The target is one shared QR register for trainee cards and Trainer credentials. Authenticate the operator and credential, check current academy/branch/session scope, and distinguish identity, arrival, occurrence coverage and earning eligibility. Possessing a credential grants no permission and does not prove a session was led. Keep player QR issuance and public-card restrictions unchanged.

A Trainer may scan once on arrival for a displayed contiguous block of sessions at the same branch. Preserve one source occurrence and one coverage decision per session, even when an authorized operator confirms routine coverage as one batch. A substitute names the actual Trainer and uses that person's effective contract. A later, separate block requires a new arrival. Overlap, future/cancelled/reassigned sessions, branch changes, early departure, missing evidence and substitutions that cannot be confirmed go to an explicit review/fallback. Manual entry requires the same authority, scope and a reasoned correction. Duplicate scans, concurrent operators and lost replies resolve to one original arrival and one canonical coverage per occurrence.

Trainer QR/offline commands do not inherit the accepted player-register offline authority. Keep the capability online until its exact command, device, key, field, retention and replay policies are accepted and tested. A pending local scan is never presented as a confirmed arrival, covered session, earning, approved statement or payout.

## Acceptance

Retain the accepted EX-22 cases and add the full [TP-01–TP-08 matrix](../06-delivery/trainer-qr-and-payslip-requirements.md#planned-acceptance-cases): all earning models with weekly and monthly statements; cross-month/year boundaries; QR arrival and a multi-session block with a substitute; duplicate, stale, concurrent and same-original recovery; exceptions; private statement history/download; and explicit offline boundary. Reconcile original earning lines, linked adjustments, confirmed payout and remaining liability against the immutable approved evidence.
