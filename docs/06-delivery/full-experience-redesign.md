# Full connected experience redesign —29 October2026

Local-first behaviour review: [targeted EX-10 packet](local-data-read-pilot-decision-design.md) extends the accepted Charcoal reference with persistent reopening/preparation/recovery states; [handoff/evidence](../07-handoff/local-data-read-pilot-review.md). Proposed local behaviour is not factual current-app parity.

## Persistent local data and synchronization — LF-v2,2November2026

Use the [working-behaviour contract](../03-design/academy-working-behavior-contract.md), [working-day acceptance](academy-working-day-acceptance.md) and [planned cases](academy-working-day-cases.csv) with the current tracker.

Owner clarified persistent permitted datasets across normal visits, progressive player-directory/month preparation and quiet change synchronization. This is now core experience architecture, not a memory-only summary pilot or an optional native-app prerequisite. Read [local-data and sync plan](local-data-and-sync-plan.md) and [Shift staging iOS source review](../04-engineering/shift-ios-local-data-reference-review.md).

Follow the single current row in [experience-execution.csv](experience-execution.csv): EX-10 revised local-data/access/transport design → EX-02 workspace → EX-06 durable repository → EX-04 resumable bootstrap/change sync → EX-03 original-operation recovery → EX-11 connected/reopened-local acceptance → EX-07 remaining Charcoal parity. EX-05/08/09 run alongside. Existing source, prior functional/visual approvals and release evidence remain.

The unaccepted WB-P01–P04 summary-only/30second/5minute/intent-only recommendations are superseded. LF-P01–LF-P06 exact field/device/access/retention/sync choices still need review; offline writes, finance, new roles, production, real data and access grants are not inferred. No runtime persistence exists from this documentation update. Older dated source/evidence notes below remain historical within their own scope.


## Authority, current boundary and status

Moamen explicitly instructed implementing the full Charcoal spectrum plan on29October2026. This supersedes the earlier palette-only interpretation: the previous theme rollout does **not** complete the requested UX redesign, and the Owner rejected its lack of visual richness. Preserve actual deployed behavior and earlier scoped functional approvals.

Accepted execution choices: redesign all implemented journeys plus connected read-only Owner/Trainer/Guardian homes and calendars; produce **one complete proposed EN/AR preview before product implementation**; replace compulsory visual inspection of every program-date page with full automatic bounded checks, weekly summary and mandatory exception review; retain every-date access and the signed complete-definition/context receipt. Consolidated connected-design review remains required before dependent product/API/schema implementation. Plan acceptance is not acceptance of an unseen preview, new access grant or production launch.

Current deliverable: [proposed connected preview](../../design/full-experience-preview/AcademyOS-connected-preview.html), [preview maintenance](../../design/full-experience-preview/README.md), [30-view scoped coverage](../../design/full-experience-preview/coverage.json). The [factual current-source experience review](../../design/app-experience-review/AcademyOS-experience-review.html) stays separate and unchanged. New homes/read projections and revised review UI are simulations until their product implementation is independently recorded.

## Design contract

- Charcoal spectrum with dark default and equivalent light alternative. Layered near-black/charcoal/slate structure; sky training/calendar, teal attendance, gold people, violet development, coral family and mint operations. Module identity and semantic success/error/warning remain separate. Colour appears in selected navigation/rows, summaries, module surfaces and meaningful context, not only badges. One consistent primary-action style.
- Desktop1280+ uses224px labelled navigation, flexible center and336px context inspector (300px for smaller wide desktops); no fake OS controls or floating desktop window. Tablet/laptop768–1279 uses labelled navigation drawer and on-demand detail. Phone320/360/390 uses a focused task, Owner drawer, Trainer/Guardian labelled bottom navigation and native detail dialog.
- Central work stays central: roster marking without per-player modal loops, complex creation/planning as explicit task stages. Row inspection retains search/filter, month/week and local scroll; focused short edit/review dialogs return focus. Keep one primary task action, natural EN/AR language and consistent branch-timezone dates.
- All consequential local simulation saves distinguish choices → exact review → pending → confirmed result. Review toolbar deliberately delivers the fictional response. A reply lost after/before save uses original-outcome reconciliation; no real server proof is implied. No automatic absence, fake transaction success, silent merges, invisible publication, new fees or unsupported undo.
- 18 fictional people and40 dated sessions; existing individual plan preserved in program-level all-or-nothing save. Different weekday times, private drafts, publication, protected attended dates, original occurrence/history, correction reason/different-account reviewer and Guardian published-only projection remain explicit.
- Provider-owned sign-in/OTP is a labelled boundary with fictional identity only; scanner/camera/QR are labelled specimens. Do not enter real credentials or claim camera/identity/provider proof from this preview.

## Traceability and interfaces for the later implementation

J01–J13/J15/J16 implemented subsets retain their existing IMP/AO/AT/screen/loading/security joins. The coverage JSON derives parent associations from the canonical action matrix; it neither closes all parent requirements nor introduces accepted screen IDs. J14/offline, finance, communication/media, Manager/Player operational portals remain an explicit future backlog. Each domain's existing accepted lifecycle and writer remains canonical; no all-purpose operation abstraction.

