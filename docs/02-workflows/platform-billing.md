# AcademyOS subscriptions, entitlements and platform payments

## Current planning integration —7 November 2026

The [canonical master plan v2](../06-delivery/master-plan-v2/README.md) and [finance simplification specification](../06-delivery/master-plan-v2/finance-simplification-and-control.md) govern current delivery. Provide a complete separate Platform business journey for academy plans, platform invoices, required proof/provider reconciliation, restrictions and recovery. Keep canonical controls and three money boundaries; simplify legacy ceremony without inventing commercial rules or treating tenant-private content as Platform access.

## Local-data planning boundary —LF-v2,2November2026

A future locally retained monthly platform-billing view remains separate from family finance and trainer compensation. Current provider/ledger facts and payment authority are server-only; no offline purchase, subscription activation, refund or entitlement approval follows from cached data. See [the canonical plan](../06-delivery/local-data-and-sync-plan.md). Current implementation/evidence and earlier business approvals are unchanged.

Requirements: AO-073–084. D-009 governs pricing, limits, trials and grace. D-010 governs provider and merchant eligibility. This domain is NAHR charging an academy for AcademyOS, with separate records from family fees.

## Catalog and entitlement authority

Version the product catalog: plan, price, currency, billing interval, included capabilities, quotas, effective dates and grandfathering policy. A tenant subscription references the accepted catalog version and records trial/active/past-due/restricted/cancelled states according to approved rules. Do not encode customer permissions in editable display labels.

Calculate effective entitlements from the authoritative subscription, overrides with expiry and usage. Owners and managers need the same operational entitlement answer for their academy; a helper that only accepts owners can incorrectly block managers. Permission and entitlement are separate checks: an entitled academy does not make every member a financial administrator.

When restricted, distinguish allowed recovery operations, billing access, data export and read-only historical access from blocked creation. D-009 defines these explicitly. Never delete tenant data merely because a subscription expired. Quota checks use transactional enforcement where concurrent requests could exceed a limit.

## Signup, upgrade and cancellation

The authorized owner reviews price, currency, interval, effective date and service limits before a subscription change. Tax and proration behavior require approved business policy. The server creates the intended change using the catalog version; the client cannot send an arbitrary price.

Online changes remain pending until verified provider state and internal subscription transition agree. Manual pilot activation is possible only through an audited platform action with reason, actor, effective dates and expiry. The UI must identify a manual override so it is not mistaken for a settled subscription payment.

Cancellation records requested time, effective end and retention/recovery behavior. Downgrades preview excess users/branches/features and define how existing records remain accessible. A plan downgrade should not silently truncate academy history or discard queued work.

## Manual proof workflow

If manual subscription payment is selected, the owner creates a payment claim tied to an issued platform invoice, amount, currency and reference. Upload proof through a private staged upload with a server-generated object path. The file must be verified/finalized before review. An abandoned upload is cleaned by a tracked orphan job.

Claim states: draft → submitted → under review → accepted or rejected; accepted claims may later have a separate reversal/dispute workflow. Approval verifies invoice, merchant/account destination, amount, currency, duplicate bank reference and proof ownership. A proof is supporting evidence, not automatic settlement.

The idempotency key binds actor, academy, invoice and payload hash. It cannot collide with an unrelated existing payment and return success. Approval applies payment allocation, invoice state and entitlement consequence atomically, with audit and outbox entries. Rejection includes a useful reason and a controlled resubmission path.

## Provider and reconciliation workflow

Use verified signatures, current/rotated endpoint secrets, event deduplication and event-to-operation mapping. Check live/test mode, merchant and immutable provider references. A webhook arriving twice or after a manual refresh cannot extend a subscription twice. When provider payment succeeded but the database update failed, a reconciliation process identifies and completes the missing internal transition.

A daily platform reconciliation compares invoices, settled provider transactions, internal allocations, refunds and entitlement changes. Exceptions have owners and resolution receipts. Do not combine academy family collections with NAHR subscription revenue in the same ledger view.

## Platform administration

Platform admins see tenant health, plan/version, usage, invoice history and support cases with minimum necessary personal information. They can make approved catalog/entitlement changes, but cannot silently become tenant owners. Maintenance controls have one shared authority policy across UI, API and database. Product audit screens must exist and show real events before being listed as available.

## Acceptance

Verify owner and manager operational access, expired trial transitions, duplicate proof submission, invalid file ownership, rejected proof resubmission, concurrent approval, unrelated idempotency collision, wrong currency/provider mode, lost webhook response, entitlement cache invalidation and cancelled subscription recovery. Test the exact read-only/restricted actions agreed in D-009, including exports and guardian access.
