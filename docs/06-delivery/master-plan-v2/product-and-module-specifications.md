# Product and module specifications

This is the full-product work specification, not a declaration that all capabilities are implemented or that every legacy field is approved. [Product outcomes and simplicity](product-outcomes-and-simplicity.md) governs the user value of this scope: clearer operations, saved time, control, delegation and a complete separate Platform business. [Domain coverage](domain-coverage.csv), [canonical crosswalk](requirements-crosswalk.csv), [PYSA fields](pysa-fields.csv) and [decision dependencies](decision-dependencies.csv) provide the detailed joins. Existing action contracts and accepted rules remain canonical. New detail follows the [scope-extension register](scope-extensions.csv) before dependent writes. Inventory completeness does not require copying legacy complexity.

## Specification required for every capability

Each implementation packet must identify the user job and applicable `VAL` outcomes, purpose of mandatory steps/fields/reviews, actor/academy/branch/sport and resource scope; entry/destination/return; exact visible controls and copy in EN/AR; data shape and field policy; current/target/source evidence; permission and entitlement; input validation; expected revision; canonical operation and receipt; audit/side effects; local projection/command coverage; loading/empty/dirty/saving/confirmed/pending/unknown/stale/denied/recovery; affected-view invalidation; request/byte budgets; and specific positive/negative acceptance cases. This is a complete action, not a screenshot or a field list.

Each field needs an owner/entity, stable key, label/help, type/unit, required/optional/conditional rule, default source, constraints, view/edit roles, sensitivity and retention/local coverage, source-of-truth mapping, create/edit/import/read/export behavior, version/conflict behavior, downstream uses and a realistic synthetic example. Distinguish an absent value from zero, false, unknown and not applicable. Do not fabricate personal or commercial values to make a dashboard look complete.

## D01 — Identity, context and personal preferences

Global identity is separate from academy membership and domain records. Preserve normal sign-in, invitation acceptance, verified recipient, workspace selection and same-account recovery. One person may have different roles in different academies; dedicated trial accounts remain useful testing contexts, not a permanent one-email/one-role product constraint. Define active account, academy, role/capability and branch context explicitly. Language/theme/preferences belong to their declared scope and do not grant rights.

Journey: sign in/create account as separately labelled entry → invitation/context → permitted landing page → safe role/academy switch → return → sign out. Missing authentication is not ended membership. Wrong-recipient, expired, revoked, pending provisioning, unavailable provider and known account change need exact safe next actions. Preserve original recovery state when sign-in is absent. Client role strings never authorize operations.

## D02 — Academy, branches, sports and resources

Fields: academy display/legal identity where needed, contact/branding, locale, country/currency/timezone, active lifecycle; branches with stable IDs/location/operational status and supported effective timezone; enabled sports with bilingual terminology and versioned field/metric configuration; facilities and allocatable subresources when approved. [Multisport specification](multisport-and-resources.md) governs pools/lanes, pitches/courts and conflict semantics. M1 initial branch/sport setup is a starting slice, not complete administration.

Journey: Owner setup/checklist → configure branch/sport → inspect effect → save → create a usable program → manage/archive with preserved history. Before changing timezone, default branch, enabled sport or resource availability, show affected future operations. Archiving cannot erase past attendance, invoices or evaluations. Configuration revisions must invalidate the projections they actually change. Platform metadata management does not imply tenant-content access.

## D03/D04 — Platform catalog, entitlements and academy billing

Keep platform merchant/ledger separate from family money and trainer earnings. Catalog fields include versioned plan identity, capabilities/limits, currency/cadence, effective interval, trial/grace/restriction definitions and academy assignment. Pricing, tax, grace and provider policy remain named choices. Invoice/proof/payment fields need amount/currency, source invoice, reference, state, reviewer, timestamps, immutable receipt/allocation/reversal and reconciliation result; no private proof URL in a broad directory.

Journey: understandable academy/plan status → effective assignment and billing → the accepted payment/proof route with required review → reconciled entitlement → renewal/restriction recovery → retained history. Expose only mechanisms relevant to the accepted plan/merchant policy. Do not add manual proof review to an already confirmed provider route by default, or remove required proof approval. Payment-provider acknowledgement alone does not set Paid. Reject duplicate proofs, foreign invoices, stale approvals, ambiguous provider outcomes and self-review where policy requires distinct review. Platform home shows authoritative actionable states and permitted operational metadata. Apply [finance simplification](finance-simplification-and-control.md); precise prices/grace/provider choices remain open.

