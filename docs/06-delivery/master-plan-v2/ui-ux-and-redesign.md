# UI/UX and full experience redesign specification

The [Operations reference/adoption contract](../../03-design/operations-design-reference.md) is the visual authority: variant2, **light default and Charcoal alternative**, compact resizable navigation/details, useful density, coherent primary/supporting/destructive controls and meaningful colour distribution. Preserve the complete previously accepted workflows and later focused changes. PYSA supplies functional detail; it does not replace this visual system. New tools assist its implementation.

## Design artifacts and evidence

Maintain three different artifacts: the selected reference/approved proposed journeys; the factual [actual-component HTML](../../../design/app-experience-review/README.md); and the signed-in working app. The factual replay cannot execute real writes or prove hosted authority. A proposed rich profile, lane allocation or future finance screen must be labelled proposed until its workflow/contract is accepted and implemented. Existing approvals are reused; genuinely new consequential behavior gets a focused changed-state review, not a restart of the complete aesthetic.

For every capability, specify route/actor/scope, entry, exact controls and destinations, field grouping, visible labels/help/errors, enabled/disabled conditions, state transition, confirmation audience/consequence, data/freshness scope and return. A page listing without action/state detail is incomplete. Use realistic fictional names, long Arabic text,18-player registers,40-date programs, simultaneous sports and materially paginated directories.

Apply the [product value/simplicity test](product-outcomes-and-simplicity.md) to each composition: an Owner should understand current work and next actions, inspect useful detail, delegate and recover without administrative clutter. Platform business administration has its own full journey. Show reliable summaries and genuine exceptions; justify added mandatory fields, reviews, confirmations and steps. Finance follows [its simplification specification](finance-simplification-and-control.md), not the legacy page arrangement. This does not remove an accepted review/control or authorize a new permission.

## Shell, navigation and context

| Context | Navigation and main task | Details and sizing |
|---|---|---|
| Wide desktop | Labelled role-specific navigation; visible academy/branch/sport context; central useful task | Reference compact defaults; bounded resize and hide/show; details optional; reserve sufficient central width |
| Laptop/tablet | Central task retains usable width; labelled navigation drawer when needed | Details on demand; no squeezed mandatory three-column layout |
| Phone | One focused task; Owner drawer; labelled Trainer/Guardian bottom navigation where appropriate | Accessible sheet/full-screen detail; keyboard-safe controls and useful Back; no forced desktop inspector |
| Zoom/long text | Reflow based on available usable space, not device brand |200% zoom and long EN/AR labels must not hide primary actions or focus |

Record exact geometry/type/spacing from the versioned Operations sample and actual implementation in each difference ledger. Do not revive the old fixed224/336 or dark-default assumptions without checking the later compact/resizable selection. Resize is a preference, not permission to shrink content below usable bounds; provide accessible non-drag equivalents and reset defaults. Store only presentation preferences, never private profile/roster payloads in navigation state.

Use clear scroll ownership: ordinary content has a predictable primary scroll; navigation/details scroll only when their own overflow requires it. Avoid nested scrolling inside a form or per-row card. Keep useful list position and inspector selection on return. On phone, avoid body-plus-sheet scroll competition and controls hidden behind the virtual keyboard. The existing narrow English inspector-heading wrap remains a recorded gap, not evidence of acceptable final geometry.

## Role navigation model

| Role | Intended navigation groups | Boundary |
|---|---|---|
| Platform Owner | Admission/academies; plans/platform billing; permitted support; services/usage/recovery | Tenant operating records are not automatically visible; diagnostics are redacted |
| Academy Owner | Today; People; Training; Attendance; Development; Finance; Communications/media/reports; Academy settings | Only implemented, enabled and permitted destinations behave as available |
| Manager | Selected operational groups and branch scope | Future capability contract; not a cosmetic Owner switch |
| Trainer | Today; assigned sessions/attendance; own feedback/requests; permitted compensation | Current assignment/appointment; no unrelated players/family money |
| Guardian | Selected child; next session/calendar; attendance; published development; permitted family finance/inbox | Active approved link and field-specific visibility; no private review reasons |
| Player | Own permitted schedule/attendance/progress and agreed self-service | Account/minor policy is not inferred from a profile record |

Show the active context and a clear switcher. Do not mix Platform and Academy operations in one confusing sidebar. Role/test-account separation must be demonstrated with isolated sessions while retaining legitimate multi-membership support. Breadcrumbs and Back restore the actual origin rather than an arbitrary default directory.

## Visual system and components

