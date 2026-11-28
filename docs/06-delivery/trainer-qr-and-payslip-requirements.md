# Trainer QR attendance and payslips

22 November 2026 · EX-22 / MP-B07 follow-up with EX-19 / MP-B04 attendance dependencies

The Owner requested this product direction be recorded after reviewing the combined workflow. This is a requirements checkpoint, not implementation, a new release, or approval of unresolved calculation and access rules. Preserve the [EX-22 synthetic baseline](../07-handoff/ex22-trainer-compensation-readiness-2026-11-22.md), the [EX-19 player QR baseline](../07-handoff/ex19-attendance-qr-checkpoint-2026-11-21.md), and the [current execution order](experience-execution.csv). [Implementation kickoff](../07-handoff/trainer-qr-and-payslip-start-prompt.md).

## User workflow

| Role | Entry and result |
|---|---|
| Authorized attendance operator | **Attendance → Scan QR**. Scan players and Trainers in one register. The register identifies the person type, branch, check-in time and relevant sessions. Routine scans take one action; show choices only when the match or coverage needs a decision. Keep manual fallback in the same task. |
| Academy Owner | **Finance → Trainer pay**. Set effective terms once, open the week or month, review exceptions that affect earnings, approve the explained payslips and record payments when they happen. Jump from an exception to its coverage record and return to the same pay period. |
| Trainer | **My payslips**. Open the latest own approved payslip or browse prior periods, see the calculation and outstanding balance, download the approved statement, or request a linked correction. No other Trainer's data, drafts, private reviewer notes or bank references. |

Use EN/AR and RTL, the Operations reference, and responsive phone and desktop layouts. Make the next action clear without separate attendance or payroll workflows for every pay model.

## Contract, period and payout

- **Per session:** an ordinary choice for any Trainer, including a regular Trainer and an academy that uses it for most staff. Each eligible completed session actually covered earns the applicable rate. Multiple sessions in one visit can earn separate fees. Use the actual Trainer's effective terms, not the scheduled person's rate.
- **Fixed pay:** an agreed amount with an explicit rate period, weekly or monthly. Record attendance regardless of the pay model. Missing scans, leave or absence must not automatically reduce fixed pay; only an accepted explicit adjustment rule can affect it.
- **Fixed plus sessions:** a guaranteed base plus eligible extras. Distinguish included sessions from extra sessions and show why each extra qualifies. Do not pay twice for work already covered by the base.
- **Payslip period:** weekly or monthly for each model. Show the contract as a plain summary, for example, “100 per verified session, with a weekly payslip.” A period is not a promised payday. An academy default may simplify setup; the individual effective contract determines earnings and reporting.
- **Payout:** record a confirmed manual full or partial cash or bank payment against approved liability, with verified date and a bank reference as applicable. Separate approval from disbursement; no automatic money movement or reminder implying a fixed payday. Keep payout history and prevent overpayment.
- **Explained statement:** show exact period boundaries, fixed amount if applicable, source-linked session lines and applicable terms, adjustments, original and net approved amounts, confirmed payouts and outstanding balance. Preview only when inputs are known. Freeze approved statement content and preserve posted history; current payout/balance information must not rewrite the approval snapshot. Private downloads must recheck current scope and disclose what is frozen versus current. Post later corrections as linked adjustments or successor records, not edits in place.

## Arrival and session coverage

Treat QR identity, arrival, verified coverage, and earning eligibility as separate facts. An authorized operator scans a Trainer credential into the same task as player QR. The credential identifies the Trainer; possession does not grant permission, prove that a session was led or authorize a payout. Check current credential status, academy, branch, actor, appointment, occurrences and capture policy server-side. Keep trainee matching and attendance records unchanged.

- **One session:** record an arrival, identify the exact eligible session and show its coverage state. A scan does not mark a future occurrence completed or paid.
- **Back-to-back sessions:** one arrival can be linked to a contiguous block at the same branch. Show the individual occurrences. Confirm completed routine coverage together where policy permits; keep a separate authoritative coverage result and audit history for each occurrence. Overlap, cancellation, substitution, early departure and missing evidence remain explicit exceptions. A later separate block requires another arrival. Do not use QR to auto-confirm future, overlapping or ineligible sessions.
- **Example:** scan once at 4:55 for 5:00, 6:00 and 7:00. The scheduled Trainer leads two sessions and a substitute leads the third. Preserve the arrival, show which Trainer covered each session, and pay the first Trainer 200 at 100 per eligible session. The substitute's fee follows their own effective contract. A fixed-pay Trainer's coverage remains visible without automatic deductions. This illustrates the model, not a new accepted rate or timing rule.
- **Correction and duplicate handling:** manual entry uses the same authority and scope; require a reason for overrides and corrections. Preserve original timestamps and receipts. Repeated scans, lost replies and concurrent operators must not create duplicate arrivals, coverage or earning lines. Changes after approval do not silently rewrite a payslip.
- **Offline target:** do not inherit player-register offline authority. Until a Trainer QR command and device scope are approved and proved, keep Trainer QR capture online and label offline unavailable. Future capture must be durably pending before acknowledgment and must use the original ID, same-account recovery and current authoritative acceptance before feeding earnings.