After preview approval, extend real shared shell/controls/panes with navigation groups, task headers, module accents, inspectors and native dialogs. Add only necessary bounded read projections: scope/freshness/actions/cursors; current Owner academy, active assigned published Trainer sessions and approved-link Guardian projections. Calendar maximum42days/50 summaries per response with honest continuation and authoritative counts; no count from a loaded subset. Existing signed gateway, tenant/field authority, no-store/freshness and rate/body/response limits remain. Program UI may automatically consume existing28-day signed preview windows, but must finish full checks and preserve the complete receipt before final confirmation. Do not skip receipt validation or change client counters to bypass checks.

Navigation context may retain scoped period/filter/resource IDs, never private roster/profile payloads. Context/account/revocation clears obsolete data; uncertain writes reconcile before replacement. Use original atomic/idempotent write endpoints unless a reviewed versioned contract is genuinely needed. No database or provider change is made for this preview.

## Source and reference inspection

Reviewed the actual shared shell/panes, program definition/preview receipt chain, publication/calendar, Guardian training and development contracts; relevant journey/action/loading/security matrices and engineering charter. Retained reference: `/Users/moamenghareeb/Downloads/AcademyOS visuals help/AcademyOS_Final_Comprehensive_Verdict_v2.md` and its annotation studio. The report's old blue-led recommendations and imported acceptance/ratings are not authority over the Owner's later Charcoal selection or security gates.

PYSA read-only references: platform-description/current-surface reference and AcademyOS's scheduling review/preservation ledger; `pysa-platform/components/shared/calendar-grid.tsx`, `components/navigation/owner-sidebar.tsx`, `components/trainer/session/session-attendance.tsx`, `components/guardian/guardian-schedule-client.tsx`, plus engineering-audit checkpoint35. Useful patterns: connected calendar→session→roster, direct attendance, role navigation, family selected-child context. Known source/audit cautions: local-calendar/timezone math, subset-only search/counts, translation fallbacks, false-success helpers and source/hosted policy differences. No PYSA source, private data, credentials, database or live behavior changed/tested/copied.

## Verification and rollout sequence

1. Build/test the complete proposed preview: all views, applicable exceptional states, EN/AR and320/360/390/900/1440 layouts, native dialogs/focus, exact confirmation, pending/unknown interruption and representative end-to-end journeys; inspect rendered screenshots and list real limitations.
2. Obtain consolidated design review using the full connected proposal. This is the next product implementation gate in the approved plan.
3. Implement shared foundations and reference attendance/training/publication, then read-only homes/calendar and other journeys in bounded batches against the approved preview. Re-capture the living factual review after actual UI changes.
4. Run source/local/API/SQL/security/hosted/accessibility/performance checks appropriate to each batch. Test two-academy, wrong role, revocation, expired invitations, duplicates, stale/concurrent changes and interrupted writes. Keep p75 useful task3s/local feedback200ms, p95 ordinary read800ms and CLS0.1 as declared-profile measurement targets, not current claims.
5. Deploy only to existing staging; compare exact role/state/locale/viewport and record real differences. Working usability acceptance, independent human security, physical-device/accessibility and load/cost remain separate. Any temporary authority test still needs its own authorization.

Rollback: preview artifacts can be removed/reverted without product or database effects. Later product batches require their own compatible rollback/forward-repair and source/test/deployment receipts. No services purchased/upgraded; no new telemetry, emails, real data, account grants or production launch.

## Preview delivery receipt

The full proposed preview is ready for consolidated Owner review. [Local verification](../../design/full-experience-preview/verification.md) records 300 layout cases, 309 applicable state cases and 21 journey/state groups; source/HTML/coverage/manifest freshness and the unchanged factual review were checked. [Delivery status](../../design/full-experience-preview/delivery-status.csv) keeps design approval, product implementation, local design testing, deployment, hosted proof and Owner acceptance separate for all destinations. None of the local simulation results close product/backend/security/device/performance gates. No new app, schema, provider, access or hosted deployment change occurred in this batch.

## Consolidated approval —29October2026

Moamen explicitly answered “Approve this connected design for implementation.” The approved visual/workflow reference is commit `8e0b667` and its complete proposed HTML. This settles the consolidated design gate for the declared scope. Earlier review-pending checkpoints above are historical; this approval is not hosted working-feature acceptance, security approval, an access grant or production authority.

Implementation batch1: [scope, contracts and evidence](../../docs/07-handoff/full-experience-foundations-implementation.md). Preserve the exact approved proposal while translating its representative fixtures into real scoped data.

Continuation: [publication batch evidence](../07-handoff/full-experience-publication-implementation.md) and [next program/date planning scope](../07-handoff/full-experience-planning-implementation.md). The full redesign remains in progress; the source, staging, hosted verification and acceptance checkpoints in these packets are deliberately separate.

EX-10 decision-preparation checkpoint2November2026: [pilot source/architecture and exact WB-P recommendations](../04-engineering/working-day-pilot-architecture.md). Proposed policy and changed-state review remain pending; this pointer does not accept private caching or advance runtime delivery. Current work remains selected by the execution tracker.
