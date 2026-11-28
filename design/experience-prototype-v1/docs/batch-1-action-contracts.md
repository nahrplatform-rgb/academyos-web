# Batch 1 — admission, owner acceptance and initial setup

23 October 2026 · Design contract B1/v1 · Journey A · Synthetic local prototype only.

This design continues the accepted M1 business contract using the owner's newly selected compact blue HTML appearance. It does not change the functional application, apply a migration, contact a provider, grant a role, send an invitation or establish runtime/security acceptance. The original M1 design approval does not approve this new visual treatment or every new state. Track Reference selected → Designed → Prototype connected → Reviewed → Owner approved separately.

## Authority and accepted policy

The [decision register](../../../docs/00-governance/decisions-and-open-questions.md) and [accepted M1 packet](../../../docs/06-delivery/onboarding-m1-decision-design-packet.md) record Moamen's 22 October acceptance of M1-D2, M1-D3a–d, M1-I, M1-S and M1-R. Earlier wording that D-002/D-003 are wholly open is historical. Broader policies remain open.

| Decision | Binding first-batch behavior | Boundary still open |
|---|---|---|
| D-002 / M1-D2 | Invite-led synthetic admission. A currently authorized Platform Owner creates the academy and nominates its first owner. Signup alone creates no ownership. | Public applications, admission review/rejection and real-academy rollout |
| D-003 / M1-D3a | Fixed roles; Academy Owner has academy-wide initial-setup authority. Manager, Trainer, Guardian and Player have no M1 setup writes. | Named manager capabilities, custom delegation and broader branch administration |
| M1-D3b | One accountable active initial owner. A pending appointment gives no tenant access; acceptance installs the owner atomically. | Multiple owners, transfers, last-owner replacement and emergency reassignment |
| M1-D3c | Platform authority is separately provisioned and audited. It never creates tenant membership or private tenant-content access. | No prototype control executes provisioning |
| M1-D3d | Lost/disputed owner fails closed, preserves history and needs a manually reviewed recovery case and separately authorized action. | Evidence, reviewers and recovery rules; no invented cooling-off period |
| M1-I | Exact intended verified email; 72-hour invitation; same-subject replay returns the original result. Retry delivery preserves intent and expiry; reissue invalidates the previous secret. | Other invitation audiences and channels |
| M1-S / M1-R | Resumable branch/timezone and sport EN/AR saves, then review the branch–sport association. Completion means initial setup only. | Country/currency/profile completion, seeded sport catalog, archive behavior, operational/commercial activation |

No fee, trial, tax, payment, consent, retention or age rule is added. D-001, D-009, D-014 and D-015 constrain later activation or real-data use; they do not block this synthetic design.

## Journey and shared invariants

S59 admission queue (related S06) → S61 create/review (related S07) → S62 appointment/delivery receipt (related S21) → S01/S02 identity and invitation review → S02 acceptance → S03 academy/role context → S13 checklist → S14/S15 branch/timezone → S15 sport → S13 completion receipt.

Screen IDs retain the repository's meaning. S06 here is the admission portion of the platform overview; S07 is academy detail/create review; S14/S15 cover the relevant setup fields. This is not full coverage of those screens. The current source edits one initial branch and one sport; this design must not imply a completed multiple-branch directory. The [page/action matrix](page-action-matrix.csv) gives per-view mappings.

Every consequential transition must explain actor, academy, role, scope, result and next action. Platform and Academy Owner shells remain visibly distinct. A scenario or persona selector is a review control, never proposed authorization. Row inspection, checkbox selection, selecting a visible page and selecting all matching results are separate interactions; the new demonstration supports independent selection but offers no bulk admission or ownership mutation.

The local prototype uses synthetic session state in the same browser tab, with an explicit reset. A simulated saved record can survive refresh in that tab; this is not a proposal to persist private application records in browser storage. Unsaved edits are not called saved. Language changes preserve the current simulated step. Reset removes only prototype state. No server commitment or real authentication occurs.

For implementation, actor and current authority come from the existing verified session/server/database boundary. Inputs never supply authority. Same operation ID plus same payload returns its authorized original result; a changed payload conflicts. The original operation must be reconciled after uncertainty before a replacement can begin. Already committed history has no generic undo.

