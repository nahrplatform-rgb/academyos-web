# Reference foundation contract — structural correction

25 October 2026. Owner direction: **the original reference is the exact foundation to follow**. Corrected rendered design awaiting Owner review. This contract supersedes the first review prototype's card-oriented workspace structure, not accepted business rules or existing functional approvals.

## The foundation

Source: [unchanged original HTML](../experience-prototype-v1/reference/AcademyOS_MacOS_Reference_Matched.html) and [reference desktop capture](../experience-prototype-v1/reference/inspection/opened-reference-desktop.png). Match the actual composition, not just the palette. Do not copy the reference's imitation macOS window controls, unimplemented example functions or sample business policy.

| Element | Reference rule | Corrected design |
|---|---|---|
| Frame | Compact toolbar above the whole workspace | Same compact hierarchy, breadcrumbs and role/language context; genuine web controls only |
| Navigation | Stable sidebar on the inline-start edge | Narrow blue/neutral navigation; current item, icons, account/workspace controls; only applicable implemented destinations |
| Work area | Main list/task remains central | Compact table or task form; no large centered floating card replacing the workspace |
| Third pane | Selected record details and actions on inline-end | Persistent desktop inspector; selected-row highlight, contextual summary and review/actions; no invented Documents/Activity tabs |
| Selection | Inspect without losing the main workspace | Table selection opens the inspector; the directory remains visible; Back/close returns to the source selection |
| Action placement | Primary action belongs to the current object/task | Inspector review/end/accept actions near its lower edge; directory creation action stays in the directory toolbar; no false success behind an unknown operation |
| Density | Compact type, thin lines, modest corner radius | 218px desktop sidebar and 360px inspector; 180/302px at medium desktop; compact 64px-style rows, 11–13px content hierarchy; wraps and scrolling protect legibility |
| RTL | Mirror the composition, preserve meaning | Navigation at right, work area center, inspector at left; logical borders/spacing, bidi-isolated values |
| Phone | Connected list/detail rather than three squeezed columns | Compact navigation rail and task view; selection opens full-width details with labelled Back/close; optional View context for a task's summary |
| Narrow roles | Same visual language with only permitted information | Guardian: linked player name/branch; Trainer: own staff name/role/branch. Generic workspace heading; no newly invented academy-name projection or fake roster |

These dimensions are design targets drawn from the reference, not permission to reduce phone targets, allow overflow, or force wide data into tiny columns. At 320px the content becomes a semantic list and full detail view. Do not duplicate private fields merely to fill the third pane.

## Journey placement

| Journey/action | Center | Contextual inspector |
|---|---|---|
| M1/I1 admission (J02-A01) | Academy directory and create action | Selected invitation/setup/delivery state; revoke/reissue review and original-operation recovery |
| M1 Owner acceptance (J03-A01/A02) | Intended invitation context | Exact role/scope and acceptance/recovery; no unconfigured initial branch asserted |
| Membership selection (J01-A01) | Existing memberships | Selection explanation; no guessed setup readiness or new role grant |
| Initial setup (J04-A01) | Branch/timezone and bilingual sport forms, independently saved | Current scope, unsaved status; completion review kept separate |
| I2a registration (J06-A01) | Directory, draft and complete scoped candidate review | Selected existing/saved player profile or new-registration confirmation; never label a new draft as an existing saved player |
| I2b Guardian (J07-A01/A02 narrow slice) | Owner appointment directory/form; minimal linked-player view for recipient | Exact authorized recipient inspection, narrow access review, revoke/end and recovery; recipient pane explains scope only |
| I2c Trainer (J08-A01 narrow subdivision with J03/J05) | Owner appointment directory/form; minimal own-staff view for recipient | Exact appointment inspection, narrow review, revoke/end and recovery; no dated training panel |

The same shared frame and table primitive serve these journeys. Forms and domain-specific reviews remain explicit components; a shared inspector cannot become a generic authority/data query.

## Interaction and trust boundaries

Selecting an existing record is a presentation/inspection action. Creating, accepting, revoking, reissuing, ending and reconciliation retain their existing operation, generation, version, receipt and current-authority boundaries. Never turn selection into a write. Existing I1 inspection of loaded data must remain free of new reads when integrated.

Unknown original operation disables replacement/navigation actions and has a single explicit **Check original operation**. It does not display the proposed new record as confirmed in the center. Ordinary Refresh view remains a current read and never reconciles a write. Current access failure clears private data in both work area and inspector. Failed delivery and unknown provider outcome remain distinct from acceptance and commit.

On a deliberate selection change, focus the detail heading. Back/close returns to the opener; Escape follows the same guard. On phones View context opens the contextual summary and Back returns to its opener. Native controls, 44px phone targets, labels, visible focus, live failure messages and full candidate-review gates remain required. Browser layout checks are not assistive-technology acceptance.

## Status and supersession

- `prototype/` is the active corrected design.
- `prototype-v1-superseded/` preserves the earlier card-oriented proposal for traceability. It is not an implementation target.
- Earlier `evidence/verification.md` and its screenshots describe that earlier proposal. Use the separately dated correction receipt for the active frame.
- Existing implementation approvals remain scoped and valid. The corrected rendered design itself still requires Owner review before the implementation chat changes the functional app.

## Owner review acceptance

AC21: at desktop widths, navigation/work area/inspector are distinct aligned regions; selection keeps the work area visible; RTL mirrors them; phones show connected full-width detail with Back/focus restoration. Typography, density, toolbar and action placement follow the reference. No imitation macOS dots, invented tabs/fields, unauthorized projections, fake totals or replacement writes. Review all implemented slices in normal, failed, denied, stale-review and uncertain-outcome states.
