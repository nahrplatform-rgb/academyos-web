# I3d — publish planned dates to their assigned Trainer

27 October2026. **Owner accepted this publication and Trainer-visibility policy for design on27 October2026.** I3c working EN/AR wording/usability was explicitly accepted; its separate security/device/load gates remain open. This packet proposes the next useful I3 outcome, not attendance or the full scheduling product. The explicit policy reply approves design preparation only; connected-design approval and actual account grants remain separate.

## Connected outcome

Owner opens a saved program → selects planned future dates (whole period, selected weekdays/range or one date) → reviews exact Trainer/roster and who will see what → publishes all selected changes together → the currently assigned Trainer discovers those dates in their schedule/Today view → opens the minimal dated roster. Owner can withdraw a not-yet-started published date; the next authorized read removes Trainer access. Existing private planning remains private until this explicit transition.

## Recommended policy for design

| Question | Recommendation |
|---|---|
| Actor | Current active Academy Owner in the existing branch. No Manager delegation, Platform-only tenant authority or new role. |
| Eligible date | Saved ready program and complete dated plan, positive capacity, same-branch current accepted active Trainer, current fictional players, no capacity/duplicate/same-academy UTC conflicts. Publish only dates whose start instant is still in the future at commit. Empty roster is allowed if deliberately reviewed; an unassigned or ended Trainer blocks publication. |
| Whole program and individual dates | Support explicit whole-program/date-range/weekday selection and one-date action. Preserve already-published unchanged dates visibly. Preview the exact write set; any included invalid/stale date blocks all new publication changes. Bounded resumable preparation remains private; final visibility transition is atomic. No28-day business duration limit. |
| Trainer visibility | Current accepted active same-branch appointment AND explicit assignment to that published date required on every read. Show program name, date/local times/timezone, branch/sport, capacity and that date's fictional player display names only. Names are new access relative to the accepted own-profile-only Trainer slice, so require this policy decision. No player profiles, contacts, guardian links, financial/private staff fields or other Trainers' sessions. |
| Discovery | Discover from current authorized dated assignments, including a Trainer assigned only to one date. Today uses branch local date and actual start/end instants. Upcoming schedule has explicit empty/loading/failure states; no fake sessions or placeholder totals. No attendance, scan or evaluation action in this slice. |
| Published edits | Freeze the published dated plan. Both existing individual saves and whole-program activation must reject changes to a published target; no hidden divergence between a Trainer view and an edited draft. To change a future date: withdraw explicitly → edit/review private plan → publish again. Withdrawal preserves audit and existing plan/roster records. Rescheduling, cancellation/credits and edits after session start remain future decisions. |
| Withdrawal/revocation | Owner may withdraw selected not-yet-started dates after exact review, atomically for the selected set. Next request denies Trainer detail/list membership. Ending/suspending the Trainer appointment also removes access on the next request; preserve historical assignment and show Owner coverage unavailable. No automatic substitute or restored appointment. |
| Effects and environment | Fictional staging only; no family/player visibility, notifications, email, fees, attendance marks, consent, recurring live inheritance or paid service. Policy/design approval never authorizes sending an invitation, restoring an ended Trainer or granting an account access. Hosted Trainer demonstration needs a separately authorized active test appointment. |

Example:40 saved dates, one invalid Trainer assignment → review explains the blocking date; zero new dates become visible. Correct the plan and review again before publication. A lost publication reply reconciles the original operation; replacement cannot race an unresolved original. A Trainer whose access ended receives denied/empty authorized results, never cached roster details.

## Source and PYSA read-only reference

AcademyOS source inspected at9c02e26: existing `trainer-workspace.tsx`/`lib/trainers.ts` expose own staff name/role/branch only; q6/r7 dated planning is private to current Owner. Reuse accepted branch appointments, dated plans/rosters, current-authority signed gateway, lifecycle lock, idempotency/reconciliation, shared shell/panes/native controls. Do not fabricate an active Trainer to make the preview/hosted example appear integrated.

PYSA inspected read-only at37d8901c under `/Users/moamenghareeb/Pro Youth Football Academy/pysa-platform`: Trainer schedule page, dated session page and `lib/db/scheduling.ts:getSessionInstancesByTrainer` around1937. Useful pattern: connected schedule list/calendar → selected date → roster, with branch-local Today and dated assignment. Source currently derives candidate programs from base `session_trainers` and returns early when none exist; EV-0095 documents omission of dated-only assignment discovery. EV-0089 documents mocked linked-write replacement failures. AcademyOS should query authorized dated assignments directly and commit publication plus receipt/audit atomically. These are source/historical local audit observations, not a fresh hosted PYSA test. PYSA was not changed and supplies no credentials, schema or permission authority.

## Traceability and next gates

J09/J10/J11; scoped IMP-J10-A01/J11-A01 associations; S23/S24/S26/S27 and Trainer Today; L04/L07; SEC-J10/SEC-J11. AO-023/024/027/029 and AT equivalents are scoped associations, not full requirement closure. D-003 Trainer field/access expansion is accepted for this design preparation only; D-006 financial cancellation and D-012 attendance remain open.

1. Owner policy decision for design preparation.
2. Connected EN/AR desktop/phone design: Owner selection/review/publication/withdrawal and Trainer Today/list/detail, including prerequisites, empty/loading, stale/denied, conflict and recovery states.
3. Separate design review before implementation. Authoritative publication and all affected q6/r7 edit guards must be implemented/tested together.
4. Local/database/API/UI/security/performance verification; separately authorized synthetic active Trainer test; staging deployment and working-feature acceptance.

No dependent implementation, schema change, deployment, invitation or access grant in this packet.

## Policy decision —27 October2026

Moamen explicitly selected “Accept this publication and Trainer-visibility policy for design”. Accepted scope includes all selected future dates published together, current assigned active Trainer seeing minimal dated context and fictional player names, withdrawal before edits, and next-request access removal after withdrawal/appointment ending. No family visibility, attendance, fee or notification is included. No invitation, restored appointment, actual account access or dependent implementation is authorized by this design-preparation decision.