## J02-A01 — create academy and nominate initial owner

**Requirements:** AO-003/008/011; AT-003/008/011. **Screens/loading/security:** S06/S07/S21; L02; SEC-J02, SEC-M1, M1-T01/02/03/05/06/10/14.

- **Actor/context:** current Platform Owner, platform context, no tenant branch selected. Entry is Create academy from the admission workspace. A selected row opens an inspector and cannot silently select it for a bulk action.
- **Inputs:** required academy display name and intended owner email; review makes Academy Owner and setup-only consequences explicit. No optional fee/currency/plan/owner-count fields. Email entered by the inviter is a destination, not evidence that it is verified.
- **Main path:** edit → review exact academy and intended recipient → confirm → pending local feedback → simulated receipt showing academy saved, owner acceptance pending and delivery state separately. Return to that academy's platform detail.
- **Commit versus later work:** implementation atomically creates academy, pending appointment, operation receipt, audit and delivery intent. Sending happens after commit. A provider-accepted message is not inbox delivery and is not owner acceptance.
- **Consequences:** creates a pending academy and one owner appointment; no owner membership yet, no money movement, no child/customer data, no operational activation. An actual implementation may queue one email; the prototype sends none.
- **States/recovery:** empty queue; validation with preserved input; saving; receipt; delivery queued/failed/blocked/unknown; unavailable authority; restricted grant; unknown commit. When a response is lost, disable replacement and check the original operation. A failed delivery does not recreate the academy. A potential same-name academy is not automatically merged or forbidden by an invented uniqueness rule.
- **Leaving/switching:** warn about an unsaved form; show pending operation reference before leaving an uncertain result. A refresh returns to the simulated committed record; no draft is retargeted to a tenant workspace. No delete/undo action. Pending invitation withdrawal uses J03-A03 and does not erase the academy.
- **Open policy:** public admission and commercial activation remain Policy to confirm, outside this action.

## J03-A01 — review intended invitation

**Requirements:** AO-005; supporting AO-004/009/124. **Screens/loading/security:** S01/S02; L03; SEC-J03, M1-T04/09/10/12.

- **Actor/context:** intended recipient, authenticated with the exact destination verified; no Academy Owner authority before acceptance. Entry is the private invitation handoff.
- **Inputs:** no editable role, academy or recipient. Sign in/create account/verify email are identity prerequisites, not an access grant. Display only the current invitation's academy, appointed role, expiry/status and safe reference after recipient authorization.
- **Main path:** handoff pending → identity entry if needed → verified recipient review → separate Accept owner appointment action. Opening/reviewing never accepts automatically.
- **Commit/async:** review has no business commit. Existing app exchanges a fragment for an encrypted short-lived handoff cookie; its current 15-minute handoff lifetime is distinct from the accepted 72-hour invitation lifetime. The prototype merely illustrates this distinction.
- **States/recovery:** signed out, handoff pending/failed, unverified identity, wrong account, expired/revoked invitation, already accepted, restricted, unavailable. Wrong-account guidance must not expose the destination or unrelated private details. Reopen the original link after handoff expiry; ask the inviter to review an unavailable invitation. Do not modify another account's email to force a match.
- **Leaving/switching:** a changed identity clears private review projections. No acceptance control while handoff is unresolved. Reauthentication returns to review, not automatic acceptance. No undo applies because this action reads only.

## J03-A02 — accept owner appointment

**Requirements:** AO-005/006/007/008; AT-005/006/007/008. **Screens/loading/security:** S02/S03; L03/L01; SEC-J03/05, M1-T01/02/04/05/06/07/14.

