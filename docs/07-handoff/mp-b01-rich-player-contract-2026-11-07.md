# MP-B01 rich Player field, action and difference packet

7 November 2026. Prepared under **MP-B01 — Complete the Owner working day** for [decision MP-Q01](../06-delivery/master-plan-v2/decision-dependencies.csv). This packet **implements no new Player field, writer, permission or local projection.** It inventories the legacy Player detail through the [PYSA field map](../06-delivery/master-plan-v2/pysa-fields.csv)/[field adoption map](../06-delivery/master-plan-v2/field-adoption-map.csv), states the exact current AcademyOS contract, proposes one grouped profile and minimum-input create, and asks only the questions that block a dependent command.

Trace: D05; J06; IMP-J06-A01/A02; AO-013/016/023/118; AT counterparts; NR07/NR14/NR15; WB-02/05/09/10/11/12/20/23; WD-58/60/62/68–71. Outcomes: **VAL-01** (understand today and the next action), **VAL-02** (record once and find a useful player profile), **VAL-09** (keep working smoothly through connection/application changes). Legacy Player rows are PF-001–PF-042 ([capability adoption](../06-delivery/master-plan-v2/pysa-adoption-map.csv)). Reference source is read-only; field presence in PYSA is evidence of a legacy input, not accepted AcademyOS policy.

## Current implemented contract (verified in source)

| Layer | Exact current behavior | Source |
|---|---|---|
| Create input | `display_name` (required, ≤160, whitespace-normalized), `contact_email` (optional, must match `@example.invalid` in this fictional slice), branch taken from the loaded academy context | [people.ts](../../apps/web/src/lib/people.ts); `i2_register_v1` in [i2a migration](../../supabase/migrations/20261024100827_i2a_synthetic_player_registration.sql) |
| Create guards | Actor must be the current Academy Owner; branch must be the academy's setup branch; duplicate-name review with `reviewed_revision` + explicit `different_person`; idempotent `op` receipt; `player.register` audit; no auto-merge | same migration; [duplicate review](../../apps/web/src/components/people-workspace.tsx) |
| List | Bounded page of 25 (`display_name`, `branch_name`, `created_at`), prefix search ≥2 characters, same-academy rows only | `i2_people_v1` |
| Profile | `display_name`, `branch_name`, `contact_email`, `version`, `created_at` — one online read per profile open | `i2_profile_v1` |
| Edit / archive / restore / import | **Not implemented.** No update command, no status column in the projection, no import path | — |
| Unknown outcome | Original `op` retained in tab storage, `i2_operation_v1` reconcile, no replacement create; a confirmed save with a failed follow-up read stays confirmed | people-workspace; [i2a contract] |
| Prepared device | Directory rows are `id`, `display_name`, `branch_id`, `branch_name` only; the rich profile is an **online** read; `field_epoch = 1` and exact-field codec checks reject widened rows | [codec](../../apps/web/src/lib/local-workspace-codec.ts); [workspace key contract](../../supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql) |
| Localized | EN/AR labels; profile is a list-attached inspector pane, so returning does not lose the directory | people-workspace |

Consequences worth stating plainly: the Owner can register a fictional player and inspect one saved profile, but **cannot correct a misspelt name, move a player between branches, add a second contact, or retire a player** without a new writer. That is the real gap; adding columns without an edit path would not close it.

## Proposed grouped Player profile

Presentation follows the [Operations contract](../03-design/operations-design-reference.md): row selection updates the inspector without moving the list, groups are labelled sections, and consequential actions are explicit. Groups below are a **proposal for decision**, not accepted fields.

