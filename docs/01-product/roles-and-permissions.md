# Roles, membership and permission contract

Status: proposed implementation contract for the six selected roles. Fine-grained delegation and approval thresholds remain decisions D-003, D-007 and D-021. Requirements: AO-001–010, AO-149–160.

## The authority model

A person signs into an AcademyOS identity, then selects an academy membership and an available role. A person may be an owner in one academy, a trainer in another and a guardian in a third. Each request carries the target academy and resource; the server derives the authenticated person and verifies current database membership, capability, branch scope, resource relationship, commercial entitlement and resource state. A role label in a browser, URL or stale token is never sufficient authority.

The product should explain the active academy and role in the header and account switcher. Switching academy invalidates cached queries, clears the previous academy's screen state and selects a permitted landing page. Offline records remain partitioned by identity and academy and are never silently reassigned. Revoked access blocks subsequent server operations even if the old screen is still open.

## Initial permission matrix

Legend: **Manage** includes only documented operations; **Scoped** requires the named relationship; **Read** excludes restricted fields; **No** is the default. The table is the proposed baseline, not a grant of unrestricted database access.

| Capability | Platform admin | Academy owner | Academy manager | Trainer | Guardian | Player |
|---|---|---|---|---|---|---|
| Platform organizations, catalog, platform invoices | Manage | Own subscription read/request | No by default | No | No | No |
| Academy settings, branches, sports | Support metadata only | Manage | Scoped operational settings | Read relevant | Read relevant | Read relevant |
| Assign owner, manager, financial approvals | No routine tenant grant | Manage with step-up | No | No | No | No |
| People directory | Support metadata only | Manage | Scoped operational fields | Assigned roster fields | Linked children only | Self only |
| Guardian link approval | No | Manage | Delegated operational approval | No | Request/confirm own link | Policy dependent |
| Programs, dated sessions, rosters | No routine access | Manage | Manage within branches | Assigned sessions read | Linked child schedule | Own schedule |
| Attendance capture | No | Manage within policy | Manage within scope | Assigned session | Read child records | Read own records |
| Attendance correction approval | No | Manage | Only explicit delegation | Request correction | Request if policy permits | No by default |
| Family bills, receipts and refunds | Platform billing only | Manage with approvals | Explicit finance capability | No | Authorized payer account | No by default |
| Trainer contracts, payroll runs | No | Manage | Prepare only if delegated | Own approved statement | No | No |
| Payroll approval | No | Owner authority | No by default | No | No | No |
| Evaluation draft and publish | No | Review/manage | Review if delegated | Assigned evaluation scope | Published linked child | Published own |
| Private media | Support access only if approved | Scoped | Scoped | Assigned people/session | Consented linked child | Consented self |
| Academy reports/exports | Platform aggregate only | Scoped complete results | Permission-specific fields | Own/assigned summaries | Own account/children | Own published data |
| Inventory | No | Manage | Scoped manage | Assigned custody/request | No | No |
| Support | Platform queue | Own academy cases | Authorized academy cases | Own cases | Own cases | Own cases |
| Privacy request | Platform processing duties | Academy processing duties | Delegated case work | Own data request | Own/authorized child request | Policy dependent |

## Permissions are capabilities, scopes and fields

Represent permissions as stable names such as `attendance.record`, `attendance.correct.approve`, `family_receipt.record`, `family_refund.approve`, `payroll.prepare`, `payroll.approve`, `evaluation.publish` and `report.export`. Keep these names in one shared catalog and include them in API policy tests. Avoid a generic `isAdmin` bypass.

A delegation records grantor, grantee membership, academy, capability, optional branch/resource scope, limit, start, expiry, reason and revocation. The granting actor must already hold the grantable authority. A delegate cannot expand the delegation, approve their own restricted transaction, or retain access after the membership is suspended. D-003 determines which delegations ship initially; the architecture must not make a future delegation impossible.

Field-level examples:

- Trainers receive a player's display name, attendance context and approved safety instructions needed for the session. They do not receive family balances, guardian identity documents, private billing notes or unrelated medical details.
- Guardians receive only currently linked, authorized children and the applicable published records. A historical or soft-unlinked relationship cannot authorize new media links, notifications or exports.
- Managers cannot retrieve all payroll columns through a general profile endpoint simply because they can edit a staff phone number.
- Platform administration does not automatically expose tenant child records. Operational diagnostics use identifiers and redacted metadata. Any later support access needs the D-021 policy, purpose, duration, visible notice and audit trail.

## Permission evaluation order

1. Validate authenticated identity, issuer, audience/origin constraints and current account state.
2. Resolve current active membership from PostgreSQL. Reject academy mismatches without disclosing whether the foreign record exists.
3. Resolve capability and branch/resource relationships, including current guardian links and dated trainer assignments.
4. Resolve entitlement and lifecycle restrictions. Distinguish commercial restriction from permission denial in safe user-facing messages.
5. Validate the operation's business state and expected record version.
6. Commit the authorized transition and audit event together. Apply database protection even when the UI already hid the action.

Read, insert, update, delete, RPC, export, storage-link issuance, background execution and direct API requests all need equivalent authorization. An alternative endpoint is not an exception. A job captures the initiating authority for evidence and rechecks the authority needed at execution time; a revoked user cannot rely on an old queued request to obtain a fresh export.

## Acceptance examples

- An owner of Academy A cannot read or change a valid record ID from Academy B through any API, SQL-facing endpoint, export or object URL creation flow.
- A manager who can prepare payroll cannot approve it by calling the endpoint directly.
- Removing a trainer assignment blocks the next attendance write without requiring logout.
- An unlinked guardian loses access to new reads, exports and notification targeting; the test records any bounded lifetime of previously issued download links.
- Switching from owner to guardian changes the navigation and data response fields, not merely the page heading.
- A platform support user cannot create a tenant-owner membership through an account-management helper.

Evidence must include positive and negative tests with two academies, two branches, multiple simultaneous roles, suspended memberships and stale sessions.

## Platform Owner clarification

Moamen is the accountable **Platform Owner**, distinct from an Academy Owner. This is the owner tier of platform administration, not a seventh tenant role or an implemented permission grant. The [Services & Operations vision](../03-design/platform-owner-services-and-operations.md) defines its planned operational/billing visibility, controlled actions and acceptance boundaries. Explicit audited provisioning and server/database authorization are required; signup grants no platform authority.