- **Actor/context:** current exact verified recipient reviewing the nominated academy and Academy Owner role. Required input is deliberate acceptance of that appointment; no role, branch or recipient override.
- **Main path:** review → accept → saving → confirmed academy/role receipt → choose/enter the correct context. A successful result identifies the academy rather than relying on a generic success toast.
- **Commit:** server rechecks current issuer/recipient, expiry, revocation and provisioning state under the invitation/owner-slot locks; atomically redeems invitation, installs one owner membership, updates setup phase and records audit/receipt. No payment or commercial entitlement is implied.
- **States/recovery:** saving, success, already redeemed by same subject, revoked/expired, wrong recipient, version/acceptance race, unknown result, unavailable. Duplicate acceptance returns the same permitted result. Another subject is denied. Unknown outcome checks the original operation before any replacement.
- **Leaving/switching:** retain only a safe context-bound pending operation in the functional app; revalidate authority on resume. The prototype uses synthetic state only. Accepted ownership has no invitation undo: withdrawal/reissue cannot remove an installed owner. Transfer/recovery requires later reviewed policy.

## J01-A01 — choose and enter academy/role context

**Requirements:** AO-002/003/004/009; AT-002/003/004/009. **Screens/loading/security:** S03/S13; L01/L02; SEC-J01, M1-T01/02/03/09/12/13.

- **Actor/context:** signed-in person with current permitted memberships; one identity may hold roles in several academies. Platform access is a separate context. Display selected academy and role, plus branch when relevant; initial owner setup is academy-wide, not a guessed branch grant.
- **Inputs/main path:** choose an authorized academy/role → recheck current membership → show that academy's resumable setup. The first useful view is a usable authorized context choice, not a shell or skeleton. List labels and roles first; defer profiles and histories.
- **Commit:** navigation does not alter business membership. A selected ID is a request to use a context, not authorization. Current source supports bounded membership pages; the design retains More results instead of claiming the first page is complete.
- **States/recovery:** loading; one/many/no memberships; empty successful result; unavailable lookup; revoked/suspended access; delayed old response; interrupted form. No-membership copy explains invite-led access; it cannot offer self-created ownership. A failed lookup never looks like no memberships.
- **Leaving/switching:** warn about unsaved edits and retain their original academy binding; clear incompatible private projections and discard late old responses. Never fall back to another academy after denial. Return to authorized chooser after access change; no undo is needed.

## J04-A01 — save initial branch and explicit timezone

**Requirements:** AO-003/004/011/019; AT-003/004/011/019; supporting AO-125/127/129. **Screens/loading/security:** S13/S14/S15; L02; SEC-J04, M1-T01/02/03/06/08/09/12.

- **Actor/context:** current Academy Owner, explicitly named academy, academy-wide setup. Manager and other roles receive restricted guidance; no manager branch write is invented.
- **Inputs:** required branch name and explicit valid IANA academy timezone; internal expected setup version and operation reference. No browser-location inference, default country, automatic currency, address requirement or timezone override policy is introduced.
- **Main path:** checklist → branch/timezone editor → validation/review → save → named branch/timezone receipt → return to the checklist with this step saved. The sport step remains separate.
- **Commit:** one authoritative branch/configuration/progress/audit/receipt transaction. Failed first-branch save leaves initial setup incomplete and blocks dependent operational readiness; AT-011 stays intact.
- **States/recovery:** not saved; editing; validation; saving; saved; failed; stale version; restricted; unavailable; unknown result. On version conflict, show current saved state and retained local intent for explicit review, not a silent overwrite. Unknown result reconciles the same operation. Retrying the original intent cannot create another branch.
- **Leaving/switching:** unsaved edits are clearly separate from saved progress. Refresh/resume returns saved state; context switch never reuses the draft in a different academy. Later changes to timezone after dated sessions need a consequence/effective-boundary contract; no promise of retroactive rewrite or generic undo.

## J04-A02 — save the initial sport

**Requirements:** AO-003/004/012/019; AT-003/004/012/019, partial AO-012. **Screens/loading/security:** S13/S15; L02; SEC-J04, M1-T01/02/03/06/08/09/12.

- **Actor/context:** current Academy Owner in the same named academy. Required sport English and Arabic labels; expected version and operation reference internally. No automatic seeded sport, age eligibility, evaluation scale or pricing rule.
- **Main path:** checklist → sport editor → save → named localized sport receipt → checklist/review. Branch and sport may be resumed independently; completion requires valid saved records together.
- **Commit:** sport configuration, progress, audit and receipt in one transaction. Foreign/archived references cannot be associated. Seeded catalog and historical archive behavior remain later AO-012 coverage.
- **States/recovery:** not saved, validation, saving, saved, conflict, failed/unavailable, restricted and unknown result. Preserve input on validation; reconcile original operation after uncertainty; compare current version before resubmitting reviewed intent.
- **Leaving/switching:** same scoped unsaved/saved distinction as branch. Locale switch changes presentation, not sport identity or saved values. No archive/delete/undo promise in this batch. No external notification or financial side effect.