| Group | Fields | Create | Profile | Edit | Why it earns its place |
|---|---|---|---|---|---|
| Identity | Display name EN (required, ≤160); display name AR (optional, ≤160) | Required / optional | Yes | Yes | Recognising one child among 18 on a register, in the language the Owner reads. Arabic name is what Arabic staff recognise; an English-only record forces transliteration errors. |
| Identity | Date of birth | Optional | Yes | Yes | Age band and safety decisions; avoids asking staff to compute age. Optional at create keeps a live registration to one required field. |
| Identity | Gender | Optional, only if a group rule needs it | Yes | Yes | Only justified once MP-B02 group/allocation rules exist. Otherwise it adds a sensitive attribute with no operational use. |
| Identity | Photo | Deferred to MP-B10 | Placeholder | Deferred | Media needs consent, retention and lifecycle decisions (MP-B10). Not a profile-writer field now. |
| Identity | National ID / ID expiry / nationality | **Not collected by default** | No | No | High-sensitivity identifier with no day-of operating need. If a federation/registration requirement arrives, it needs its own purpose, masking, view scope and audit decision (PF-010/011/009). |
| Placement | Branch (required); sport participation; group/squad; start date; end date | Branch required; start date defaults to today | Yes | Branch by separate consequential command | Branch is already required for scoped rows and roster references (AO-023). Sport/group need the multisport and resource rules from MP-B02; enrollment end date is produced by archive, not typed at create. |
| Contacts | Guardian contact email (optional, unverified) | Optional | Yes | Yes | Operational contact without granting access (existing rule). |
| Contacts | Guardian contact phone | Optional | Yes | Yes | The number a trainer actually calls; needs a decision because it is stored private data and must not imply SMS capability. |
| Contacts | Emergency contact name + phone | Optional at create, prompted for active players | Yes | Yes | Safety duty. Optional keeps a first registration to one field; the profile shows a completion prompt instead of a hard block. |
| Contacts | Player phone, address | Not collected now | No | No | A child may have no phone; address has no operating use in this slice (PF-012/013). |
| Sport | Typed per-sport attribute schema (e.g. football position/dominant foot/number; swimming level/stroke/lane group; martial-arts rank/style; racket hand/level) | Optional | Yes, typed | Yes | Multisport requires different fields, not one generic column set (PF-018–029). Rendering is driven by the academy's sport schema, not per-sport hardcoding. |
| Sport | Height / weight with unit and measured date | Optional | Yes | Yes | Only meaningful with a date and unit; free text would corrupt development metrics (PF-016/017). |
| Safety | Allergy / restriction **flag**; blood type; medical notes | Optional | Flag always; detail behind an explicit reveal | Yes, with audit | A trainer must know a child has a restriction before a session; the detail is sensitive and should not sit in the default profile projection (PF-033–035, FND-0014). |
| Kit | Jersey/shorts/socks size | Optional, non-swimming | Yes | Yes | Equipment ordering; low sensitivity, cheap to store (PF-030–032). |
| Notes | Internal staff notes; enrollment status | Status yes; free notes **deferred** | Yes | Archive/restore only | Status is needed to retire a player without deleting history. Free-form internal notes duplicate development feedback and create a private narrative with unclear retention. |

### Minimum input and reduced Owner effort

- **One required field to register** (display name) plus an already-selected branch. Arabic name, date of birth and every contact/safety field stay optional and can be completed from the profile later.
- Grouped profile answers "who is this child and what do I need before the session" in one place instead of a flat 40-field form.
- A safety flag on the row means the Owner does not reopen every profile before a session.
- No field is added merely because PYSA had it: national ID, address, player phone, free internal notes and photo are explicitly **not** adopted in this slice.

## Actions and differences

| Action | Current | Proposed minimum | Consequence boundary |
|---|---|---|---|
| Create | Name + optional contact, duplicate review, receipt, audit | Same fields plus the optional groups chosen above | Keep idempotent `op`, duplicate review, no auto-merge |
| Edit | Absent | Correct allowed fields on one player; save with expected `version` | Renaming into an existing normalized name needs the same duplicate confirmation; unknown outcome keeps its original `op`; no partial write |
| Archive | Absent | Status change with reason; row stays readable in history | Never delete roster/attendance/development history; archived players stay visible to permitted staff filters |
| Restore | Absent | Reverse an archive with a new version | Restored player must not silently reacquire training slots that were reassigned |
| Import | Absent | Bounded file with preview and per-row result | Decide all-or-none versus partial-with-report; no silent duplicates; no import into the branch of another academy |

