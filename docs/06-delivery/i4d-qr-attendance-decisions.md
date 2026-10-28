# I4d — revocable player QR and exact-session attendance

28 October2026. **Recommendation only; Owner policy acceptance pending.** I4a manual attendance, I4b Guardian view and I4c request/review working wording/usability are accepted for their bounded scopes. [I4c receipt](../07-handoff/i4c-attendance-correction-implementation.md). This packet advances the remaining QR/manual parity requirement without retiring offline, wider roles or other roadmap stages.

## Outcome and traceability

Owner opens an existing fictional player → issues a card → can print/save it for synthetic testing → can revoke or replace it. Assigned Trainer or Academy Owner opens a specific published session → starts scanner or enters the card code → reviews the matched fictional player and current mark → explicitly records Present → reopens the same canonical attendance/history. Manual Present/Absent and correction paths remain available.

J06 card lifecycle association, J12-A01/A02/A03 / IMP-J12-A01 / S18/S28 / L05/L08 / SEC-J06/SEC-J12; scoped AO-018/035/036/042/045 and matching acceptance cases. Existing matrix coverage is not whole-requirement closure. [Engineering preparation](../04-engineering/i4d-qr-attendance-preparation.md), [attendance workflow](../02-workflows/attendance-and-offline.md), [people workflow](../02-workflows/academy-people-and-onboarding.md). New D-012 QR validity and D-003 credential authority below remain proposed.

## Recommended policy for design

| Choice | Recommendation and consequence |
|---|---|
| Who issues cards? | Current Academy Owner issues, revokes or replaces one player card in that academy. One currently valid card per player. No Trainer issuance, Manager powers, player login or public card page. |
| Card validity | Card remains valid until explicitly revoked or replaced. Replacement invalidates the previous code atomically; no automatic expiry in this first slice. Old attendance/history remain. This policy needs explicit acceptance; no legacy expiry default is imported. |
| Meaning of a card | It identifies a fictional registered player for a currently authorized scanner. Possession grants no login, academy membership, Guardian access or attendance authority. A copied card cannot prove physical presence; the operator checks the matched player. |
| Session and actor | Assigned active Trainer or current Academy Owner selects one currently published occurrence before scanning. Same exact roster, academy/branch, current player existence, server recording window and effective session checks as manual capture. No general/front-desk scan, guessed session, drop-in or staff check-in. |
| Marking | Scan resolves a minimal match, then explicit review/Record Present. No camera-frame auto-save. Unmarked→Present uses canonical attendance/history/receipt; existing Present shows Already recorded without another mark. Existing Absent goes to the accepted correction path; scanning cannot overwrite it. Manual Absent remains explicit. |
| Revocation and concurrency | Recheck card, session, roster and current actor authority at commit, including after review. Revoked/replaced code denies new capture; competing replacement/revoke/record serialize with one truthful outcome. Original committed receipts remain reconcilable only under current actor/session authority. |
| Card delivery | Owner-only authenticated card display and local print/save for fictional staging data. No email, Guardian card exposure, public links, bulk cards, real children or account grants. Camera is optional; explicit camera permission and code entry/manual fallback are part of the design. |

Approved attendance window stays effective session start through24 hours after effective end; this proposal does not extend it. Present/Absent and Owner/direct or Trainer/request corrections retain their accepted authority. No late/excused/check-out, biometric/physical-presence guarantee, notifications, fees, offline storage or retention schedule is introduced.

## Existing implementation and reuse

Inspected current `attendance-workspace.tsx`, `lib/attendance.ts`, I4a canonical migration and I4c implementation/receipts. `/api/attendance` currently accepts bounded roster/history/mark/reconcile and correction commands, with current identity through the signed gateway. No player QR credential table, issuance/revocation operation, decoder or camera scanner exists. `academy.players` currently has no archive state or archive operation; do not pretend an archive test is possible on this model. Verify current player membership in the exact published roster; any future archive lifecycle must block both manual and QR capture through their shared eligibility contract before shipping that lifecycle. Deleted/missing/foreign targets deny today.

Reuse compact-blue shell, three panes/phone list-detail, exact occurrence identity, complete roster coverage, native review/acknowledgment, version checks, current-authority reads, immutable history and original-operation recovery. Add credential lifecycle and resolution around the existing canonical attendance contract; avoid a second mark ledger, attendance status or independent scanner policy.

## PYSA read-only reference inspected —28 October2026

Local `/Users/moamenghareeb/Pro Youth Football Academy`; source-only observation, no legacy account/provider/live test or changes. Relevant paths:

- `platform-description/PYSA-current-surface-reference.md`: member/staff/Guardian QR surfaces, session-scoped Trainer scanner, absent general-scanner onboarding link and FND-0045 eligibility mismatch.
- `pysa-platform/components/attendance/qr-scanner.tsx`: camera/decoder readiness, selected session/branch, actionable errors, manual search fallback and duplicate-feedback pattern. Preserve session-first context, camera recovery and per-player result. Its general/auto-open/drop-in and IndexedDB queue branches are not accepted AcademyOS policy. In-memory recently-scanned suppression is a convenience, not duplicate-write protection.
- `pysa-platform/actions/attendance.ts`, `resolveMemberFromQr` and QR/manual writers: current academy/card/player lookup, active/revoked/expired card checks and roster/window selection are useful boundaries. Current source supports both structured signed cards and legacy member/salt credentials; neither format or compatibility authority is imported.
- `pysa-platform/lib/utils/qr-card.ts`: HMAC card format and timing-safe comparison; also contains fallback signing-secret selection and broad HTTPS parsing. AcademyOS should use a strict versioned credential format and dedicated random credentials, without copying key material, fallback secrets or accepting arbitrary websites as identity.
- `engineering-audit/03-evidence/database/EV-0070-archived-attendance-sql.md`: fresh general manual marks for archived targets persisted in actual disposable SQL. Avoid eligibility divergence between scanner and manual path.
- `EV-0071-attendance-helper-authority.md`: synthetic supplied helper roles could exceed current Trainer authority; real camera/card/Auth/HTTP not proved. Every public boundary and commit must resolve current authority, including direct requests.

Useful behaviors are preserved in the ongoing ledger; source presence does not establish hosted QR behavior or remediation of PYSA defects.

## Next gates

Owner accepts/modifies proposed policy → connected EN/AR phone/desktop prototype, credential lifecycle and scanner/failure/recovery design → separate design approval → real implementation/database/negative/concurrency tests → protected staging demonstration and working acceptance. Camera hardware/browser permission and physical scan proof remain distinct from a typed code or decoder fixture. No account restoration or camera permission is inferred from policy/design approval.
