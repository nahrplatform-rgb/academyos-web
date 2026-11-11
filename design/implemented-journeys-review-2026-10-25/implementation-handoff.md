# Handoff to the implementation chat

**Ready for Owner design review, not authorized for dependent implementation yet.** Existing functionality and prior scoped usability approvals remain valid. This new presentation is not Owner-accepted by publication of the packet.

## Mandatory reference foundation

Follow the [reference foundation contract](reference-foundation-contract.md): navigation → central workspace → contextual inspector on desktop; mirrored RTL; connected list/detail on phones. The first card-oriented review layout is superseded and must not be implemented. The reference governs geometry, density, tables, toolbar, selection and action placement as well as color. Only the imitation macOS controls and unimplemented business examples are excluded. Extend existing production patterns to this frame; do not constrain the design to the earlier shell simply because that shell exists. Functional source remains unchanged in this design correction. Owner rendered-design review is still pending.

## Authorized outcome and traceability

Refine M1/I1 admission/invitation/setup and implemented narrow I2a/b/c, preserving all server permissions, tenant/actor isolation, authoritative reads, atomic/idempotent mutations, audit, delivery state and recovery. See [journey overlay](journey-overlay.csv) for existing journey/action/screen/requirement joins and [acceptance cases](acceptance.csv). These are proposed design acceptance cases, not replacements for canonical AT/security gates. Do not implement broad staff/guardian requirements from a narrow overlay.

Source of truth: accepted current repository decisions, per-slice contracts and latest appended receipts. The 24 October matrix snapshots and earlier pending paragraphs can lag later accepted work. Preserve concurrent/uncommitted files; inspect working tree again before editing. The first review added its own directory. The reference correction also appends Owner direction to the implementation plan and compact-blue foundation, preserving all prior text.

## Owner review sequence

1. Review the EN/AR connected prototype: platform admission/revoke/reissue → intended Owner acceptance → selection → resumable setup → registration/candidates/profile → Guardian appointment/accept/minimal view/end/denied → Trainer equivalent.
2. Review refresh/return-to-tab, unknown original operation, confirmed-write/read-failed, invitation/delivery and no-access states. Confirm the desired wording and hierarchy.
3. Record approved finding IDs and exceptions in this packet or canonical decisions. P approval does not silently approve I behavior or F projection/business changes.
4. Only then implement a bounded change, verify it and seek separate working-design acceptance. No dependent dated-training implementation follows from this packet alone.

## Suggested bounded implementation order after approval

**Presentation slice:** V04/05/06/10 plus presentation parts of V03/09. Reuse `WorkspaceShell` and native UI controls; consolidate context strip, review summary, check row, region-state and read-status patterns only where the current components need them. Keep domain components explicit. Retain I1 table/inspector, deliberate selection and phone Back. Proposed new patterns are not yet production components.

**Context and navigation slice:** V03 engineering part, V07, V11. Check available fields first. The corrected Guardian/Trainer views use generic workspace context and the permitted branch/profile fields. No academy-name projection is added; any future addition requires separate review. “Open academy” can keep the existing route; readiness-based routing cannot be fabricated. Preserve dirty/unknown navigation guards and locale input retention. Signed-out layout must not show cached private context.

**Freshness/recovery slice:** V01/02/08/09 interaction. Adopt the [refresh contract](refresh-policy.md), prove return-event coalescing and stale-version behavior, preserve original-operation semantics and request budgets. No automatic retry/replacement/reconciliation hidden behind a generic refresh. Test confirmed write + failed read independently of unknown commit. Do not change API/RPC/security policy merely to simplify a presentation component.

**Register reconciliation:** V12. Update canonical implementation/screen/requirement status separately with exact source/deploy/acceptance citations. Avoid overwriting this chat's pre-existing uncommitted matrices. Latest slice usability acceptance does not close PV direct-API, races, performance, meters, physical-device, screen-reader or independent-security gates.

## Required preservation tests

Use relevant existing tests; add meaningful cases only for changed behavior. Cover current authority and scope at every write/read, stale response after context change, reviewed version changed, duplicate candidate pagination/revision, unknown original operation before/after commit, cancellation fence, confirmed receipt + failed current read, ended access clearing, and other roles surviving exact end. Keep trusted backend contracts intact; no tests asserting only new labels as security proof.

For visual changes, verify EN/AR desktop/phone, 320/360px reflow and 200% zoom, keyboard tab/Enter/Space/focus return, error announcements and mobile checkbox targets. Native selects, physical devices and screen readers need separate evidence. Capture only fictional fixtures, never real contacts or child data. Run relevant documentation link/CSV validation after canonical documentation edits.

## Explicit exclusions and unresolved items

No dated training, enrollment, attendance, payroll, billing, media, consent/age/legal relationship evidence, family-wide access, cross-branch transfer, broad manager delegation, restore access toggle, new recipient authority, provider resend policy or real-data retention rule is settled here. No fees, durations beyond accepted I2b/c 72 hours, role powers or new sport catalog are invented. Do not infer production release, provider changes, migrations or a deployment from design approval.

## Evidence to report after implementation

State separately: design approved IDs; source changed; local tests; browser/device checks; hosted verification; deployment identifier; Owner usability acceptance; remaining decisions. This prototype is in-memory, with CSP blocking network connections; it is not implemented product or a persisted/access-controlled acceptance test.
