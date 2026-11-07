# MP-B01 Player field, action and difference packet

7 November 2026. Coordinator revision after review of DeepSeek commit `bcb1a78`. The original proposal remains in Git history; [the review receipt](deepseek-bcb1a78-review-2026-11-07.md) records corrections. This packet selects no new business rule and implements no field, writer, permission or local projection. Trace: EX-07 / MP-B01, D05, J06, IMP-J06-A01/A02, AO-013/016/023/118 and VAL-01/02/09. Existing accepted rules remain.

## Current working contract

| Layer | Verified behavior | Source |
|---|---|---|
| Create | One required Unicode `display_name`, up to160 characters, whitespace normalized; optional fictional `contact_email`; branch from loaded initial setup | [parser](../../apps/web/src/lib/people.ts), [SQL](../../supabase/migrations/20261024100827_i2a_synthetic_player_registration.sql) |
| Names | No English/Latin-only restriction; no structured first/last or Arabic alias fields in this writer | Same parser/SQL |
| Contact | Unverified contact string; no verified Guardian relationship, family payer or access grant follows | SQL and [People UI](../../apps/web/src/components/people-workspace.tsx) |
| Guards | Current Academy Owner; correct initial branch; duplicate revision/different-person review; original save ID; atomic receipt/audit; no auto-merge | `i2_register_v1` |
| Directory | Bounded25-row canonical pages and same-academy name search; prepared directory has its separately complete bounded dataset | `i2_people_v1`, [dataset contract](../04-engineering/owner-workspace-dataset-contract.md) |
| Profile | Canonical ID/name/branch/contact/version/created-at; current full-profile implementation reads online | `i2_profile_v1` |
| Edit/archive/restore/import | Not implemented by this Player slice | Current parser/SQL |
| Prepared fields | ID, display name, branch ID/name, exact codec/epoch1; richer profile not yet replicated | [codec](../../apps/web/src/lib/local-workspace-codec.ts) |
| Unknown save | Retained browser original; reconcile before replacement; confirmed save stays confirmed if its follow-up read fails | People UI and `i2_operation_v1` |

“One field to type” assumes a permitted branch is already selected/configured. Multi-branch selection remains explicit scope. This baseline does not choose a new name structure or permit missing branch authority.

## Every legacy field has a disposition

The [42-row reconciliation](../06-delivery/master-plan-v2/player-field-reconciliation.csv) gives **PF-001–PF-042** individual source keys, purposes, proposed dispositions, groups, create/edit implications, policy dependencies, local targets and remaining evidence. It includes school, grade, water confidence, swimming restrictions and the disabled session selector. No field is silently excluded or approved.

“Investigate” means establish usefulness and the complete safe pipeline. “Adapt” preserves a useful goal under AcademyOS contracts. A deferred mechanism retains its outcome in the named batch. These are proposals, not Owner acceptance. [Original field evidence](../06-delivery/master-plan-v2/pysa-fields.csv) keeps its layer limits and validation defects.

## Proposed profile composition

Use the [Operations reference](../03-design/operations-design-reference.md): useful sections, optional inspector, coherent controls, EN/AR and stable list return. The sections organize future permitted data; they do not require everything at registration.

| Section | Candidate content and purpose | Boundary |
|---|---|---|
| Recognition | Current display name; chosen bilingual/structured representation; justified birth/identity context | Players can be adults or minors. No assumed child status, legal age or mandatory English name |
| Participation | Branch, sport enrollments/groups, status and effective intervals | Player archive, enrollment end and account/link ending are distinct; archive does not automatically supply an end date |
| Relationships/contact | Unverified contact, verified Guardian links, justified emergency methods | Typed contacts grant no access and do not automatically become Trainer-visible |
| Sport | Individually justified football/swimming/martial/racket attributes | Include water confidence/restrictions explicitly; lane-group text is not a lane reservation |
| Safety | Selected necessary instructions and separately justified health fields | A flag can itself be private; server field authority is required; collapsed detail is not authorization |
| Measurements/kit/education | Justified measured values with units/time, equipment and school/grade context | Nationality is not a document number; swimming does not automatically exclude kit; address/phone/school may have a valid purpose |
| Activity/history | Permitted authoritative sessions, attendance, development and financial context | No duplicate editable balances or rewritten histories |
| Media/staff context | Purpose-specific notes and photo lifecycle if selected | Notes are not automatically duplicates of published feedback; photos need consent/retention handling |

