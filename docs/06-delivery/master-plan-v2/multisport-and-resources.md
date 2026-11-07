# Multisport terminology, structures and resources

The Owner clarified7 November that multisport includes **different names, fields, structures and workflows**. Pool/lane versus pitch is an example, not a complete difference list or a settled booking policy. This document specifies required planning/engineering coverage; it creates no new database or fee/capacity/safety rule.

## Shared core and explicit variation

Use shared academy/branch identity, people, memberships, dated instants, operation IDs, audit, permissions and common UI primitives. Define typed, versioned sport extensions where meaning differs. A sport selector must not flatten every profile into football fields, and a free-text custom-field bag must not become authoritative scheduling/finance logic. Relevant server validators, projections, local codecs, imports/exports and edits must understand accepted extensions together.

| Dimension | Example football context | Example swimming context | Requirement |
|---|---|---|---|
| Terminology | Pitch, team/squad, position | Pool, lane, class/level/stroke | Bilingual contextual vocabulary; terminology is not identity |
| Resource structure | Facility/pitch and approved bookable areas | Facility/pool and actual allocatable lanes | Stable resource graph and allocation semantics, not a renamed location string |
| Participant attributes | Position, number, dominant foot | Level, stroke, relevant confidence/instruction | Justified conditional fields and units, not every field on every player |
| Organization | Team/squad where used | Ability class/group where used | Decide actual enrollment/group relationships; names alone do not define them |
| Program/session planning | Trainer/space/time/roster | Instructor/pool/lane allocation/time/roster | Current resource, staff, player and capacity checks across concurrent sessions |
| Development | Relevant skill schema | Technique and distance/time schema | Versioned metrics, units/scales and publication/history, no universal numeric score assumption |
| Equipment/operations | Relevant kit/equipment | Relevant kit/pool equipment | Optional domain-backed inputs and stock links only if useful/approved |

Racket sports may need court allocations, preferred hand or experience; martial arts may need mat areas, discipline/style and rank. These are investigation candidates grounded where available in [PYSA fields](pysa-fields.csv); requiredness, rules and authoritative structures are not accepted merely by their presence. New sports need the same template, not a new copy of the application.

## Data and field specification

For each enabled sport record: stable sport ID and academy enablement; bilingual names and terminology revision; compatible common fields; approved sport-specific field schema; optional group/level/progression schema; resource types; session/instructor/participant constraints; metric schema versions/units; reporting dimensions and import/export mappings. Decide who may configure each item and whether changes affect only future records or require reviewed migration.

Player identity belongs to its declared academy domain context; enrollment/participation belongs to sport/program/effective interval. A person participating in several sports must not have conflicting copies of birth date/contact simply because each sport form stores its own person. Cross-academy reuse/sharing is not automatic. Trainer qualifications, availability and assignment are separate records from displayed role terminology. A label such as Coach/Instructor cannot create a new permission role.

Trace all adopted field paths: visible control→client validation→server validator→mapping→storage→projection→edit→import/export→local codec/index→sync→history. Preserve unknown/not-applicable/blank versus zero. Typed units and observation dates accompany measurements. Removing a sport field from a form must not silently delete historic observations. Changing metric schema cannot reinterpret an earlier published evaluation.

## Resource model to specify before implementation

Candidate hierarchy: academy → branch/site → facility → allocatable resource/subresource. The hierarchy is a planning model, not an instruction to migrate current tables now. Specify at least:

- Resource stable identity/type, parent/branch/academy, bilingual display, operational interval/status and configuration revision.
- Whether a resource is exclusive, partitionable or shares an approved capacity; which children represent actual independent allocation.
- Time-bounded allocation of one or several resources to an occurrence, with before/after preview and canonical ownership/version.
- Parent/child interaction: an exclusive whole-pool booking versus lane bookings; whole/partial pitch use only if the academy's policy supports it.
- Overlap rules for resources, Trainers and players, required turnover/buffer if selected, closure/outage, partial allocations and recurring exceptions.
- Supported capacity/eligibility rules, units, conflict explanation and operation atomicity. No invented coaching ratios, health restrictions or age thresholds.
- History, archive/restore, resource rename/reparent consequences, exact future-session impact and loss-of-reply recovery.

Illustrative scenario: if an academy permits shared pool use, one class could reserve lanes1–2 and another lanes3–4 at the same time. Conflict checking must inspect the actual allocations. An exclusive pool reservation may conflict with all its lane bookings. The exact policy and representation must be accepted before that command is implemented. Player `lane_group` text in legacy code is not an allocation lock.

All resources in one operation must belong to the same authorized academy and allowed branch. Reserve allocations/roster/capacity with a coherent transaction or explicit canonical all-or-nothing operation. Do not implement resource checks as an unfenced client preview followed by independent writes. Resolve recurring exceptions and current overrides without dropping assignments. Source lock order and concurrent transfer tests must be reviewed before choosing database locking.

## Scheduling and simultaneous sessions

Review calendars by day/week/month with sport, branch, Trainer, resource and publication filters. Concurrent sessions remain distinct records with their own roster and assignments. Selecting a session opens its exact context and returns to the same period/filter/position. Show changed/cancelled/moved/published states consistently. A sport colour is an aid, not the identity or status.

Checks must cover same resource overlapping, distinct permitted subresources, parent exclusive booking, Trainer overlap, player overlap across sports, archived resource, stale preview, last capacity place, recurrence exception and atomic rollback. Specify both instant boundaries and local timezone/DST behavior. Authoritative instants and IANA zones remain canonical; avoid comparing locale-formatted strings.

QR retains exact eligible-session and roster rules. When one player has multiple eligible concurrent sessions, require an explicit choice; never infer the sport from a card or the first loaded page. Configurable accepted scan margins and recording deadlines remain separate from resource availability.

## UX and configuration ownership

Create forms reveal relevant sport sections; resource selectors expose the real hierarchy and availability. Owner setup previews terminology/field effects before enabling a sport. Trainer Today uses meaningful session/resource labels; Guardian/Player views show only permitted practical details. Reports aggregate only compatible metrics and provide sport-specific dimensions; do not compare meters with points or merge different scales into one chart.

The platform may provide reviewed templates; each academy enables permitted configuration within its authority. Platform-template version and academy override need explicit provenance. Do not silently overwrite academy terminology or old records when a template changes. Sport configuration is tenant data even when relatively static; local download needs its typed field/scope contract.

## Planning and evidence gaps

Current AcademyOS has initial sport/branch and dated training, not a demonstrated full resource/booking administration. The PYSA investigation did not establish a complete first-class lane-allocation model. This new requirement belongs to [scope extensions](scope-extensions.csv) and [MP-B02/03](delivery-batches.csv), linked to existing broad setup/scheduling requirements without relabelling the new detail approved.

Use at least two materially different sports, simultaneous sessions and two academies with different configurations in the acceptance design. Check EN/AR, profile edit/reopen/import, conflicts, local configuration change and old-schema migration. A source sports array, new label or database table cannot establish multisport completion.
