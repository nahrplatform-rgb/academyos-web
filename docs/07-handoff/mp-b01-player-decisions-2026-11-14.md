# MP-Q01 Player profile and lifecycle review

14 November 2026 · EX-07 / MP-B01 · Proposal for the Product Owner. The aim is to register a player quickly, find the right person later, and see what the academy needs to do. The [42-field reconciliation](../06-delivery/master-plan-v2/player-field-reconciliation.csv) and [source-reviewed contract](mp-b01-rich-player-contract-2026-11-07.md) retain the individual PYSA inputs and their evidence. The choices below cover the first richer Player workflow.

Today, registration takes one typed display name when the branch is already known. The optional contact is a fictional, unverified email in this environment. The Owner can review possible duplicates and reopen a confirmed profile. Prepared Players contains the name and branch plus their identifiers. Profile editing, archive, restore and importing records require the decisions below. [People implementation](../../apps/web/src/components/people-workspace.tsx) · [Current local dataset](../04-engineering/owner-workspace-dataset-contract.md).

## A · Registration, recognition and contact

| Proposed input | When it helps | Requiredness and audience |
|---|---|---|
| Display name and authorized branch | Find and roster the correct player. Use the branch already selected in the workspace when it is the single permitted choice. | Display name required, in either script. Branch required. Preserve current scoped visibility and registration authority. |
| One alternate full name, PF-001–004 | Find `ليلى عادل` by `Layla Adel` and help the Owner compare people with similar names. | Optional, intended for the Owner’s profile and directory search. Allow the Owner to set or clear it. Keep the original display name visible on rosters. Include the alias only in the encrypted Owner directory projection if the exact MP-Q13 projection is adopted. |
| Date of birth, PF-005 | Check age suitability while placing a player. | Optional, available in the Owner’s profile after registration. Allow the Owner to set or clear it. Connected Owner profile only in this first proposal. Automation and role-specific age-band visibility depend on the later eligibility rules. |
| One operational contact email | Reach the person who handles registration questions. | Optional. Reuse the current unverified contact field, visible to the Owner. Keep the synthetic-email rule in the current trial. An explicit Guardian link or other access follows its own approved workflow. A new contact field or offline copy needs its exact audience and purpose. |

Example. The Owner enters `ليلى عادل` at Main Branch and can save without a birth date or email. A similar name goes to the existing duplicate review. After confirmation, the Owner reopens the profile and can add `Layla Adel`. Under the proposed prepared scope, searching either name still finds the record during a connection loss. A field unavailable on the device is labelled **Available online** / **متاح عند الاتصال**. A checked blank is **Not provided** / **لم يُقدَّم**.

Sport and group belong under **Participation**. A player can train in football and swimming. Each enrollment can show its own group and activity details. Birth-date eligibility thresholds, gender categories, measurements, kit, player number, swimming assessments, and separate sport/group resource assignments follow their owning rules in the field register. For example, a swimmer’s coaching level, a pool booking and a lane assignment are separate facts. This first profile can grow into those sections through MP-Q02/03/19/20.

The default recommendation for nationality, national ID and expiry, player phone, address, education fields, unrestricted staff notes and photos is to keep their individual proposals open until an academy task establishes purpose, authorized readers and retention. All of these still have their original PF rows. Use an export review to choose which approved fields a recipient actually needs. The existing registration and prepared directory require no new export.

## B · Safety and emergency contact

- Give the Owner an optional **Emergency contact** section with a contact name and phone number together, editable and clearable by the Owner. It is a separate purpose from the operational email and the verified Guardian relationship. For the first slice, propose a connected Owner-only view. If Trainers need direct contact for an emergency, select that audience and delivery rule explicitly.
- For coaching, propose an optional **Activity instruction** attached to one participation record with a start and review-through date. The Owner can set, clear or supersede it. An assigned Trainer sees the active instruction on that player’s published session during the assignment. The full profile, emergency contact and retained revisions stay scoped to the Owner. A change of trainer or scope removes the instruction from affected subsequent reads. The default first slice is connected only for these fields. Any prepared safety projection needs its exact scope and freshness under MP-Q13.
- Example. A fictional swim instruction reads **Keep Layla out of the pool today** / **لا تشارك ليلى في السباحة اليوم**. An assigned Trainer sees the instruction alongside Layla’s session row and its end date. A Trainer for another group sees no instruction. Use this representation before considering blood type, raw allergy history or free-form medical notes (PF-033–035). Water confidence (PF-024) is a coaching observation and has its own assessment semantics. PF-025 covers the activity restriction; PF-036–037 cover the emergency contact.

Review the instruction with current roster and date context. Once it expires, omit it from live Trainer action views and keep history subject to the selected retention policy. An absent instruction on a stale or unavailable view gives no clearance. Any real-data retention, age/consent, wider disclosure or export remains in its named decision.

## C · Edit, archive and restore

| Action | Proposed Owner experience and effect |
|---|---|
| Edit | Review the changed fields on the player already open, then save the expected version once. Use duplicate comparison for name changes. A stale save retains the entered changes and shows the current values before another attempt. An interrupted response checks its original ID before a replacement is possible. First writer is connected and uses the current Owner’s academy and branch authority. |
| Archive | Show future commitments, then let the Owner archive when approved pending and future dependencies are clear. Block while an active/future enrollment or dated roster commitment still needs resolution. Preserve the profile, previous rosters, Attendance, Feedback, and existing relationship/access decisions. The default directory and future participant pickers exclude the archived player. The Owner can explicitly find the archived record. |
| Restore | Show the exact record and its preserved history. Restore to eligible selection after a current scoped/version check. A new enrollment, reassigned place, ended link or financial adjustment takes its own action. |

Example. The Owner can archive a former player after the last commitment closes, find them under **Archived** / **مؤرشف**, and still review past marks. The next completed directory sync removes that record from active prepared search. Restore adds it back there through the normal revision path. A future queue for a local Player write needs exact field, version and reconciliation rules under MP-Q13. Import limits and commit/recovery policy remain MP-Q21.

## Decision and build sequence

The Owner can accept or amend **A, B and C independently**. A settles the first optional fields and their audiences. B settles emergency and activity-instruction visibility. C settles the Owner’s new edit, archive and restore commands and their consequences. An amendment can be as specific as “A without date of birth” or “C, but keep archived players searchable by an explicit filter.”

After a decision, show the selected registration → profile → edit → return state in the Operations layout, including EN/AR short and long names, phone and desktop, duplicate review and delayed or failed confirmation. Trace each adopted field through validation, canonical reads/writes and allowed local projections. Confirm with actual role/academy tests and show preservation of the original save and historical records. Existing duplicate, permission, prepared-data and recovery checks remain the baseline. Each open choice holds only its dependent new behavior. [Decision dependencies](../06-delivery/master-plan-v2/decision-dependencies.csv) · [Player action evidence requirements](mp-b01-rich-player-contract-2026-11-07.md#required-evidence).