Every proposed write keeps the current pattern: caller-bound server authority, expected version, atomic receipt keyed by the original operation ID, audit event, and unknown-outcome reconciliation before replacement.

## Field-level decisions requested (MP-Q01)

Answer with a choice letter per question; each answer unblocks only its dependent writer.

1. **Names.** (a) Keep one display name plus optional Arabic display name *(recommended)*, or (b) split first/last in each language as PYSA does. Splitting multiplies required input and validation; (a) matches how staff say a child's name.
2. **Date of birth.** (a) Optional, shown on the profile *(recommended)*; (b) required at create; (c) not collected. This is the first genuinely new identity field and needs its view scope (staff roles) and local-inclusion answer before implementation.
3. **Gender.** (a) Defer until group rules exist *(recommended)*; (b) collect now; (c) collect only when the academy's sport/group config uses it.
4. **Contacts.** Which of guardian phone and emergency contact (name + phone) are adopted, and are they optional or prompted? Recommendation: both optional at create, prompted on the profile; no SMS/call capability implied.
5. **Safety fields.** (a) Flag-only projection with detail behind an audited reveal *(recommended)*; (b) full detail in the ordinary profile for Owner/Manager only; (c) detail visible to every permitted role. Also state whether reading medical detail is audited.
6. **Sport attributes.** Confirm the per-sport schema set for the sports enabled at this academy, and whether an attribute is required for an active player. Recommendation: optional, typed, defined by the sport schema in MP-B02.
7. **Archive/restore.** Confirm archive reasons, who may archive (Owner only or Owner + Manager), whether archived players stay in prepared directory data, and whether archive is refused while an unresolved original or open correction exists. Recommendation: Owner-only in this batch, archived rows excluded from the default directory but retained and searchable by staff.
8. **Import.** Confirm whether import is in scope for MP-B01/MP-B02, and whether a failed row cancels the whole file. Recommendation: defer import to MP-B02 with all-or-none validation and a preview.
9. **Local projection.** Recommendation: **keep the prepared people dataset minimal** (id, name, branch) and keep the rich profile an online read. Widening the encrypted dataset would require a `field_epoch` bump, a codec change and an LF-P02 field decision; it is not needed for the first useful Owner day.
10. **Edit authorization.** Confirm Owner-only editing in this batch or Owner + Manager (needs the Manager role definition from MP-B02). Recommendation: Owner-only until Manager authority is decided.

## Verification plan once decided

Adversarial and continuity cases to add with the dependent writer — no case is claimed passed here:

1. Create with only a name; optional groups absent; profile shows unknown, not blank-zero.
2. Create duplicate name → review; rename into an existing normalized name → explicit confirmation or refusal; no auto-merge.
3. Edit with a stale `version` → conflict, current values shown, no partial write.
4. Edit with a lost reply → unknown outcome with the original `op`; reconcile finds the committed value; no second write.
5. Edit while a second tab holds the same player → one commit, other tab refreshes to the committed version.
6. Archive → player leaves the default directory, history and past registers stay readable; restore → new version, no automatic schedule reassignment.
7. Branch move with committed attendance → past attendance keeps its branch; no historical rewrite.
8. Safety detail reveal → audited, denied for a role without the permission, and absent from the prepared directory projection.
9. EN/AR, 320/390/1440, RTL labels and long names; focus and scroll retained after edit and archive.
10. Prepared device: a rich-field edit does not corrupt the minimal prepared row or break the exact-field codec; offline edit stays unavailable unless an offline field policy is accepted.

## Boundaries and status

No migration, endpoint, component, field or permission changed by this packet. It answers **what the Owner must decide**, not what has been approved. Independent human security review remains deferred and nonblocking and is not performed here. Production, real-child data, paid commitments and Owner-only promotions are untouched. The current minimal writer, its duplicate review, its original-operation recovery and the prepared minimal directory remain the working contract until a decision above is recorded and its dependent implementation is checked end to end.
