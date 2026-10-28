# I5a — connected development feedback design

28 October 2026. [Bounded policy](i5a-development-feedback-decisions.md) explicitly accepted for design. **Connected design pending Owner review.** This is a fictional local React simulation, not an app implementation, database, role grant or hosted proof.

## Journey and preserved scope

J16-A01–A06 / IMP-J16-A01; S31/S32/S47; L10; SEC-J16; AO-085–092 remain the parent scope. This preview covers narrative authoring, return/review, publication, successor, withdrawal and own-player family projection. [Broader original design handoff](../../design/experience-prototype-v1/docs/batch-5-final-handoff.md) remains reference; scored schemas, Player access, trends, notifications and export are not retired or implemented here. PYSA actions/metric validation/review DAL/audit evidence and limitations are recorded in the decision packet.

## Screens and transitions

- Trainer enters Development → ended session's fictional roster → selects player → writes strengths/focus/next steps and optional separately marked private note. Save draft keeps it private; Review submission checks required public fields and shows the exact text. Confirm freezes a submitted revision. Submitted drafts cannot be edited without return.
- Different-account Academy Owner opens the review list → exact submitted fields and distinctly shaded private note → reviews publication or requests changes with an internal reason → confirms. Publication exposes only the three public fields plus session/branch/sport/publication/revision metadata. Return retains its submitted snapshot and enables a new revision. No reviewer text rewrite.
- Guardian sees only Alex Demo's current publication. Before publication or after withdrawal, show an empty state, never the draft or another player's record. No staff note, private reason or internal revision controls appear.
- Trainer starts an amendment from a published or withdrawn assessment. The existing publication stays visible through draft/submission/return. Owner publication replaces it with the successor. Internal history retains submissions and previous publication snapshots; no history mutation is represented as deletion.
- Owner reviews a withdrawal reason and consequence → confirms → current family publication disappears, while internal history remains. Ending relationship/foreign-account scenarios clear all private content. Real projection access requires current link and separate development opt-in; simulation actor selection is not such a grant.

## Interaction, layout and language

Reuse actual WorkspaceShell, WorkspacePanes, shared Button/Select and global visual tokens through the existing esbuild toolchain. No new library, fake Mac window controls, alternate design system or speculative shared app abstraction. Sidebar → work list → contextual detail on desktop; phone opens detail with Back and preserves list context. Keyboard focus uses shared pane heading behavior. EN/AR switch preserves unsaved text; user-entered content is not automatically translated. Explicit dirty navigation/reset guards protect drafts and internal decision reasons; pending operations block context changes and editing.

The fixed fictional clock is28October2026 18:00 Africa/Cairo and session16:00–17:00. Session-not-ended and author-assignment-ended are explicit review scenarios, not real time/authorization checks. Field limits and performance budgets remain the proposed engineering bounds in the policy packet.

## Loading, failures and recovery

Loading, unavailable read and empty result are distinct. Wrong tenant/revoked access hides records. Self-review blocks publication/return; ended author assignment blocks publication. Missing fields block submission. Rejected atomic save retains input without a receipt. Concurrent edit presents the newer version and retains typed text for review/reapply.

Consequential actions show pending until the reviewer finishes the simulated response. Committed/lost reply requires Check original operation and produces one original receipt. Uncommitted/lost reply retains input with no saved claim. Confirmed-save/read-failure hides unconfirmed detail and offers read retry. These are deterministic presentation simulations, not proof of actual atomicity, idempotency, authority, races or durable recovery.

## Verification and next gate

[Preview README](../../design/i5a-development-feedback/README.md), [local checks](../../design/i5a-development-feedback/evidence/checks.json) and screenshots record the exact build inputs in source-manifest.json. Cases exercise full return/revision/publication, minimal family DOM, successor/withdrawal/history, required text, ended/self/revoked denials, loading/empty/failure, response loss and stale text. EN/AR layout is checked at320/360/926/1440px with screenshots for desktop/phone. No real browser session, account, API or provider is used by these tests.

Owner reviews this connected design before dependent implementation. Security/privacy, physical-device/accessibility, hosted races, performance/load/cost and working-feature acceptance remain separate. New access restoration is not authorized by this design.