## J04-A03 — review and complete initial setup

**Requirements:** AO-011/019; AT-011/019, supporting AO-121/129. **Screens/loading/security:** S13; L02; SEC-J04, M1-T01/02/03/05/06/08/12.

- **Actor/context:** current Academy Owner of the displayed academy. Prerequisites: saved branch, explicit valid timezone, saved sport and current version. Inputs: deliberate confirmation of the displayed branch–sport association; no additional guessed profile or commercial fields.
- **Main path:** review exact saved values → complete → saving → receipt naming branch, sport and timezone → initial setup complete. The next view explains later operational modules without enabling dead links.
- **Commit:** revalidate current authority, version and same-academy active references; atomically bind sport to branch, advance completion/provisioning state and save audit/receipt. Failure keeps setup incomplete. The prototype demonstrates the state only.
- **States/recovery:** incomplete with specific missing action; ready for review; saving; success; conflict; restricted; failed; unknown. Duplicate completion is idempotent; current authority is still checked before replay. Unknown completion is reconciled using the original operation.
- **Consequences/leaving:** no plan activation, trial, billing, enrollments or external message is implied. Saved completion survives ordinary resume in the functional contract; prototype persistence is explicitly tab-local. Completion is not undone by hiding the checklist; later configuration edits require their own permitted/versioned action.

## J03-A03 — resolve delivery or withdraw a pending appointment

**Requirements:** AO-005/006/008; AT-005/006/008. **Screens/loading/security:** S21/S07; L03/L02; SEC-J03/05, M1-T03/05/06/07/10/11/14.

- **Actor/context:** current Platform Owner viewing a selected pending appointment. Required target invitation, expected generation/version and original or new operation reference according to action. The recipient is not editable here.
- **Retry delivery:** retry the existing eligible delivery intent; preserve the invitation and its expiry. Show queued/sending/provider accepted/inbox unverified separately. A provider-unknown result requires reconciliation; it is not blindly resent.
- **Reissue:** review that the old secret will become invalid and a new 72-hour invitation goes to the same intended recipient. Confirm → audited generation change plus delivery intent → new pending result. No replacement academy or owner membership.
- **Withdraw:** review that the pending invitation will no longer grant access; confirm → audited revocation → receipt. An acceptance/revocation race has one serialized result. If acceptance already won, do not offer withdrawal as removal of the owner.
- **States/recovery:** queued, sending, accepted by provider, failed, blocked by configuration, unknown, revoked, expired, accepted owner, stale generation, limited/unavailable authority. Keep academy creation outcome visible when delivery fails. Separate safe retry from reissue and from ownership recovery.
- **Leaving/correction:** pending work remains visible on return; check original operation after response loss. There is no undo of secret revocation; a separately reviewed reissue creates a new invitation generation. Owner transfer/lost-owner recovery remain Policy to confirm, with safe help guidance and no automatic reassignment button.

## Shared state and review contract

Use deterministic scenario controls in the prototype and label every delay/result as simulated. They are review fixtures, not failure injection against the app. A scenario is demonstrated only when its rendered result and safe next action have been exercised; a row in this document is a requirement, not test evidence.

| State | Required visible distinction | Reviewer check |
|---|---|---|
| Loading | Region-sized skeleton plus named work; no false empty result | First useful form/list appears only after simulated authority/content readiness |
| Validation | Summary linked to fields, preserved valid input and focus | No save, navigation or state loss from invalid input |
| Saving/pending | Local acknowledgement distinct from commit/delivery | Primary commit cannot be repeated accidentally |
| Success | Named outcome, academy/role and safe reference | No generic success implying delivery/activation |
| Partial | Academy saved, downstream delivery not confirmed | Retry affects only eligible side effect |
| Failed/unavailable | Task-specific retry; no fake zeros or no-membership inference | Other independent authorized regions stay useful |
| Unknown | Original operation reference and Check result | No replacement create/accept/complete until reconciled |
| Stale/conflict | Current saved version and retained local intent | No automatic overwrite |
| Restricted/revoked | Remove private projection and explain safe context choice | No stale form submission or cross-academy fallback |
| Interrupted | Saved versus unsaved work and resume destination | Refresh/context change retains only permitted scope |

