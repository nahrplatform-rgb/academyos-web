# Screen catalog and information architecture

Requirements: AO-117–130 and the domain requirements linked from each workflow. Routes below are proposed product contracts; they are not implemented routes. Localized pages use `/{locale}` and academy pages include `/a/{academyId}`. The server validates every context.

## Global and platform screens

| ID | Screen / route concept | Audience | Main content and actions | Required exceptional states |
|---|---|---|---|---|
| S01 | Sign in / sign up | Public, policy limited | Language, authentication, help | Unavailable provider, invalid link, wrong account |
| S02 | Invitation acceptance | Intended recipient | Academy, role, verified identity, accept | Expired, revoked, already redeemed, conflict |
| S03 | Academy and role chooser | Signed-in user | Available memberships, role switch | None, suspended, loading failure |
| S04 | Profile and security | Self | Name, language, theme, sessions, security links | Unverified change, reauthentication |
| S05 | Notification center | Self | Filtered events, read state, preferences | Empty, channel disabled, stale link |
| S06 | Platform overview `/platform` | Platform admin | Tenant health, billing exceptions, jobs | Partial provider outage, restricted support scope |
| S07 | Tenant detail | Platform admin | Subscription, usage, metadata, support | Missing tenant, no private-data permission |
| S08 | Catalog / plan versions | Authorized platform admin | Versioned features, limits, prices | Future version, incompatible downgrade |
| S09 | Platform invoices / proof review | Billing admin | Invoice, proof, verification, approve/reject | Duplicate, pending object, stale approval |
| S10 | Operational jobs / audit | Authorized platform admin | Failed jobs, receipts, audit filters | Unavailable source, retry already running |

## Academy administration

| ID | Screen | Main content and actions | Scope/state details |
|---|---|---|---|
| S11 | Owner workspace | Action queue, today, cash/receivables definitions, alerts | Show data freshness and failed widgets independently |
| S12 | Manager workspace | Today's branch operations, staff coverage, exceptions | No implicit owner-only financial panels |
| S13 | Setup checklist | Actual remaining setup tasks | Links only to available routes; resumable |
| S14 | Academy settings | Name, timezone, language, contacts, policy versions | Effective-date warnings; protected identity fields |
| S15 | Branches and sports | Active/archived directory, create/edit | Missing seed, duplicate, cannot archive referenced future work |
| S16 | People directory | Server search, filters, pagination, scoped columns | Failed query separate from empty; complete export |
| S17 | Player profile | Overview, guardians, enrollment, attendance, published progress, permitted finance | Tabs and fields vary by capability |
| S18 | Add/edit player | Staged form, guardian link, consent, enrollment | Duplicate review, validation, partial invitation |
| S19 | Guardian relationship | Verified link, permissions, history, unlink | Pending verification, disputed authority |
| S20 | Staff directory/profile | Active scope, invitations, credentials, assignments | Incomplete provisioning, revoked QR, private compensation hidden |
| S21 | Roles and invitations | Pending invites, scopes, expire/revoke/change | Last owner, self-escalation, existing identity conflict |

## Operational screens

| ID | Screen | Main task | Key states |
|---|---|---|---|
| S22 | Programs | Find/create program and schedule template | Draft, active, archived, incomplete generation |
| S23 | Calendar | Branch/sport/trainer filters, dated sessions | No sessions, query failure, timezone label |
| S24 | Session detail | Time, roster, trainers, attendance, reschedule/cancel | Full, cancelled, closed, stale version |
| S25 | Schedule/change review | Affected dated sessions and conflicts | Validation unavailable, approved exception |
| S26 | Roster editor | Add/remove recurring or dated players | Concurrent capacity, financial consequence pending |
| S27 | Trainer Today | Next session, roster access, tasks, sync status | Dated-only assignment, no assignment, invalid source |
| S28 | Attendance capture | Large roster controls, scanner/manual entry, saved count | Invalid QR, local unsaved, queued, denied, duplicate |
| S29 | Corrections queue/detail | Before/after, reason, approve/reject | Stale attendance, foreign evidence, failed commit |
| S30 | Offline tray | Per-item queued/saved/conflict/failure | Expired lease, wrong account, storage unavailable |
| S31 | Evaluation draft/review | Metrics, narrative, review/publish | Autosave failure, missing metrics, schema change |
| S32 | Development history | Published narrative and comparable charts | No assessments, incompatible scales, withdrawn version |
| S33 | Private media library | Filtered gallery, batch upload, audience | Partial upload, quarantine, consent denied, cleanup pending |
| S34 | Inventory | Stock/custody, movement, counts | Read failure, concurrent stock, pending return |
| S35 | Support cases | Cases, messages, attachments, owner | Partial attachment, waiting state, private internal note |

## Financial and family screens

| ID | Screen | Audience / task | Critical presentation |
|---|---|---|---|
| S36 | Fee plans and assignments | Authorized finance staff | Effective dates and policy version |
| S37 | Bill generation review | Finance preparer | Frozen scope, expected totals, unresolved items |
| S38 | Family account / bills | Finance or authorized payer | Amount due, settled, unapplied, adjustments, currency |
| S39 | Receipt entry / detail | Authorized collector | Allocation review, receipt ID, unknown outcome recovery |
| S40 | Correction / refund | Requester and approver | Recording correction versus external refund states |
| S41 | Finance reconciliation | Authorized finance role | Exceptions and source references; no false aggregate success |
| S42 | Trainer contract | Owner / permitted preparer | Effective versions, confidential terms |
| S43 | Compensation run | Preparer / owner approver | Calculation evidence and unresolved items |
| S44 | Trainer statement | Trainer self / permitted owner | Earned, approved, paid and outstanding separately |
| S45 | Academy subscription | Owner / authorized billing contact | Current limits, invoices, pending change and recovery |
| S46 | Guardian home | Linked family | Child switcher, next session, published update, authorized due bill |
| S47 | Player home | Policy-eligible player | Own schedule, attendance and published goals |
| S48 | Reports / export jobs | Capability-based | Definitions, full filter scope, as-of time, download expiry |
| S49 | Privacy and consent | Self/guardian/handler as authorized | Purpose-specific consents, request status, retention boundaries |
| S50 | Help and operational status | All signed-in roles | Role-specific guidance, contact path, known service issue |

## Navigation rules

Owner: Workspace; People; Training; Finance; Development; Media; Reports; Support; Settings. Manager sees the permitted subset. Trainer: Today; Sessions; Evaluations; My compensation; Sync; More. Guardian: Home; Children; Schedule; Payments if authorized; Updates; Help. Player: Home; Schedule; Progress; Help. Platform administration uses a separate navigation context and a visible return path.

Use task names users understand. Keep platform billing out of family payment navigation. Hide modules outside the active release/entitlement without pretending they are implemented. Where a future feature is previewed, label it clearly and offer no dead primary action.

Before building each screen, attach its workflow, capability set, query fields, mutations, empty/error/conflict states, mobile/RTL layout and acceptance cases. The catalog is the coverage inventory; it is not a substitute for those contracts.
