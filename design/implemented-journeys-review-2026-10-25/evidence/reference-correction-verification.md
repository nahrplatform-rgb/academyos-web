# Reference foundation correction — verification receipt

25 October 2026. **Design artifacts and append-only design documentation only. Corrected rendered design awaiting Owner review.**

This receipt supersedes the first prototype's layout verification as the active design target. Earlier evidence and `prototype-v1-superseded/` remain historical. Existing functional approvals, authoritative operations and per-slice security/release evidence are unchanged.

## What changed

The active prototype now uses one shared [reference frame](../prototype/reference-frame.tsx), [reference geometry stylesheet](../prototype/reference-frame.css) and semantic table across the 36 implemented-journey design views. The frame follows the unchanged original: navigation sidebar, central workspace and contextual inspector. Selection retains the directory, highlights the selected record and focuses its details. Actions remain attached to that task. Forms, candidate review, restricted roles and recovery keep their own content. The native controls and timezone selector are reused; production `WorkspaceShell` and `AdmissionDirectory` are inspected foundations for later integration, not modified by this work.

The reference's unimplemented example tabs, counts, business data and imitation macOS controls were not copied. In particular, restricted Guardian/Trainer views use generic workspace context and permitted fields rather than adding an academy-name projection to fill a panel. Unknown operations show no proposed saved result behind the recovery panel and cannot be dismissed through Close/Escape to start a replacement.

## Source/document preservation

[Before snapshot](reference-correction-before.json) records all pre-existing files outside this packet. The only deliberate changes outside the packet are **append-only Owner correction sections** in the implementation plan and compact-blue design foundation. Their original byte lengths and hashes are recorded in [prefix evidence](reference-correction-doc-prefixes.json), and the validator proves those full prefixes remain intact. No pre-existing text or concurrent work was overwritten. Other existing files and HEAD are unchanged. No functional app, permission, database, provider, deployment, commit or push changes were made.

## Browser evidence

- [216 final layout checks](reference-correction-layout-checks.json): all 36 routes in EN/AR at measured CSS desktop widths1440 and1024, English phone360 and Arabic phone320. The navigation/work area/inspector are visible in desktop layout; Arabic reverses their horizontal order. Selected phone detail hides the work area and navigation rather than compressing the columns. No document-width overflow; exactly one task h1 in each normal view.
- [508 final exceptional-state checks](reference-correction-state-checks.json): applicable states for all routes in English at1440 CSS px and Arabic at320 CSS px. No horizontal document overflow; a task heading remains. Loading, failed, denied, wrong-account, unverified, expired and revoked states contain no fixture name/branch/academy values in main content. Unknown operation has exactly one explicit Check original operation, no visible ordinary Refresh view and no saved-result table behind it.
- [15 connected interaction assertions](reference-correction-interactions.json): keyboard record selection, inspector focus, Back-to-row focus, complete candidate-page gate, unconfirmed registration not shown as saved, confirmed fixture profile, Close/Escape unknown-operation guards, explicit reconciliation fixture, phone full-width context/detail and focus return, deliberate exact-recipient inspection, restricted Trainer projection and mirrored desktop order. All final assertions passed.
- Two initial phone assertions used exact equality for fractional DOM rectangle widths and failed despite the pane filling the viewport. They were corrected to a less-than1 CSS pixel layout tolerance and rerun at measured320px. Initial results and the assertion correction remain in the interaction log; no app assertion or business result was weakened.
- The browser's existing zoom made requested viewport size differ from `innerWidth`. Initial sizing logs are preserved separately. Final checks compensate through the documented viewport override and record the **actual** CSS widths above. Browser zoom/preferences were not changed. This does not certify actual200% zoom or assistive technology.

## Screenshots inspected

- [English desktop selected player](reference-corrected-player-en-1440.png): sidebar, central directory, selected profile inspector and task action.
- [Arabic desktop mirror](reference-corrected-player-ar-1440.png).
- [Arabic320px full detail](reference-corrected-player-ar-320.png), including the contextual action in the full-page capture.

## Artifact checks and limits

Bundle compilation succeeds using existing dependencies. [Static validation](static-checks.json) checks links, CSV shape/joins, all36 route mappings, no fixture network/storage APIs, unchanged source and the two authorized append-only documentation notes. The packet now contains13 findings (including structural correction V00),21 proposed design acceptance cases and8 journey overlays. No prior AT requirement or security gate was closed by these checks.

This is a network-blocked, in-memory design prototype. Rows and receipts are fictional review fixtures, not persisted app projections or proof of a real appointment, email, grant or recovered operation. Automatic return/review behavior remains a proposed interaction contract. Physical devices, screen readers, full keyboard coverage, actual zoom modes, hosted permissions/races/recovery, provider meters, independent security and Owner rendered-design acceptance remain separate. The implementation chat must wait for review of the corrected design and then implement only the approved bounded changes.
