# Full scope and proposed release map

## Persistent local data and synchronization — LF-v2,2November2026

Persistent permitted read datasets/reopen and synchronization are cross-cutting core experience work through EX-10/06/04/11, not deferred wholesale to native apps. [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md). Offline mutation queues remain capability-specific later gates; unbuilt finance/communications/media/Manager/Player features and existing release boundaries are preserved.

Version 1.0 · 21 October 2026 · Delivery placement: proposed, pending D-018

## Release meanings

- **F0 Foundation**: identity, tenancy, permissions, schema, service connectivity, localization and design infrastructure.
- **P1 Operational pilot**: real academy setup, people, programs, dated sessions, attendance and basic family visibility. Synthetic finance until its policies and contracts are accepted.
- **R1 Commercial web release**: complete agreed operating/financial journeys, permissions, privacy, reporting, recovery and provider proof.
- **R2 Required expansion**: advanced operations and channels retained in full scope, with explicit later delivery.
- **N1 Native**: iOS/Android after stable web and API acceptance. Optional desktop remains a decision.

## Complete domain reconciliation

| Domain | Required capability | Proposed placement | Important boundary |
|---|---|---|---|
| D01 Identity | Sign-in/out, invitations, recovery, multi-academy selection, role switching, suspension, membership revocation | F0 | No global identity mutation for academy-local actions |
| D02 Academy | Onboarding, settings, branches, sports, operating timezone/currency, branding, archive/default branch | F0/P1 | Related records must belong to the same academy |
| D03 Platform plans | Plan catalog, versions, assignments, entitlements, trials, restrictions and commercial recovery | F0 model/R1 | Entitlement is separate from authorization and feature readiness |
| D04 Platform billing | Academy invoices, payment sessions, manual proof, review, allocations, reversals and settlement | R1 | Separate platform merchant and ledger |
| D05 Players/families | Registration, import, guardian links, sibling/family payer model, archive/restore, portal provisioning | P1/R1 | Guardians see only authorized child projections |
| D06 Staff | Staff profiles, branches, trainer assignments, role lifecycle, staff QR and transfers | P1/R1 | Compensation and private fields require separate access |
| D07 Training schedule | Recurring programs, dated sessions, capacity, waitlists if selected, rosters, substitutions, extra/makeup sessions, cancellations and rescheduling | P1/R1 | Preserve historic sessions and their charges |
| D08 Attendance | Player/staff attendance, late/excused states, checkout, corrections, review and coverage exceptions | P1/R1 | Every approved correction changes the register atomically |
| D09 Offline | Durable attendance queue, explicit pending state, safe reconnect, upgrade, conflict and account switching | R1 | Capture does not imply server acceptance |
| D10 Family finance | Plan versions, assignments, invoices, receipts, allocations, credits, reversals, refunds, projections and provider reconciliation | R1 | Policy decisions D-005 to D-007 and D-010 |
| D11 Trainer compensation | Effective contracts, coverage, earnings generation, exception requests, approval/delegation, payout records | R1 | Never infer payroll law or formulas from old code |
| D12 Development | Sport-specific metrics, draft, review/rejection, publication, revisions and history | P1 basic/R1 complete | Drafts and internal notes remain private |
| D13 Reports | Owner/manager dashboards, period filters, cross-branch views, reconciled totals, complete exports | P1/R1; advanced R2 | One definition per metric; explicit unavailable state |
| D14 Media | Private uploads, member/session tagging, consent, gallery pagination, access expiry, deletion recovery | R1; optional public shares R2 | No public gallery without deliberate scope/consent |
| D15 Support | Tickets, internal threads, attachments, status, notifications, scoped support access | R1 | Support is separate from broadcast messaging |
| D16 Communications | In-app inbox, transactional email, audience selection, preferences, delivery receipts; SMS/WhatsApp/push later | R1/R2 | Consent and current family links checked at send time |
| D17 Privacy | Consent versions, export requests, retention, holds, deletion/anonymization, child/family authority | R1 before real users | Unresolved policies cannot be silently implemented |
| D18 Jobs | Outbox, lease, retries, fencing, dead letters, resumable exports, artifact expiry | F0/P1 | Provider acknowledgement is not a business commit |
| D19 Experience | Role onboarding, valid navigation, complete search, localization, help, loading and recovery states | F0 onward | All six roles receive a complete journey |
| D20 Operations | CI, dependency checks, audit history, monitoring, maintenance, incident response, backup/restore, rollout | F0 onward/R1 full | Documentation and local tests do not establish hosted proof |
| D21 Inventory | Items, quantities, branch location, movements, adjustments, low-stock reporting | R1 basic/R2 advanced | Read failure is not empty stock; valuation scope undecided |

## Deliberately changed legacy patterns

Rebuild identity around global subject plus academy memberships, not a scalar academy field on an account. Rebuild writes around durable operations and canonical transaction boundaries. Use the new role navigation and design system. Do not reproduce hidden or disabled legacy features as apparently functional menu items. Retain their business capabilities in the release map until delivered, replaced by an accepted alternative, or explicitly excluded by the owner.

No business capability is excluded merely because it is difficult. Public gallery, native apps and advanced notifications have a proposed later stage, not an implicit cancellation. Support impersonation and general-purpose accounting are not assumed requirements.

## Scope change process

For a requested change, identify the user outcome, affected domain and requirement IDs, privacy/financial effects, dependencies, proposed stage and acceptance case. Record the decision. Removing a screen does not remove the underlying workflow requirement unless the owner accepts that scope change.

## Complete release versus complete future vision

R1 is complete only against its explicitly agreed scope and release gates. R2/N1 are part of the future product vision and remain planned. Do not market a later feature as available because a concept screen or database table exists.
