# I5a — reviewed development feedback

28 October 2026. **Moamen explicitly accepted this bounded policy for design: “Accept this policy for design.” Connected design was separately approved for implementation on28October2026; no access grant is inferred.** I4d working QR wording/usability was accepted; wider security, device, accessibility and load/cost gates remain open in the [current receipt](../07-handoff/i4d-qr-attendance-implementation.md).

## Connected outcome and traceability

Continue I5 in the [implementation plan](app-implementation-plan.md): assigned Trainer drafts feedback for one fictional rostered player → submits → Academy Owner returns or publishes → linked Guardian reads only published feedback → amendment or withdrawal preserves history. Keep the accepted compact-blue workspace and role-specific EN/AR phone/desktop journeys.

J16-A01–A06 / IMP-J16-A01; S31/S32/S47; L10; SEC-J16; AO-085–092 / AT-085–092. This subset contributes to these requirements without closing their full scored-metric, Player, export or notification scope. D-013 and the development-view portion of D-004 require a decision before dependent design and implementation. [Canonical workflow](../02-workflows/evaluations.md).

## Recommended policy for design

| Choice | Recommendation |
|---|---|
| Content | Start with required written strengths, improvement focus and next steps; optional private staff note. No numerical score/ranking yet. Preserve sport-specific scored assessments as subsequent I5 scope: metric names, EN/AR labels, units, scales and schema versions still need agreement. Narrative schema v1 records original field meaning and language; it does not replace scored parity. |
| Author scope | Current active assigned Trainer, for a player on the exact published session roster, after that session ends. Recheck academy, branch, roster and assignment on every save/submit. No attendance-mark prerequisite or copied attendance deadline; no additional assessment deadline is proposed. |
| Review | Current Academy Owner from a different account returns with a reason or publishes the exact submitted public fields. No self-review, Manager grant, direct Trainer publication or silent reviewer rewrite. Owner-authored assessments remain a later explicit choice. |
| Lifecycle | One current assessment chain per academy/player/session. Draft → submitted → returned for revision or published. Submitted version is frozen. Return permits a new editable revision. Another Trainer cannot overwrite the author's draft; assignment alone does not transfer authorship. |
| Private fields | Staff note, return reason and withdrawal reason stay internal. Family projection includes only published strengths/focus/next steps, session/sport/branch, publication date and revision identity. No other players, drafts or private reasons. |
| Guardian audience | Verified account with a currently active approved player link may see that player's retained published feedback, including publications before link acceptance. Require a distinct development-view rollout opt-in; minimal and training-only links gain no new fields automatically. No Player login or sibling inference. Ending the link or withdrawing content removes access on the next authorized request. |
| Published correction | Immutable snapshot. Author proposes a successor through the same Owner review; old publication stays visible until its replacement commits atomically. Owner can withdraw with an internal reason; history remains, withdrawn content is absent from future family reads. Previously seen copies cannot be recalled. |
| Side effects | Fictional staging only. No email/push, export/download, attachments, automated grading, medical information or real children. AO-092 stays pending. Test access restoration requires separate authorization. |

The policy above is accepted for design as a bounded set by the explicit response recorded at the top. Engineering retrieval limits and budgets below remain design proposals. Broader metric/Player/notification/export policy is unresolved. A separate [connected prototype review](i5a-development-feedback-design-contract.md) precedes database work.

## PYSA reference inspected, read only

Root `/Users/moamenghareeb/Pro Youth Football Academy`. Source and audit evidence only; no fresh hosted evaluation walkthrough or legacy changes.

- `platform-description/PYSA-platform-brief-for-another-AI.md` and `PYSA-current-surface-reference.md`: sport-dependent authoring/review/personal progress. Preserve connections from session/player to review and family progress; do not copy role equivalence or fallback sport policy.
- `pysa-platform/actions/performance.ts`: current form checks actor, academy/player/sport and blocks view-as writes; legacy create entry differs. Every AcademyOS entry must enforce the same current authority.
- `pysa-platform/lib/validations/performance.ts`: rating-10, rating-5, percentage, seconds and boolean metric definitions, separate overall/internal notes. Scored scope exists in PYSA, but this does not settle AcademyOS metric definitions or permit cross-sport averages.
- `pysa-platform/lib/db/performance.ts` and `supabase/migrations/20260716160000_seed_default_performance_metrics.sql`: RPC review and academy/sport metric seeding patterns. Do not silently import default metrics, schema or permissions.
- `engineering-audit/03-evidence/database/EV-0029-evaluation-workflow-source-review.md` and `EV-0037-evaluation-sql-permissions.md`: atomic scores/evaluation writes, uniqueness and review history are useful. Disposable SQL recorded stale-role/inactive/session-version authority and a direct-review approval-gate gap. These are findings at the audited revision, not present hosted exploitability claims.
- `engineering-audit/03-evidence/backend/EV-0035-evaluation-action-contracts.md`: mocked action evidence for differing view-as guards and an accepted internal-notes input not forwarded by publish. Keep field contracts exact.
- `engineering-audit/03-evidence/backend/EV-0145-attendance-evaluation-unit-batch.md`: later 37-test unit batch is source evidence, not hosted authorization closure or proof earlier SQL findings were repaired.

