# AcademyOS UI/UX and theme specification

Requirements: AO-117–130. **Selected direction: Workspace, Light, 18 px card corners.** English/Arabic, RTL, responsive use and restrained Apple-inspired clarity are foundational. These choices establish direction; the concept is not approval of every future screen or a production accessibility result.

## Product character and hierarchy

AcademyOS should feel calm, precise and human. The owner understands what needs attention; the trainer reaches today's session quickly; the guardian sees their child's next action without administrative clutter. Use whitespace, readable type and a controlled teal identity. Avoid decorative statistics, large empty hero panels, excessive gradients or glass effects on dense operational surfaces.

The visual concept is a starting point. Refine its identity with a consistent AcademyOS wordmark, a distinctive but simple academy switcher, meaningful status icons and a clear urgent-action area. A missed payment, attendance conflict and unread support reply must not all look like equal decorative cards. The top of a dashboard answers “What needs my action today?” before presenting historical trends.

## Color tokens

| Semantic token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#F5F7F7` | `#141A1C` | Page background |
| `surface` | `#FFFFFF` | `#1B2326` | Cards, dialogs, table surfaces |
| `sidebar` | `#EEF2F1` | `#172022` | Workspace navigation |
| `text-primary` | `#1C3034` | `#EDF3F1` | Primary text |
| `text-secondary` | `#52676D` | `#A8B9BD` | Supporting text |
| `border` | `#DFE7E6` | `#344347` | Decorative separation; not sole control boundary |
| `accent` | `#146B61` | `#9BDDC9` | Primary actions and focus accents |
| `on-accent` | `#FFFFFF` | `#143C33` | Text on primary action |
| `accent-soft` | `#E5F1EB` | `#243D36` | Selected/background emphasis |
| `warning-text` | `#925A17` | `#F0C887` | Warning text with icon |
| `warning-surface` | `#FFF4E3` | `#3E3222` | Warning container |
| `muted-surface` | `#F1F4F3` | `#242E31` | Subtle grouped surfaces |

Error, success, info, chart series and interactive-border tokens must be completed and contrast-tested before component acceptance. Proposed light error pair: `#B42318` on `#FEF3F2`; proposed dark error pair: `#FDA29B` on `#3B2020`. Never substitute red/green alone for text or shape. Do not assume the concept's pale borders pass interactive contrast requirements.

## Typography and geometry

Use DM Sans for Latin and Noto Sans Arabic for Arabic, subject to license verification and production self-hosting. Fallbacks must preserve usable layout when fonts fail. Arabic gets comfortable line-height and no artificial letter spacing.

| Token | Proposed value | Rule |
|---|---|---|
| Body | 15–16 px, 1.5 line-height | Main reading and forms |
| Dense table text | 14 px minimum target | Avoid the concept's smallest labels for essential data |
| Caption | 12–13 px | Secondary metadata only |
| Page title | 28–32 px desktop, 24 px phone | One main heading |
| Section title | 18–20 px | Clear grouping |
| Spacing | 4, 8, 12, 16, 24, 32, 48 px | Shared spacing scale |
| Card radius | **18 px** | Selected preference |
| Control radius | 10 px proposed | Inputs, buttons, segmented controls |
| Dialog radius | 20 px proposed | Modal boundaries |
| Touch target | 44 × 44 px product target | Comfortable field use; not a claim every WCAG criterion is 44 px |
| Desktop sidebar | 240–256 px proposed | Long Arabic/English labels fit |
| Content gutters | 24–32 px desktop; 16 px phone | Respect phone safe areas |

Light is the initial default. Add dark and system choices with persistent per-user/device preference and no flash of the wrong theme. Native applications later map the same semantic tokens to platform components; they need not reproduce every web pixel.

## Layout and navigation

Desktop: persistent sidebar, compact header with academy/role context, page title/actions, filter region and primary content. Reserve a consistent location for help and account settings. Hide unauthorized navigation, while direct navigation still receives server authorization.

Tablet: collapsible navigation, generous touch controls and responsive two-column content. Phone: focused one-column task layout; trainer navigation can use Today, Sessions, Sync and More. Owner tables keep essential columns, move secondary detail into a sheet and support explicit horizontal scrolling where necessary. Do not shrink a desktop dashboard until every label is unreadable.