Use the smallest justified required set, optional/conditional completion later and useful read-only inspection. Do not add compulsory safety prompts, audited-reveal clicks, universal sport schemas or date defaults without purpose and dependent policy. Current duplicate/confirmation/recovery rules remain.

## Normal local-data direction

The agreed target is the **same useful prepared workspace online and offline**, including permitted rich profiles and supported edits as domains are built. The current minimal directory plus online profile is a baseline, not an accepted permanent limit.

For each selected field, MP-B01 defines its exact role/device projection, freshness/retention and compatible local-schema/revision transition. Version/epoch work is an engineering task; avoiding it does not justify reducing the agreed experience. Never widen the codec silently. Normal sign-in, known-denial fencing, logout/30-day replica cleanup and separately protected originals remain.

New offline commands need exact version, applicable deadline, conflict and recovery semantics. This does not reopen the overall direction or add an unlock ritual. Sensitive fields can have different projections/lifecycles; full-app local adoption is not blanket download of all legacy fields to all roles.

## Focused decisions, not a global stop

The former ten-question list mixed product/privacy choices, engineering work and future scope. Prepare one concrete field-set packet under the following groups. They are pending proposals; each blocks only dependent new behavior. Continue accepted continuity work meanwhile.

| Group | Owner choice to prepare | Engineering work within the settled direction | Blocks |
|---|---|---|---|
| MP-Q01-A Recognition/contact | Exact useful fields, requiredness, name representation, birth/education/contact purpose and read/edit roles | Reuse Unicode name, grouped form, duplicate/recovery controls; give exact examples | Selected new field/writer/projection |
| MP-Q01-B Safety/privacy | Which medical/restriction fields are necessary; who sees them; session context, local inclusion and lifecycle | Minimal server projections; compare flag/instruction without assuming public visibility | Dependent sensitive behavior |
| MP-Q01-C Lifecycle/authority | Who edits/archives/restores; future roster/link/enrollment consequences and retained discovery | Preserve records; separate archive, effective dates and money effects | Affected new command |

MP-Q02/03/19/20 govern new sport/group/resource/metric structures. MP-Q21 governs import commit/error policy before its writer, without blocking unrelated simple work. MP-Q13 names concrete local field/command details, not another vote on whether the app works locally. No Manager power, Guardian visibility, minimum age or fee effect is inferred.

## Complete actions and recovery

| Action | Required contract |
|---|---|
| Create | Exact fields → validation → original → atomic result/audit → correct permitted profile/directory; no discarded inputs |
| Edit | Editable set/clear semantics; expected version; duplicate rename; historical effects; current scope and original reconciliation |
| Archive | Exact eligibility and future effects; retained history; default/archived discovery and prepared removal under chosen policy |
| Restore | New version and explicit future participation; no silent return of reassigned places or ended access |
| Import | Versioned template, bounded complete preview, duplicates/ambiguities, chosen atomic/per-row results and original commit |

For each field trace create → validation → storage → permitted read → edit → import/export → local/sync → clear/history/recovery. A schema or UI control alone does not complete that pipeline.

## Required evidence

Retain nonempty-directory proof and separately test zero-player first registration, real HTTP validation/authority, original-ID replay, committed-but-unavailable reply recovery, stale edit, duplicate rename, scope changes and confirmed/read-failure presentation. Demonstrate selected fields in EN/AR and realistic phone/desktop layouts, including permitted normal-profile reading online/offline. Mark unsupported fields/actions clearly.

This packet/CSV are preparation outputs. No new field or command is implemented or accepted by their existence. External human security review remains deferred/nonblocking/not performed; engineering checks and Owner-only promotion remain.