## D05 — Complete Players, families and relationships

The current canonical Player writer accepts fictional `display_name`, explicit initial branch, optional fictional contact and duplicate-review context. It has list/candidates/profile/create/reconcile. A richer Player module must add useful discovery, grouped profiles and complete create/edit/archive/restore/import workflows under reviewed field contracts. Keep the existing no-auto-merge rule and historical identity. Do not silently widen the current endpoint or treat its existing version as accepting every PYSA input.

| Profile section | Candidate useful content | Workflow/authority detail |
|---|---|---|
| Identity | Bilingual names, display policy, birth date/age presentation, nationality and justified identifiers | Common person information separated from login; no assumed child email/account or unjustified identity-document collection |
| Contacts and relationships | Approved contact methods, emergency contact, verified Guardian links and relationship permissions | A typed contact is not a verified Guardian, family payer or permission grant; explain verification/ending/status |
| Participation | Branches, sport/program enrollments, effective intervals, group/level, operational status | One person record versus per-sport enrollment; no global scalar sport assumption; capacity and historical session scope retained |
| Sport detail | Position/number/foot, swimming level/stroke, martial rank/style, racket hand/experience where relevant | Validated sport-specific fields and units; no irrelevant all-sport form or free-text lane as booking authority |
| Relevant safety information | Minimal approved instructions and emergency information | Necessity/view/edit/local policy first; Trainer projection contains only approved session-needed instructions |
| Measurements/equipment | Height/weight with units and observation date; kit sizes if operationally useful | Optional/conditional purpose, update history and retention; do not collect by default because legacy has fields |
| Activity and history | Scheduled sessions, attendance, published development and changes | Distinct authoritative modules, not duplicate editable copies in a profile |
| Finance | Permitted plan/bill/receipt/balance context | Future finance authority; never infer balance from attendance or locally queued payment |
| Documents/media/consent | Scoped references and consent versions if accepted | Private artifacts and explicit download policy; not automatic bulk local download |

The [reference field inventory](pysa-fields.csv) records exact legacy keys and whether evidence is UI, payload, schema, action or mapping. Before adoption, trace each selected field through create→validation→mapping→persisted read→edit→import/export→role projection→local/sync→recovery. The legacy disabled session selector and discarded/omitted fields are defects to avoid, not accepted behavior.

Registration should have a small required identity/participation step and appropriate optional/conditional sections. Profile inspection must be useful without opening an edit form. Editing shows changed fields and current revision; archive/restore shows operational and historical consequences. Directory search/filter must cover the permitted dataset, expose incomplete/offline coverage honestly, preserve position and support meaningful sorting. Duplicate comparison shows only authorized candidate information and retains user choices after a failed check.

Imports require versioned template, bounded upload/parse, field/branch/sport/duplicate validation, complete row totals, accepted/rejected/ambiguous preview, selected correction and idempotent commit/outcome discovery. Explicitly decide atomic versus declared per-row outcomes; never silently truncate or claim all rows imported from a first page. No imported row automatically creates login/Guardian access.

## D06 — Staff, appointments and authority lifecycle

Fields: identity/contact, bilingual display, qualifications/specialization where justified, branch/sport scope, role/membership lifecycle, active interval, invitation/delivery/acceptance, assignment and transfer history. Compensation belongs to D11. Current Trainer appointment/ending and published assignment paths are retained; complete Manager/staff profiles and permissions are broader work.

Journey: scoped profile/invitation → verified acceptance → actual permitted daily work → effective transfer/substitution → archive/end with retained history. Show exact role/branch/player/resource scope and rights before consequential changes. Last-owner protection, same-academy joins, stale invitations and audit are mandatory. Enforce authority on every writer/projection, not just sidebar visibility.

## D07 — Training programs, sessions, enrollment and changes

Fields: program identity/branch/sport/timezone, effective date range, weekday-specific time definitions, plan defaults, dated exceptions, resource allocations, assigned Trainer, capacity/roster revisions and publication state. Reuse accepted full-period checked preview and receipt chain; users inspect summary and mandatory exceptions, with access to every date. Preserve all-or-nothing program planning and individual exceptions.

Journey: create details → per-weekday times → automatic bounded checks → summary/exceptions → save draft → assign Trainer/resources/enroll players → compare conflicts → review audience/date counts → publish → Trainer/family discovery → withdraw → move/cancel with reason/history. A prepared publication job is not a published result. Unknown jobs/saves resume from the original identity. Accepted one-date move/cancel does not authorize automatic makeup, fees or messages. Attendance protections must be checked by every schedule/roster writer.

