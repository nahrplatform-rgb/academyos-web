# AcademyOS current-experience review

Owner authorized29 October2026 after reporting whole-app visual, workflow, alignment and spacing problems. This is a **faithful current baseline for review**, not a redesigned product or new business-policy acceptance.

Open [the single standalone HTML](AcademyOS-experience-review.html). It embeds actual product DOM/CSS snapshots, clickable observed transitions, wording/control inventory, full UI sources with line numbers, screen/action/loading/security/requirement registers, coverage gaps and reviewer-note download. No network is required to open it in a current browser. Repository source links require the reviewer's existing repository access; the embedded sources work offline. Keep the file private to authorized project reviewers: fictional captures contain no live users or tokens, but source is proprietary.

## What is and is not reproduced

-15 review groups: actual welcome route plus14 implemented workflow groups from M1 through I5a. Platform Owner, Academy Owner, Trainer and Guardian views use their actual components and shared styling, with the existing test suites' synthetic identity/HTTP adapters. Manager/Player operational portals are not invented.
- Recorded controls replay captured outcomes; they do not execute app writes. The directory exposes all captured states directly. Input values reflect the observed check, rather than allowing arbitrary new simulated business outcomes. Use Next recorded state for input/review sequences or when a test changed its synthetic actor/context. Cross-journey navigation is the review tool, not a claim that the current product connects every route well.
- All68 catalog screen IDs and180 requirements remain visible with their existing scope/status; these are not implemented totals. Route/source inventory includes uncaptured conditional/provider boundaries. Every source literal is searchable, but literal extraction is not proof it was rendered.
- EN/AR and captured widths are selectable; selected snapshots preserve their original viewport. Responsive iframe resizing is not new device verification. Existing harness fonts differ from hosted font delivery. Native browser dialogs are recorded as dialog text; Clerk sign-in/account/OTP and physical camera/print are explicit live-review gaps.
- Baseline flaws stay visible, including diagnostic copy, density, awkward handoffs or spacing. Review notes are separate proposals, kept only in memory until JSON download. No findings are automatically policy-approved or applied.

## Maintenance contract

1. After changing UI, route, CSS, state flow or wording, run `node scripts/experience-review/collect.mjs` and `node scripts/experience-review/static.mjs`. This reuses existing real-component checks; it does not weaken or edit their assertions. Temporary instrumented copies are removed afterward. Test screenshots/receipts are redirected to `/private/tmp/academyos-review-evidence` so historical evidence is preserved.
2. Run `node scripts/experience-review/build.mjs`, then `node scripts/experience-review/test.mjs` and `node scripts/experience-review/build.mjs --check`. Inspect representative rendered EN/AR phone/desktop views and disclose uncaptured states. For shared theme changes also run `node scripts/experience-review/test-theme.mjs` to audit representative captured layouts and semantic text contrast.
3. For inventory-only changes with unchanged UI/test inputs, use `node scripts/experience-review/build.mjs --inventory-only`. It rebuilds from the versioned compressed capture pack; it rejects stale UI/test hashes. Partial recapture accepts named existing workflow groups; shared UI changes require all affected groups, and the current conservative guard checks all UI inputs for every group.
4. Commit HTML, compressed capture pack, manifest, affected metadata and evidence. Raw DOM JSONL streams/logs are regenerable and ignored. CI checks current fingerprints and generated HTML integrity. A green freshness check proves synchronization, not full visual/semantic coverage or hosted behaviour.

The source commit and input hashes are in [manifest.json](manifest.json). The source SHA is the inspected source base, not the future commit containing this generated artifact. [Review-tool verification](evidence/verification.json) is distinct from app functional/security/deployment/owner acceptance.

## Reference practice and review boundary

Read [the PYSA preservation ledger](../../docs/03-design/pysa-behavior-preservation.md) and [scheduling review](../../docs/03-design/pysa-scheduling-reference-review.md). Current task additionally inspected PYSA's current-surface reference, Owner layout, Player schedule component and checkpoint35 audit. Useful patterns: role context, connected list/calendar/detail, explicit task handoff. Known defects: translation fallbacks, subset-only search and false-success cases. These are historical source/audit observations, not fresh hosted verification. PYSA stays unchanged; AcademyOS's accepted rules govern.

Authorized outcome: reviewer-facing experience inventory across existing J01–J16 slices and retained catalog J01–J28, with current screen/action/AO/AT joins. Trust boundary: app source and fictional local captures → private review artifact. No production, provider configuration, account grant, app permission or database change. Scripts are review tooling only; no product route loads this harness.

Whole-app theme29October2026: shared Charcoal spectrum/dark default replaces the historical blue palette across actual implemented routes. The in-visit light alternative changes presentation only. Current captures/replay reflect actual React styling; standalone palette/design simulations remain separate. Follow the [theme implementation receipt](../../docs/07-handoff/whole-app-charcoal-theme.md) for local/staging/acceptance limits.
