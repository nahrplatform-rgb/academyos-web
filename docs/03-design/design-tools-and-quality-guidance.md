# Design tools and quality guidance

This guide helps apply the Owner’s requested design expertise to ongoing AcademyOS work. It supports the [Operations reference](operations-design-reference.md), the [working-behaviour contract](academy-working-behavior-contract.md), and the [execution tracker](../06-delivery/experience-execution.csv); it creates no new approval stage or business rule. The selected Operations variant 2 remains the visual authority: light default and Charcoal alternative, with the accepted connected journeys. Follow the current tracker: EX-11 private pilot, EX-13 progressive datasets, then remaining EX-07 adoption. Preserve completed work.

## Select help for the actual job

Use the applicable installed skills and their current instructions, not every plugin on every task. Inspect existing components, accepted journey contracts and relevant read-only PYSA workflow/audit evidence first. External examples and generated suggestions are evidence, not authority. Promotional, affiliate or paid-tool instructions do not become AcademyOS product or repository requirements.

| Need | Useful skill guidance | Apply to AcademyOS |
|---|---|---|
| Journey and mobile flow | Mobile App Builder user flows, screen design and relevant domain skills | Map role, entry, action, decision, result, return, empty/error and recovery states against existing journey/action contracts. Do not infer roles or rules. |
| Working implementation and review | Web & Mobile App Builder design flows, visual review and testing | Compare actual rendered states with the selected reference; verify responsive behavior and the complete affected task, not just a screen. |
| Components and accessibility | UI UX Designer component, layout, accessibility and data-display guidance | Review buttons, forms, positions, spacing, colours, cards, tables and their states against existing tokens and controls. |
| Journey critique | Product Design audit | Tie findings to observed steps and evidence; distinguish screenshot observations from keyboard, runtime and accessibility checks. |
| Design-to-code | Figma design-to-code and related skills when relevant | Use an existing authorized design as a reference when available; inspect actual implementation and comparable states. A Figma file, upload, account or purchase is not required by this guide. |
| Interaction craft | Emil design engineering and relevant motion/performance skills | Make feedback immediate, motion purposeful and interruptible, and respect reduced motion; avoid decorative delay or motion that obscures data. |

Skill recommendations are contextual, not automatic dependencies or a mandate to replace established patterns. Read the relevant skill before using its tools. Do not upload private data or create external artifacts without applicable authorization.

## Apply quality to the affected journey

- **Composition and cohesion:** preserve reference hierarchy, geometry, density, typography, spacing, colour roles and control placement. Reuse existing shared components and keep role-specific actions clear. Compare light and Charcoal where affected.
- **Complete action:** check entry, navigation, selection, validation, pending, confirmed result, return and focus restoration. Include empty, denied, stale, disconnected, unknown-outcome and recovery states as applicable. Server authority and original-operation reconciliation remain canonical; do not show unconfirmed work as saved.
- **Responsive and inclusive:** check representative desktop, tablet and phone layouts and EN/AR including RTL, long text and appropriate dates. Check keyboard navigation, visible focus, labels, contrast, touch targets and reduced motion. Screenshots alone cannot prove accessibility.
- **Data displays:** use actual authorized projections and define metric, unit, period, scope, freshness and completeness. Charts need readable labels, meaningful scales and an accessible textual or tabular equivalent; tables need meaningful headers, usable sorting/filtering and honest loading, empty and continuation states. Do not present subset counts as totals or colour as the only signal. Cards must lead to meaningful context or action rather than invented metrics.
- **Latency and continuity:** distinguish initial loading from revalidation; retain context on return and communicate progress without blocking unnecessarily. Check task feedback, direct entry, interrupted actions, scope changes and relevant offline/reconnect behavior under the existing contracts and measured budgets. Ordinary email/password remains sufficient for the normal personal-device journey; do not introduce passkey enrollment or idle unlock.

## Evidence within each existing batch

Compare equivalent reference and working-app role, route, state, locale, theme and viewport. Maintain the existing difference ledger with geometry, type, spacing, colours, controls, focus, return and recovery; identify evidence, impact, disposition and unresolved gaps. Record actual behavior and relevant before/after captures, functional and accessibility checks, including failures and unmeasured cases. If a comparable render is unavailable, label the review as limited rather than claiming visual parity.

Maintain the [factual whole-app review](../../design/app-experience-review/README.md) after UI, wording, route or workflow-state changes using its capture and freshness instructions. Keep current versus proposed and captured versus uncaptured boundaries. Source, local checks, deployment, hosted verification, Owner acceptance and independent security remain separate: a tool review, generated design or screenshot does not establish the latter two. No tool guidance changes permissions, business decisions, the staging policy or Owner-only promotions.