Calendar modes share date/branch/sport/trainer/resource filters, exact record selection and return context. Group simultaneous sessions without merging their rosters. Server requests retain current42-day/50-summary bounds and complete pagination; a locally prepared month has separately checked coverage. Whole-program review uses40-date fixtures and concurrent/stale/withdrawal cases. Resource allocation and broader recurrence/substitution/waitlist/makeup policies remain scoped extensions, not unreviewed side effects.

## D08/D09 — Attendance, QR, corrections and durable work

Retain the accepted current rules: explicit Present/Absent; Unmarked never Absent; recording window and Owner correction reason/history; different-account correction-request review; revocable/replaced QR cards; unique eligible-session capture and ambiguity selection; repeated scan does not duplicate or replace Absent. Preserve the approved all-or-nothing register and version checks.

Journey: correct assigned session →18-player roster → direct labelled choices → register review → canonical save or approved durable local save → current result → correction/history → reopen/reconnect. Retain search/filter, selected player, scroll and dirty input. History is a secondary read, clean resume is a checking state, actual denial masks, 401 is missing sign-in, and unknown originals block replacement. Exact initial/post-save gaps remain tracked. Staff attendance, late/excused/checkout and expanded role offline capture require their own accepted rules; they are not completed by player Present/Absent.

Local acknowledgement and server confirmation are distinct. Keep the same original operation on timeout/retry/restart; replay through the canonical signed gateway with current scope/version/deadline checks. Preserve all-or-nothing behavior on sync conflict and protected same-account recovery after logout/cleanup. See [local/sync specification](local-data-sync-and-pwa.md), not a universal timestamp-wins queue.

## D10 — Family fees, billing and payments

Required outcomes are understandable charges, receipt/allocation correctness, the correct outstanding amount, recoverable corrections and complete history. The full canonical scope includes effective fee versions, payer/player/enrollment association, charge source, currency/rounding, bill items, receipts, allocation, reversals/refunds and reconciliation. Select the simplest accepted mechanism for each; do not expose every legacy option as mandatory first-release work. Preserve financial snapshots, operating effective time, capture time and server receipt separately. Current finance prototypes/legacy forms are not an AcademyOS ledger. The [finance specification](finance-simplification-and-control.md) maps concrete legacy defects and the decisions that still control calculations and money movement.

Journey: clear family statement → agreed fee/charge source → receive payment once → reconciled current balance → source-linked correction when needed. Generation, allocation and required checks run through canonical operations underneath understandable progress; users do not manually reconstruct the ledger. Decide D-005–007/010 before dependent calculations. Support duplicates, partial payments/allocations, lost reply, two-device writes, archived participants, failed provider acknowledgements and complete statement export. Guardian visibility is an explicit approved payer/child projection. Finance local reads and offline-capable drafts must not mark an unconfirmed payment settled or let local clocks rewrite ledger history.

## D11 — Trainer contracts, earnings and payout

Fields: effective contract/version/currency/rate basis, qualifying session/attendance/substitution evidence, earning line source, period/rounding, exception request, reviewer/delegation, approval and payout/reference. Decide D-008 and applicable access before calculations; legacy formulas are reference examples only.

Journey: explained earning statement from the effective contract → only actual exceptions and required approval → payout record → retained statement/history. Keep preparation/approval separation and exact canonical review controls; do not invent a review at every technical stage. Freeze historical terms, prevent duplicate accrual/payout and distinguish recomputation from financial correction. Staff attendance and coverage cannot silently generate money unless their accepted contract says so. Offline snapshots retain exact source versions and pending states. Apply [finance simplification](finance-simplification-and-control.md); legacy formula/option parity is not the goal.

## D12 — Development and progression

Retain reviewed narrative strengths/focus/next steps, Trainer draft/submission, Owner return/publication, exact Family preview, withdrawal and immutable successors. Sport metrics need stable IDs/version, bilingual labels, data type/unit/scale/bounds, applicability and review/publication rules. A blank score is not zero; metric-schema changes must not reinterpret old published results.

Journey: session/player context → focused draft → submit → return/revise or publish → Guardian/Player permitted reading → amendment/withdrawal/history. Keep private staff notes and review reasons out of family projections. Future charts define metric, unit, period, denominator and gaps, and offer readable tables. Local staff drafts and published family data have different policy/command scopes. Scores and notifications/export remain explicit expansions.

