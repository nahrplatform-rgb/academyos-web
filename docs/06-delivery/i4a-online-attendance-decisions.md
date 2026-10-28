# I4a — connected online attendance recommendation

28 October2026. **Policy accepted for design; connected design review remains separate.** I3e working session-change wording/usability is accepted separately. This packet starts the next dependency-ordered journey; it does not yet authorize attendance implementation or account grants.

## Recommended first usable outcome

Assigned Trainer opens their published dated session → sees the complete fictional roster and saved marks → records Present or Absent → receives a committed result → reopens the same register. Academy Owner can operate the same register and correct a saved mark with a reason and retained history. Trainer cannot silently replace a committed mark; the UI directs them to the Owner for correction in this first slice.

| Choice requiring Owner decision | Recommendation and consequence |
|---|---|
| Who can record? | Current Academy Owner or current active Trainer assigned to that exact published occurrence in the same branch. No new Manager capability, Platform Owner bypass or guardian permission. Assignment alone does not allow private draft access. |
| Statuses | Explicit Present / Absent; Unmarked means no saved decision and never becomes Absent automatically. Late, Excused, early departure and checkout remain visible future decisions, not guessed calculations. |
| When? | From the effective scheduled start until24 hours after its effective end, using authoritative server time and saved branch timezone for display. Before/after the window the register is read-only. This is a proposed pilot rule, not a PYSA default or accepted AcademyOS rule. |
| Correction | Within that same window, Owner may explicitly review and replace a mark with a required reason, expected current version and immutable before/after history. Trainer correction requests/approval workflow and after-window corrections follow separately; no silent overwriting or deletion. |
| Schedule protection | Once any attendance is committed, block move, cancellation, plan/roster replacement and withdrawal for that occurrence. Preserve the occurrence/publication/roster used for attendance. Any future exceptional correction needs its own explicit policy. Enforce this across existing writers under the same locking protocol. |
| Visibility and effects | Only this academy's Owner and currently assigned active Trainer see this register. No family publication, QR credentials, offline queue, fees, payroll or notifications. These remain scope to deliver later, not retired requirements. |

No bulk “mark everyone absent” or session-completed claim: show explicit saved/unmarked coverage across the full roster. A canceled occurrence cannot accept a mark. A moved occurrence uses its effective date/time while retaining its original stable identity.

Why this order: the existing schedule, dated assignments, published roster and move/cancel history now provide the prerequisites. Manual capture establishes the authoritative attendance contract before QR, offline and family projections reuse it. QR/manual parity remains open until both are implemented and tested.

## Current implementation and traceability

Source inspected: `apps/web/src/components/publication-workspace.tsx`, `apps/web/src/lib/publication.ts`, Trainer schedule page and I3e contracts/receipt. Published schedule/roster reading exists; no attendance operation/register is implemented. Reuse the existing authenticated gateway, bounded roster reads, three-pane shell/phone detail, status and original-operation recovery patterns. Do not create a second schedule source or derive Today from weekday recurrence.

J12 / IMP-J12-A01 (capture action family), J13 / IMP-J13-A01 (only the proposed Owner direct-correction subset; request/review remains open); S27 and attendance screens; L08; SEC-J12/SEC-J13. Scoped AO-035/036/037/038/042/045 and AT equivalents are associations, not closure. AO-018 QR and AO-039–046 offline scope remain separately pending. D-012 is narrowed only if the Owner accepts these recommendations; broader D-003 role delegation remains unresolved.

## PYSA reference inspected, read-only

Local reference root `/Users/moamenghareeb/Pro Youth Football Academy`, source37d8901c as recorded by the scheduling review. Inspected attendance action/validation/policy source and audit evidence; no live PYSA, real people, credentials or provider/database access.

- `pysa-platform/actions/attendance.ts`: selected session/roster context, manual/QR policy and correction paths.
- `pysa-platform/lib/validations/attendance.ts`: explicit status/method/event context; these schemas do not approve AcademyOS's statuses/defaults.
- `pysa-platform/lib/attendance/qr-attendance-policy.ts`: exact occurrence, window and roster eligibility, distinct already-marked/closed/canceled failures. Preserve explicit context and actionable rejection; do not import general-scan/drop-in powers or clock defaults.
- `engineering-audit/03-evidence/database/EV-0024-attendance-correction-consistency.md`: synthetic action failure/zero-row/reviewer-race evidence. Preserve one atomic correction/history/receipt transaction and test actual database races; mocked results do not prove hosted behavior.
- `engineering-audit/03-evidence/database/EV-0071-attendance-helper-authority.md`: supplied helper role context could bypass wrapper checks in synthetic cases. Every callable boundary must resolve current principal; never trust submitted actor/role.
- `engineering-audit/03-evidence/database/EV-0070-archived-attendance-sql.md`: actual disposable SQL allowed fresh archived-member marks in a general path. Recheck eligible current player and exact roster at commit, including direct data-boundary requests.

Useful continuity: schedule → exact occurrence → complete roster → per-person committed state → correction/history. Intentional initial differences: manual only, explicit statuses, no general scan/drop-ins, family access, finance or offline. Full PYSA parity remains incomplete.

## Next gates

Owner policy choice → connected EN/AR phone/desktop design including failure/recovery → separate design review → dependent implementation and meaningful local/hosted tests → working acceptance. [Engineering preparation](../04-engineering/i4a-online-attendance-preparation.md) records intended retrieval/security/performance cases. This is documentation preparation only; no product/schema/provider/access change or deployment.

## Policy acceptance —28 October2026

Moamen explicitly selected “Accept these attendance rules for design”: assigned Trainer/Owner manual Present/Absent within start through24 hours after effective end; Unmarked never means Absent; Owner-only reasoned correction/history; attendance protects schedule/roster. This settles only the bounded recommendations above for design. QR, late/excused, guardian visibility, offline, delegated Manager authority and broader correction workflows remain pending. No real access grant or implementation approval is inferred.