## Existing implementation and boundaries

Inspected existing Guardian training workspace/parser and attendance workspace. Reuse WorkspaceShell/WorkspacePanes, shared controls, exact occurrence identity, strict request parsing, current signed identity, expected versions and original-operation recovery. Existing attendance/training screens do not implement development evaluations.

Browser → same-origin authenticated API → current tenant/actor authority → private drafts/review/snapshots/history → separate minimal family projection. Login, a Trainer label, cached link, service credential or caller-provided role is insufficient authority. Existing training opt-in must not confer development access. Inspect existing entitlement enforcement before implementation; no new billing policy or bypass is authorized.

## Bounded retrieval, freshness and proposed budgets

Trainer directory: own ended published sessions in a selected 14-day window, 20 results plus sentinel with a stable cursor. Exact roster: 50 names per page with explicit coverage, no contacts. Owner review: status-filtered 20 summaries plus sentinel; one exact submitted version on demand. Guardian: exact active link, 20 publications plus sentinel and one detail on demand. Internal history: 20 entries plus sentinel. No unbounded preloads.

Candidate field limits for design: each public field/private note 2,000 characters, reason 1,000; detail below32KiB. These are proposed engineering bounds, not silently accepted business rules. Family contract excludes private keys entirely.

Private no-store reads. Recheck scope on reads, writes, review and receipt lookup. Clear old account/player content on change or denial; cancel stale requests. Revalidate after acknowledged writes and when returning to a visible page. Do not promise remote erasure before another request occurs.

Candidate budgets: p95 warm SQL read <300ms; authenticated API read <1s; save/review confirmation <1.5s; visible pending within100ms; phone LCP ≤2.5s and CLS ≤0.1 under a declared device/network profile. Exercise at least1,000 fictional assessments across two academies, multibyte text and paging boundaries; measure bytes, plans, writes/retries and WAL/storage delta. **None is measured or passed by this packet.** Reuse limiter conventions without raising global limits and assess direct-boundary abuse separately.

## Atomic operations and recovery

Draft save compares expected revision; submission freezes it. Review checks exact submitted version, different-account Owner, current author assignment and target scope. Ended assignment blocks stale publication. Return retains the submission. Publish stores the exact snapshot/head/audit/receipt atomically; successor publication replaces the current head in that transaction. Withdrawal preserves history and denies new family detail. These proposals remain subject to accepted policy.

Tenant/actor-bound idempotency key and payload fingerprint per consequential command. Retry returns original authorized result; changed payload conflicts. Response loss requires original-operation reconciliation before replacement. Authority loss denies private receipt content. No local saved badge implying persistence, implicit merge or duplicated publication. On draft conflict, reload/compare/reapply while retaining the user's unsaved text in memory where safe.

## Acceptance cases and next gates

- Full draft → submit → return → revise → publish → own-player family view → successor/withdrawal, with EN/AR, RTL, keyboard and phone list/detail/back context.
- Two-academy read/write/receipt isolation; wrong role; unassigned/ended Trainer; revoked Guardian link; disabled development opt-in; alternate/direct API/database paths; stale claims versus current membership.
- Family payload excludes private notes, returned drafts, reasons, other players and withdrawn content, including errors and recovery receipts. Pre-link history follows explicit policy only.
- Concurrent edits/submission, competing return/publish, successor/withdrawal race, roster/authority change before commit, duplicate key/changed payload, failure before/after commit and rollback of partial snapshot/audit writes.
- Empty lists, auth loading timeout, list/detail failure, pending save, unknown result, stale version and access removal require reviewable recovery states. Missing scored data never becomes zero or a chart.

Policy acceptance → connected prototype review → implementation/local checks → separately authorized staging test → working usability acceptance. Independent human/security, physical-device/accessibility and load/cost gates remain separate. No evaluation functionality, database, deployment or access changed in this preparation.