Use width breakpoints driven by content, with test fixtures around 360/390, 768, 1024 and 1440 px. Support 320 CSS px reflow where applicable, browser zoom, landscape, software keyboards and long translated strings. Persistent action bars must not cover focused inputs or the last list row.

## Component contract

Each component documents anatomy, tokens, keyboard behavior, accessible name, loading/empty/error/disabled/read-only states, Arabic behavior and responsive form. Required components: buttons, links, labeled fields, searchable combobox, date/time input, money input, tabs, dialog, sheet, menu, toast, inline alert, confirmation, status badge, data table, pagination, filter chips, file uploader, progress indicator, avatar, metric card, timeline, calendar cell and offline queue item.

Primary buttons use a clear verb: “Save session,” “Record payment,” “Approve correction.” A destructive confirmation names the target and consequence. High-impact money/permission actions show a review step and require the applicable authority; they are not hidden behind an ambiguous icon menu.

Forms preserve safe input after validation failures. Show a summary and field errors, move focus deliberately and announce asynchronous results. Disabled actions explain the prerequisite when useful. Submitting prevents accidental duplicate UI clicks while server idempotency remains mandatory.

## Truthful application states

| State | Display | Recovery |
|---|---|---|
| Loading | Stable skeleton or labeled progress | Keep layout stable; allow cancellation where appropriate |
| Empty | Explain genuinely absent data | Offer permitted first action |
| Failed read | Explain information could not load | Retry; never replace unknown balances with zero |
| Saving | Indicate action in progress | Prevent ambiguous duplicate submission |
| Saved | Show committed result | Link to record/receipt |
| Outcome unknown | Say confirmation was interrupted | Reconcile original operation before retry |
| Partial completion | Show completed and failed items | Retry only unresolved items |
| Conflict | Show authoritative current state and local intent | Review/reapply if permitted |
| Access changed | Explain current access is unavailable | Choose another role/academy or request access |
| Offline queued | Say stored on this device | Sync tray and conflict handling |
| Restricted subscription | Explain affected feature | Authorized billing/recovery path |

## Arabic, accessibility and motion

Mirror layout using logical CSS properties; do not reverse all icons blindly. Directional navigation arrows mirror; media playback and familiar logos generally do not. Keep emails, phone numbers, identifiers and mixed currency values in isolated direction-aware spans. Localize full sentences, plural forms, dates and number formats; do not concatenate translated fragments. Persist language independently of academy switching when appropriate.

Target WCAG 2.2 AA: test text and non-text contrast, keyboard operation, visible/unobscured focus, semantic names, reflow, error identification and accessible authentication. Typical minimum text contrast is 4.5:1, with 3:1 for qualifying large text; applicable UI component contrast is 3:1. Automated scanning is supplemented by keyboard and screen-reader checks. [W3C WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/)

Use short functional transitions, proposed 120–180 ms. Respect reduced motion; no animated charts or shimmer essential to understanding. Do not trap focus in nonmodal panels. Announce sync and save outcomes without repeatedly interrupting the screen reader.

## Design acceptance

Approve representative owner, trainer, guardian, player and platform-admin journeys in EN/AR, light/dark and phone/desktop. Test long academy names, many roles, missing avatars, long money values, empty calendars and validation errors. Save component screenshots and accessibility evidence with the implementation version. A polished static mock is not acceptance of permissions, real data, latency or recovery.

## Journey-first application of the design system

Apply these components through the [experience blueprint](experience-blueprint-and-journey-governance.md). Consistent colors and spacing are only one layer: navigation, inputs, confirmation, pending results, recovery and cross-person handoffs must also be consistent. Before building a journey, review its connected screens and states in EN/AR and phone/desktop contexts. Components and prototypes remain unverified until exercised in their actual task context.

## Loading is part of interaction design

Use the [experience/performance plan](experience-performance-and-data-loading.md) for stable progressive regions, role-first task priority, safe save feedback and clear pending/partial/stale states. A skeleton is not a useful view; visual acknowledgement is not a committed business action. Validate loading alongside keyboard focus, Arabic RTL, mobile layouts and interruption recovery.