- **Typography:** document family/fallbacks, Arabic shaping, numeric/date treatment, hierarchy, weights, line heights and maximum readable text widths from the selected reference. Routine phone inputs/body retain readable sizing. No all-caps micro-heading that wraps one letter at a time.
- **Spacing:** one coordinated rhythm for page margins, section/card gaps, labels, control rows, table cells and dialogs. Avoid a large empty card around a tiny form or action controls scattered between unrelated panes.
- **Colour:** layered light/Charcoal surfaces, consistent primary actions and semantic success/warning/error/unknown states. Module accents can support training, people, attendance, development, family and operations; colour alone cannot communicate status, selected/saved state or authority. Compare equivalent themes for contrast and hierarchy.
- **Controls:** use existing shared primitives where sound. Provide clear names, focus, pressed/selected/disabled/busy states, minimum44 px targets and comfortable frequent phone actions. Icon-only controls need accessible and discoverable labels.
- **Tables/directories:** meaningful headers, safe responsive layouts, full-scope versus loaded-page filters, stable sorting/selection, useful row actions, page/continuation and counts. Use cards only when task content benefits; do not turn every cell into a decorative tile.
- **Charts:** name metric, unit, period, scope, as-of and completeness; show no-data/unavailable/gaps distinctly and offer textual/table access. A fictional sample chart is not authority to invent a product metric.
- **Components:** separate common controls from domain behavior. Avoid a universal configurable form hiding money/attendance/permissions. New libraries need a demonstrable gap, EN/AR/touch/focus fit and measured maintenance/bundle implications. [Tool register](design-tool-register.csv).

## Forms and rich profiles

Registration asks for a small justified required set, with clear optional and sport-specific sections. A rich profile has useful overview/participation/relationship/history areas with permitted finance/development integration; ordinary inspection does not force edit mode. Shared identity fields are not duplicated per enrollment. Sport/resource terminology changes the actual controls and hierarchy, not only a heading.

Field help explains purpose, format/unit and visibility where relevant. Validate as early as useful without chatty autosave or losing input; server validation remains authoritative. Explain exact field errors, retain unsaved values and focus the first actionable problem. Show all-or-nothing versus explicitly reviewed per-item results accurately. Do not silently accept a field that the action discards.

Use native semantic dialogs or an established accessible primitive: labelled title/description, keyboard containment, Escape behavior, initial focus, restoration and dirty protection. Short menus use focused popovers; short edits use dialogs; program creation, bulk review and complex writing stay in the central workspace. Routine navigation/selection needs no confirmation; consequential changes show exact before/after, audience, retained history and relevant consequence.

## Required state and continuity contract

| State | Required behavior |
|---|---|
| First load | Stable shell, useful task-first progress; distinguish provider identity/setup/data dependencies |
| Returning/revalidating | Keep compatible permitted content, query/filter/selection/position/draft; quiet affected-area checking; current actions gated as appropriate |
| Secondary history/detail | Main task stays mounted; specific panel loading/retry; denied response still fences private data |
| Saving | Local immediate feedback and preserved input; prevent duplicate consequential action; no false server Saved |
| Saved locally/pending | Durable local acknowledgement only after record+original committed; shared top-bar pending state and per-record detail |
| Confirmed save/read failure | Retain confirmation; retry reading or reconcile original, never invite duplicate saving |
| Unknown outcome | Preserve original ID/payload; block replacement until authoritative reconciliation |
| Empty/filtered-empty/partial | Explain successful empty versus filter versus incomplete coverage; failed panels are Unavailable, not zero |
| Offline/reconnect | Same normal screens and Save semantics for supported coverage; top-bar connection/sync/pending indicator; no repeated Prepare/Recover ritual |
| Stale/conflict | Apply safe nonconflicting results automatically; preserve genuine conflicting work and explain the specific affected decision |
| Missing authentication | Restore ordinary provider sign-in;401 is not proof of ended role; protect originals/local slots |
| Known denial/account change | Fence affected private state and authority; preserve separately protected recoverable originals; no cross-account/academy exposure |
| Storage/quota/update failure | Truthful save/download limitation with safe recovery; never delete unrelated records or unknown pending work |

The global indicator distinguishes connection, transfer and mutations: e.g. Offline; Offline ·2saves pending; Online ·Syncing; Needs review. Network availability alone does not prove the server is reachable or all work synced. A first-device preparation bar uses checked finite progress; repeat launch reuses compatible prepared data and applies changes quietly. Support the current/previous/next-month target through bounded declared collections, not an unbounded whole-academy payload.

## Bilingual terminology and multisport presentation

Use a reviewed terminology catalogue with stable internal keys, EN/AR labels, contextual singular/plural, units, date/time formatter and branch timezone. The same internal concept may use an appropriate sport label only when meaning actually matches. Pools/lanes and pitch allocations have different structural meaning; see [resource specification](multisport-and-resources.md). Do not use translated text as identity or permission. Long Arabic names, mixed IDs/emails, localized numbers and RTL order need actual rendered checks.

## Review and completion

At a meaningful batch checkpoint compare equivalent reference and actual role/data/state/locale/theme/viewport: geometry, type, spacing, colour distribution, controls, dialogs, density, focus, scroll/return, continuity and recovery. Record each difference as fixed, accepted adaptation or explicitly open with a destination. Check keyboard/touch/zoom and important failure/dirty/unknown states during affected work. Full capture regeneration/HTML and broad regression are consolidated for a coherent source candidate; focused checks remain during development.

Do not call full redesign complete from four studio destinations, shared CSS, plugin ratings or passing token checks. Complete working review requires the declared connected journeys and real authority/persisted outcomes, with Owner acceptance separately recorded. Staging external-review deferral is retained; actual integrity/accessibility/security defects are still engineering work.
