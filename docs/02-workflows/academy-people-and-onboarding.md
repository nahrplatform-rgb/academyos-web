# Academy setup, people, guardians and staff

## Persistent local data and synchronization — LF-v2,2November2026

All permitted player-directory summary pages may be prepared progressively and persisted under exact field/branch policy. Profile/contact/history/guardian relationships are separate scopes. Existing duplicate review/no-auto-merge/current invitation authority stay unchanged. See [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md). Existing implemented and future boundaries are unchanged.

Requirements: AO-011–020. Policy dependencies: D-001, D-003, D-004 and D-015.

## Academy creation and first-use checklist

The authorized founder supplies academy name, preferred language, timezone, country, currency, contact details and an initial branch. Country and currency cannot be inferred from the user's browser. A business record does not become an active commercial tenant until the documented onboarding and entitlement conditions are satisfied.

Create academy, owner membership, initial branch and settings in one transaction or a recoverable provisioning operation with explicit steps. Display provisioning in progress until required records exist. Repeating a request cannot create a second academy. If the default branch fails, stop dependent enrollment and show a repair action; never acknowledge an unusable academy as ready.

The checklist links to real available routes: verify academy profile → configure branches/sports → invite staff → define a program → add players/guardian relationships → publish a dated session → complete a trial attendance flow. Optional billing and media steps are labeled optional until their release stage. Save progress from actual records, not only a dismissed checklist flag.

## Branch and sport configuration

A branch has its academy, display name, address/location if needed, timezone override if supported, active interval and operational status. A sport has stable identity, localized label, enabled state and optional evaluation schema. The initial configured sports must be seeded and migration-tested. Creating the first program must not depend on a missing hidden seed.

Archiving a branch or sport preserves historical sessions, bills and evaluations. New assignments to archived records are denied. Moving a branch to another academy is not an ordinary edit. Changes to timezone must have an effective boundary and a preview of future dated-session consequences; historical attendance instants are preserved.

## Player registration

An owner or permitted manager enters only needed information: display/legal name according to policy, birth date or age band when justified, branch, sport/program preferences, guardian contacts, relevant safety instructions and consent references. Validate required fields, duplicates and program eligibility before committing enrollment. A player can exist without a login account; do not require a child to create an email address to participate.

Potential duplicate detection offers a review workflow, not an automatic merge based on a common name. A confirmed merge needs an explicit migration plan for guardians, rosters, attendance, finance and evaluations. Initial release may reject duplicate creation and defer merging to controlled support.

Player lifecycle: draft → active → paused → archived. Pausing or archiving changes future eligibility according to policy; it does not erase attendance or financial history. Deletion follows a separate privacy process. Record membership/program effective dates so a later change does not rewrite earlier participation.

## Controlled import

An authorized operator downloads the current CSV/XLSX template and uploads a file into a private temporary staging area. Parse without executing spreadsheet formulas or macros. Validate schema version, encoding, row count, required fields, dates, branch/sport references, duplicates and guardian-link authority. Display a preview with accepted, rejected and ambiguous rows; never silently truncate the file at a library/page limit.

The operator approves the normalized import intent before committing. Each row receives a stable item key and result reference. Define whether the batch is atomic or intentionally partial; for large batches, partial outcomes must be explicit and resumable. Retrying the same file/intent cannot duplicate players, invitations or enrollment charges. Creating a guardian contact from a spreadsheet does not verify that person's child access. Invitations remain a separate controlled delivery step.

Provide an error report that excludes unnecessary private fields, a completed-row count and reconciliation against the input manifest. Remove temporary files according to the approved retention policy. A reversal/undo is permitted only for records without subsequent business history; otherwise use reviewed corrections, never a blanket delete of imported people.

## Guardian relationships

Represent guardians as people and relationships as separate records: guardian, player, academy, relationship type, verification method, permissions, start/end, approval and consent authority. A phone number typed by staff is not proof that the recipient is allowed to see the child. The invite/confirmation flow verifies identity and records approval.

One guardian may be linked to several children; one child may have multiple guardians with different authority. Family payer status is separate from relationship status. Do not assume every guardian can pay, export all family data, approve media consent or access another guardian's private contact details. D-004 and D-015 define child account and guardian authority rules.

Unlinking is effective immediately for new authorization checks, recipient selection and new signed media links. Preserve the historical relationship and its end reason where retention policy allows. Concurrent unlink and send/export operations revalidate before delivering sensitive content.

## Staff and trainer onboarding

Create a staff profile and its membership link with an explicit operation record. If provider invitation fails after the profile is saved, show “profile created; invitation pending,” with a safe retry. If membership linkage fails, do not present the person as able to sign in.

Staff fields include employment/contact information needed for operations, active branch scope, role and trainer qualifications where applicable. Compensation terms live in the protected contract module, not the general directory response. Transfers use effective dates and one atomic transition for old/new branch assignments. Historical sessions keep their original assignment context.

Staff QR credentials are opaque, revocable identifiers. They are not passwords, authorizations or serialized personal data. A scan must resolve current assignment and permissions on the server, or follow the explicitly limited offline policy. Lost/replaced QR credentials invalidate the earlier identifier.

## Interface and acceptance

Registration uses labeled fields, clear required markers, an error summary linked to invalid inputs, keyboard-accessible selectors, visible save status and a cancel path that handles drafts. Do not rely on clickable decorative cards or color alone. Arabic labels, phone formatting and mixed-direction IDs are tested.

Acceptance cases include duplicate registration, unauthorized branch, archived player, default-branch creation failure, incomplete staff provisioning, repeated transfer, last-owner protection, unverified guardian invitation and immediate access loss after unlinking. Search and export must work across all eligible people, not just the first loaded page. An empty result means a successful query with no matches; a failed query shows a retryable error.

## Accepted synthetic I2a implementation boundary — 24 October 2026

The broad workflow above remains a requirements map. Moamen approved only the [narrow player registration policy and connected design](../06-delivery/i2-people-first-slice-decisions.md): existing Owners, explicit initial branch after setup, fictional display name and optional unverified contact, scoped duplicate review without automatic merge. No guardian access, child login, real data, enrollment or activation. [Implementation and evidence](../07-handoff/i2a-registration-implementation.md) and [scoped traceability](../06-delivery/i2a-registration-traceability.csv) record actual status separately from this wider workflow.