## Five quality dimensions and the independent security gate

| Journey segment | Usability | Speed | Correctness | Cost | Recovery |
|---|---|---|---|---|---|
| Admission J02-A01 | Creator can name resulting state and intended recipient | Useful form/list before deferred inspector history | Current platform authority; no owner from signup | One bounded list; one transaction/intent; no provider fan-out | Original operation lookup; delivery failure does not recreate academy |
| Invitation J03-A01/A02 | Recipient sees correct academy/role and deliberate acceptance | Minimal review after handoff/identity readiness | Current verified recipient, expiry/revocation, one owner | One selected invitation; no unrelated directory | Wrong account/original-link help; same-subject receipt; unknown reconciliation |
| Context J01-A01 | Academy and role remain apparent at entry/switch | Bounded membership labels before profile/history | New membership check; late responses discarded | Page results; no loading all tenant records | Empty versus failed; no fallback to another academy |
| Branch/sport J04-A01/A02 | Checklist identifies saved work and next required step | Named setup projection and editor first | Same academy, current owner/version, explicit timezone | Selected initial records only; targeted refresh | Preserved input; conflict review; no duplicate save |
| Complete J04-A03 | User can explain setup-only outcome | Saved review values avoid unnecessary retrieval | Atomic association/completion; never false readiness | One commit and affected projection refresh | Idempotent receipt; failure remains incomplete |
| Delivery J03-A03 | Retry/reissue/withdraw have different consequences | Selected operation status, not whole-page blocking | Current grant/generation; accepted owner protected | Bounded retry; one intent; no blind resend | Unknown provider reconciliation; history preserved |

These are review criteria, not measured performance results. Use [L01–L03](../../../docs/03-design/screen-data-loading-matrix.csv): class A at authority/commit, current scope on every sensitive action, explicit pagination, independent loading regions and targeted refresh. Prototype delay controls prove no latency or cost budget. Actual measurements must retain declared device/network/dataset, samples, failures, bytes and work from the [performance contract](../../../docs/03-design/experience-performance-and-data-loading.md).

Security remains independent: browser/session → server → caller-derived database transaction; platform → tenant authority; actor → invitation/operation; current academy → branch/sport; commit → delivery worker/provider; private scope → browser state. Review SEC-J01–05 and [SEC-M1/M1-T01–T14](../../../docs/06-delivery/onboarding-m1-decision-design-packet.md). Prevention is current authority, recipient proof, minimal projections and atomic idempotency. Detection uses safe operation/audit references. Containment denies changed access and pauses/revokes only the authorized pending effect. Recovery reconciles before repair and preserves history. Local visuals cannot verify any of these server, database or provider controls.

EN/AR desktop and mobile review includes long names, LTR-isolated email/timezone/IDs, mirrored navigation/inspector placement, visible focus, label/error association, keyboard completion, reflow and meaningful announcements. Native Arabic, assistive-technology and real-user acceptance remain separate. Dedicated Trainer/Guardian/Player mobile journeys are later batch work, not this setup flow.

## Actual prototype coverage boundary

The action and state descriptions above are target contracts. Current source connects the main path, required-field checks, partial delivery status, invitation rejection/recovery examples and setup prerequisite checks. Unknown/loading/saving and stale states are manually selected illustrations: they do not inject a real interrupted mutation or concurrent authoritative write. Stale currently preserves draft and requires another explicit save, but does not present a full side-by-side version diff. Sign-in, email verification, handoff-cookie lifetime, full list pagination, safe support case creation, per-field linked errors and true async/duplicate-operation handling are not implemented in this visual artifact. The simplified unknown-state check returns the existing fictional state without submitting a replacement; it cannot prove idempotency. Browser/layout/keyboard and native Arabic review are pending because local browser access was disabled. See batch-review.md for exact evidence.