## Decisions to bring together

The Academy Owner approved decisions A–D on 23 November for the synthetic workflow. Use the accepted figures, attendance and statement rules, and baseline results in the [23 November decision packet](../07-handoff/trainer-qr-and-payslip-decisions-2026-11-23.md). Remaining choices in the table apply to extensions outside A–D.

| Gate | Decisions before dependent work |
|---|---|
| D-008 / MP-Q09: earning and period math | Academy-local week start and period boundaries, contract/frequency changes, joins and exits, fixed monthly amounts represented weekly and other cross-period combinations, rounding and residual handling, included versus extra sessions, cancellations, shortened sessions, leave and any attendance-linked deductions. Verify approved worked amounts across month/year boundaries and effective dates; never divide monthly pay by four by assumption. |
| D-003 / D-007 / D-011 / D-012: authority and attendance | Staff credential issue/revoke/replace and scope, who can scan or verify their own or another Trainer's coverage, permitted branch and block length/gap/window, manual reasons, when routine completed coverage can be accepted together, and who can approve or repair exceptions. An ordinary attendance permission is not payroll approval or payout authority. |
| Statement and release gates | Format and minimum private export fields, treatment after appointment ends under current access/retention policy, exact offline command/device scope (D-015 where applicable), hosted schema authority and Owner-only promotions. Real currency, statutory payroll, transfers and provider integration are outside this checkpoint. |

## Planned acceptance cases

These cases extend the existing requirements; none is passed by this document.

| Case | Required result | Traceability |
|---|---|---|
| TP-01: contract choices | Demonstrate all three earning bases with both supported statement periods under approved examples. Payslip frequency alone does not alter total earnings or trigger a payment. | AO/AT-063, 072; IMP-J19-A01 |
| TP-02: effective boundaries | Test joins, exits, term/frequency changes and weeks crossing months; allocate any approved fixed amount exactly once. No gaps or duplicate accrual, and historical terms stay unchanged. An overnight session uses the applicable accepted local-date policy. | AO/AT-063, 065, 068; IMP-J19-A01 |
| TP-03: actual coverage | Same scanner handles player QR and a Trainer arrival. Reopen exactly one arrival for one Trainer's 5/6/7 block, two completed covered sessions for that Trainer and one for the eligible substitute. Test a later block and ambiguous/overlapping, cancelled or reassigned sessions. No early accrual. | AO/AT-035, 036, 045, 064; IMP-J12-A01, IMP-J19-A01 |
| TP-04: entitlement and recovery | Refuse invalid/revoked credentials, wrong branch/academy, stale assignment/coverage and unauthorized self-verification. Exercise manual parity, duplicate scans, stale reviews, concurrent confirmation, and same-original recovery after lost replies. Existing player register and correction behavior stays intact. | AO/AT-035–038, 042, 067; IMP-J12-A01, IMP-J13-A01, IMP-J19-A01 |
| TP-05: exception versus pay | A missing scan does not change unconditionally fixed pay. Unverified per-session work or hybrid extras do not become approved earnings. A late coverage correction after approval creates a linked adjustment or returns an explicit refusal while preserving posted evidence. | AO/AT-064, 068, 070; IMP-J19-A01 |
| TP-06: statement, approval and payment | Approved snapshot is complete and reconciled. Only authorized approval can post it. Same-original payout recovery results in one payment, concurrency cannot overpay, a partial payout leaves the exact balance, and a cleared balance is never shown before confirmation. | AO/AT-065–069, 072; IMP-J19-A01 |
| TP-07: private usability | Operator can scan a substitute without leaving Attendance; Owner can explain a draft and return from its source; Trainer can find, reopen, download and dispute their own approved statement. Verify actual navigation, focus, EN/AR/RTL, phone and desktop, and foreign or revoked view/download refusal. | AO/AT-070–072, 118; IMP-J12-A01, IMP-J19-A01 |
| TP-08: offline boundary | For online-first delivery, offline capture cannot report queued or paid. After separate offline authorization, verify durable pending, reopen/reconnect, same-account original recovery, current authority and conflicts on declared devices. | AO/AT-039–046; IMP-J14-A01 |

## PYSA and platform billing boundary

The read-only [PYSA comparison](../07-handoff/ex22-trainer-compensation-readiness-2026-11-22.md#release-status) supports contract choice and readable statements. Do not copy legacy formulas, unscoped approval paths or incomplete payout generation. Platform billing remains the academy's subscription under [Academy plan](../02-workflows/platform-billing.md); preserve the verified-settlement and access-restoration rules in EX-23 independently of Trainer pay.
