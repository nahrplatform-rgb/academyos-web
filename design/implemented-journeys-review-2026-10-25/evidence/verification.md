# Design review verification receipt

25 October 2026. **Artifact verification only. Owner design review pending.**

## Repository preservation

Initial HEAD: `309ef695274263b4835e5366e6b7a23c4a7d9ee8`. [Initial working tree and 545 file hashes](working-tree-before.json) captured before creating the packet. [Static checks](static-checks.json) compare all 545 existing files and HEAD again. No existing functional source, design documents, matrices or other uncommitted work were changed. New files are confined to this review folder. No commit, push or deployment was performed.

[Component provenance](component-provenance.json) records the actual shared shell, controls, admission directory, timezone selector and source CSS hashes. The prototype bundle reads these existing components; only Next Link is adapted to a local anchor. Stylesheet overrides, fixtures and review controls are separate artifacts. The source CSS is copied into the prototype without changing the source. `connect-src 'none'` and `form-action 'none'` block application API calls and form transmissions; there are no external assets, provider accounts or persisted prototype drafts.

## Checks performed

- Existing dependency esbuild bundle succeeds. No dependency installation or functional-app build was required.
- Artifact Markdown targets, three CSV structures, findings/acceptance joins, route/overlay coverage, source references, no network/storage APIs in fixture source and working-tree preservation checked by [validator](../checks/validate.py).
- **36 route views** cover M1/I1, I2a, I2b and I2c. The separate branch/timezone and bilingual sport saves remain separate from setup completion. Revoke and end access have separate wording.
- [508 route/state checks](exceptional-state-checks.json): applicable normal, loading, read failure, denied, empty, wrong account, unverified, expired, revoked, pending, delivery failure, unknown delivery, unknown original operation, confirmed cancellation, changed review, returning draft, confirmed-write/read-failed, existing appointment and already-accepted fixtures. English at 1440px and Arabic RTL at 320px. No horizontal document overflow detected; each view has a task heading. Loading/denied/failed/wrong/unverified/expired/revoked states contain no fixture player/staff/branch/academy values in main content. Unknown-operation states have the explicit original-operation action and no ordinary Refresh view. New duplicate/already-accepted cases were checked after being added; the log retains the full applicable set.
- [144 complementary normal-view layout/focus checks](browser-checks.json): every route in English at 360px and 1024px, Arabic RTL at 390px and 1440px. No document-width overflow detected; deliberate view changes focus the task heading. This is DOM/layout evidence, not a manual visual audit of every pixel.
- [16 connected interaction assertions](interaction-checks.json): registration candidate pagination gate; native checkbox Space; input retention; registration/profile/Guardian connection; appointment confirmation gate; Trainer acceptance/profile/end/next denied read; explicit original-operation recovery fixture; locale draft retention; admission/Owner acceptance/chooser/setup connection; separate branch/timezone and sport saves; actual reused I1 detail heading and Back-to-opener focus. All recorded assertions passed. These fixtures do not persist or grant anything.
- Visually inspected the final [Owner desktop](prototype-owner-ready-en-1440.png), [Arabic phone confirmation](prototype-trainer-review-ar-360.png) and [original-operation screen](prototype-original-operation-en-1440.png). The dark prototype review bar is outside the product shell. No imitation macOS window controls appear.

## Limits

This is not a functional app, authoritative server, SQL/RLS, HTTP security, race, recovery durability, real email, staging, production, permission or deployment verification. Existing per-slice evidence remains separately scoped and was not rerun to increase counts. Prototype operation results are explicit fixtures; appointment lists are independent review fixtures, not persisted projections of preceding demo actions. Reconcile/automatic-return behavior illustrates the proposed engineering contract; it does not prove that implementation has changed.

The layout checks do not certify physical phones, actual 200% browser zoom, screen readers, all native select behavior, every keyboard sequence, high-contrast modes or final Arabic editorial acceptance. These remain explicit acceptance work. Native checkbox Space and deliberate heading/Back focus were exercised, but a complete assistive-technology review was not performed.

## Reproduce

From repository root: run `node design/implemented-journeys-review-2026-10-25/prototype/build.cjs`, then `python3 design/implemented-journeys-review-2026-10-25/checks/validate.py`. Serve this directory on loopback as described in [README](../README.md). Browser logs above were captured through the Codex browser controls, not an app integration test suite. All browser actions stayed within the new prototype origin/path.