## D13 — Dashboards, reports and complete exports

Each metric names definition/source, actor/scope, sport/branch/resource filters, period/timezone, as-of/revision, unit, total versus loaded subset and handling of missing data. No failure-as-zero and no invented chart. Home task counts must open exact permitted actionable records. Define reporting snapshots across all eligible pages, artifact expiry/download authorization and resumable export jobs; export must not broaden data fields.

Journey: choose report/period/scope → useful summary → drill to source → filter/compare → complete snapshot/export → reopen or expired-artifact recovery. Check totals against authoritative sources and concurrent updates. Offline reports display preparation/completeness/as-of and keep mutable operational projections separate from immutable statements.

## D14/D17 — Private media, consent and privacy lifecycle

Fields: private object reference, uploader/academy, player/session tags, consent scope/version, visibility/publication, metadata/type/size, retention/hold, revocation and deletion state. No broad public object URLs or automatic local download because a manifest exists. Explicitly settle child/family authority, sharing, retention and recovery per data class.

Journey: scoped upload → validate/scan if required → tag → consent/visibility review → authorized gallery → revoke/remove → history and permitted recovery. Privacy requests: verified requester/guardian → exact export/deletion scope → holds/authority review → durable per-subsystem outcomes → visible completion/remaining failures. Removing a directory row is not proof of erasure across files, replicas, jobs and backups. Privacy work accompanies earlier domains before real personal data; it is not postponed wholesale to a final batch.

## D15/D16 — Support, inbox, notifications and communications

Fields: ticket/thread/message, participants/capabilities, academy/branch/child audience, subject/body, attachment references, consent/preferences, delivery channel/provider reference, queued/sent/delivered/failed status, attempts and idempotency. Keep support/internal notes separate from academy broadcasts and family notifications. Provider acknowledgement is not recipient reading or successful business action.

Journey: choose recipients by current authority → compose/review exact audience → submit once → durable outbox → delivery/partial failure → retry eligible original recipients → retained history; support adds scoped reply/resolve/reopen. Revalidate Guardian links and preferences at send time. Do not add external messages, marketing or paid channels merely by documenting them. SMS/WhatsApp/push and quiet/emergency rules remain specific decisions. Offline drafts may be a future typed capability; actual external delivery requires connection and current authority.

## D18/D20 — Jobs, services, recovery and engineering operations

Reuse durable operations, bounded jobs/outbox leases, retry/fencing/dead-letter states and signed callbacks where existing. Each job must expose scope, original ID, progress/completeness, attempt/lease, terminal outcome, side effects and recovery; a client counter is not server completion. Provider secrets and backup authority stay separate from public telemetry.

Platform diagnostics are redacted and provenance-based: service/configuration presence, health/freshness/impact, observed versus estimated quota/cost, incidents and restore evidence. Define no-op/read-only inspection separately from privileged repair/purchase/restore. Preserve public-repository safety, pinned unprivileged PR checks, existing backup separation and Owner-only promotions. Actual plan meters and percentile targets require dated measurements; no billing purchase or hosted load experiment is authorized here.

## D19 — Complete experience across all roles/platforms

Apply [the redesign specification](ui-ux-and-redesign.md) and [working-behavior contract](../../03-design/academy-working-behavior-contract.md) to every implemented and new journey, including online-only work. A visible menu item must have a permitted meaningful destination; planned features are labelled future and cannot appear as inert completed functionality. Keep title/breadcrumb/context, primary action, return path and saved/pending status coherent across the role day.

## D21 — Inventory and stock movements

Fields: item/unit/category, branch/location, quantities derived from movement sources, movement type/amount, reason/reference, actor/effective timestamp/version, minimum threshold and operational status. Decide basic stock versus valuation/purchasing accounting under D-017. No guessed price or negative-stock policy.

Journey: receive → transfer/adjust with exact before/after → atomic movement → current quantity → low-stock/source history → correction. Foreign branches, stale concurrent adjustments, retries and interrupted transfers must not split movement/quantity. Offline count drafts and synced movements need a typed domain contract; a generic last-write-wins quantity destroys auditability.

## Module completion and integration

Each relevant batch delivers useful functionality, Operations UI, tenant/sport context, data loading/local behavior and recovery together. Verify a complete operating journey at the batch checkpoint, with focused boundary tests during edits. Preserve unbuilt scope in the catalog even when a narrow release ships first. Use real accepted rules; prepare focused choices only where genuinely new behavior blocks its dependent command. No plan row or plugin substitutes for acceptance.
