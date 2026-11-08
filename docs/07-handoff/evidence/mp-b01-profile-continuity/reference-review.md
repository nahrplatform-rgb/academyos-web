# MP-B01 Players directory/profile reference review

Read-only source comparison for the coordinator; no browser, runtime, hosted or Owner acceptance evidence. AcademyOS frozen baseline commit `c73bdf89af2a1884afd284a9f4f544039947436a`. Inspected Git blob IDs: `apps/web/src/components/people-workspace.tsx` `39763406b683051171af29addba74fdbc3e2fd97`; `apps/web/src/app/globals.css` `325b2d74068fa3765c89c6d7d9af8f3402d03320`; `apps/web/src/components/workspace-layout.tsx` `0a01f5c9312935bc85fd2292f1274bd2d5f1501a`; studio `app.js` `72fbe1423b34ba4433ef63b4573d54ea09c8be94`, `studio.css` `6602b2ffd4b3f9403e4ba5b7907b620c5721d070`. These are Git blob IDs, not SHA-256 values.

The accepted Operations contract is `docs/03-design/operations-design-reference.md` sections “Layout, controls and visual fidelity” and “Connected workflow and data boundaries”; `docs/03-design/design-tools-and-quality-guidance.md` supports proportionate review. Light is default, Charcoal alternative. Studio `app.js:234,240,318` is fictional reference, not authority for fields or actions.

## Baseline difference ledger

| Area | Source observation and comparison | Status |
|---|---|---|
| Directory and detail | Studio selects a row and updates a nearby inspector (`app.js:234,240,318`). AcademyOS renders a two-column directory and selected profile in `people-workspace.tsx:446-451,480-491`; a full online selection clears prior selected detail and sets `busy` before the read (`:231-253`). During this read the online table rows are suppressed (`:490`) and the pane is blocked (`:466`). | Source-level continuity gap to investigate; no measured blank interval. |
| Density and geometry | Studio Operations player rows use 8px block padding (`studio.css:144-146`); baseline table cells use 12px block padding and responsive card treatment (`globals.css:188-192,211-212`; later typography overrides `:434-436`). Layout preference default inspector is 276px (`workspace-layout.tsx:5-9`). | Different structures; compare matched viewport, type, spacing and readable touch targets before changing. |
| Menu geometry | Studio directory uses search/filter and row selection (`app.js:234`); the baseline directory has search, pagination and profile actions, without an equivalent per-row action menu (`people-workspace.tsx:480-491`). | No menu parity claim; do not add speculative actions. Check any existing shell/detail overlays for clipping and RTL in a matched review. |
| Focus and return | Studio selects detail heading and uses a dialog on narrower screens (`app.js:44,82,318`). AcademyOS records row opener and restores it, falling back to search (`people-workspace.tsx:82,403-406,490`); stage changes also focus the page heading. | Potential focus ordering and scroll effects require actual EN/AR interaction verification; source alone does not prove a defect. |
| Recovery and authority | Failed profile reads clear selected detail (`people-workspace.tsx:248-250`); authentication/denial fencing is explicit (`:103-123`); uncertain saves require original reconciliation (`:441-442`). | Preserve these boundaries and dirty-work protections while improving checked-state continuity. |

## PYSA reference and bounded recommendations

PYSA's surface description lists manager directory/detail/new routes and member operations (`platform-description/PYSA-current-surface-reference.md:70-74,216-218`). Its member list groups quick filters with directory results (`pysa-platform/components/manager/members/member-list.tsx:93-116,263-268`): useful as a task grouping pattern, not a field or policy specification. Its action menu aligns to the end and can open upward (`components/manager/members/player-action-menu.tsx:122-137`; `components/shared/dropdown-menu.tsx:28-39,63-76`), but its geometry and interaction are not an AcademyOS standard. PYSA audit FND-0084 reports search/export limited to the first 40 records, and FND-0088 reports incomplete keyboard semantics (surface reference `:592,596`); FND-0014 documents broad profile-read privacy risk with local reproduction and qualified hosted evidence (`engineering-audit/02-findings/high/FND-0014.md`). Do not reproduce these limitations or infer hosted behavior.

1. During a permitted same-scope profile read, retain the checked directory, search, selection and scroll; show compact progress at the detail location. Mask on actual authority failure and preserve unknown originals.
2. Keep the profile's identity and branch together, with only currently authorized fields and actions; avoid introducing studio sample counts or PYSA fields.
3. Compare actual row padding, type and pane widths to Operations at matching viewport/theme/locale; preserve readable phone controls and avoid unnecessary nested scrolling.
4. Verify row opener focus and scroll on close, including heading-focus ordering, RTL and smaller-screen detail dismissal. If a menu is already present, verify viewport collision and logical alignment rather than adding one.

These are review recommendations, not implementation, a matched visual capture, a security finding in AcademyOS, or acceptance. Coordinator owns checks and canonical updates.
