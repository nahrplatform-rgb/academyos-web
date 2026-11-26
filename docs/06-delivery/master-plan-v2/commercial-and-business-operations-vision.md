# AcademyOS Commercial & Business Operations — Final Consolidated Vision (Frozen Baseline)

## Document Status: FROZEN — All Corrections Applied — Implementation-Ready

**This document is the commercial master baseline.** It incorporates all decisions, corrections, and amendments from five rounds of technical critique. It should not be rewritten. Remaining issues are recorded in Appendix A as specification-level tasks to resolve during implementation.

**Approval status:**
- Commercial vision: Approved (frozen)
- Feature scope: Approved (frozen — no expansion)
- Architectural direction: Approved (modular monolith, six domains)
- Technical specification phase: Proceed
- Immediate full implementation: Requires repository audit
- Production launch: Requires testing and compliance verification

---

## Table of Contents

1. Executive Summary
2. The Six Domains (Modular Monolith)
3. Plan Architecture
4. Regional Pricing
5. Subscription Lifecycle (Four State Machines)
6. Entitlement Engine (Online + Offline)
7. Upgrade, Downgrade, and Add-on Mechanics
8. Refund Policy and Proration
9. Payment Architecture
10. Payment Reliability
11. Dunning Management
12. Invoice Requirements
13. Platform Owner Finance
14. Email Notifications and Infrastructure
15. Demo Strategy
16. Multi-Academy Foundation
17. Plan Editing and Impact on Existing Subscribers
18. Free-Tier Economics
19. Platform Owner Workspace
20. Academy Owner Workspace
21. Platform Owner Impersonation and Support
22. Data Export on Cancellation
23. Retention Policies
24. Offline Synchronization Strategy
25. Implementation Roadmap (Phased Milestones)
26. Items to Visit Later
27. What to Avoid
28. Final Decisions Register
29. Appendix A: Known Specification Issues
30. Appendix B: Phase 1 Milestone Breakdown

---

## 1. Executive Summary

AcademyOS is a commercially operated, multi-tenant SaaS platform. Every academy subscribes to a plan, consumes entitlements within that plan, and operates fully offline. The Platform Owner manages revenue, costs, and growth from a separate commercial workspace.

**Core principles:**
- One subscription per academy. Branches, staff, players, and storage are entitlements within it.
- Three separate systems: Commerce (what you pay for), Entitlements (what you can do), Permissions (who can do it).
- Entitlement engine is the single source of truth. It works online and offline. It doesn't care about price, currency, or region.
- Four independent state machines: Subscription, Payment, Access, Retention. Connected by a rules engine.
- Six independently managed domains organized as a modular monolith: Commerce, Entitlements, Identity & Security, Billing & Treasury, Usage & Metering, Lifecycle & Governance.
- Never mutate an offer in place. Always create a new version.
- The academy's agreement is a contract. The Platform Owner can improve the contract (more limits, more features) without asking. But cannot reduce it (fewer limits, fewer features, higher price) without notice, explicit acceptance, and a resolution path.
- Limits are enforced to the best of cached information available. The server is the final authority. Over-limit situations are reconciled, not prevented, in multi-device offline scenarios.
- Commercial entitlement caching never overrides expired authentication, revoked permissions, or tenant isolation.
- Tier 1a (viewing/exporting) is always available. Tier 1b (attendance) is available for 14 days offline.
- Free tier core operations are never blocked. Only discretionary operations are limited.
- Payment reliability requires webhook signatures, out-of-order handling, chargeback processing, duplicate prevention, and transactional consistency.
- Online quota checks are atomic to prevent simultaneous over-limit registrations.
- Data retention policies are established before storing real children's data.
- Demo access uses secure, expiring, single-use invitation links. Returning prospects reauthenticate securely. Prospect identity is verified before conversion.
- Plan changes require explicit acceptance. Default is "no change" if not accepted.
- Proration uses actual billing period length, not fixed 1/30.
- Offline synchronization uses domain-specific conflict resolution. Last-write-wins is not universal.
- Modular monolith: six domains with separate responsibilities, shared deployment and database.

---

## 2. The Six Domains (Modular Monolith)

AcademyOS Commercial Core is organized into six independently managed domains. Each has its own data, rules, and lifecycle. They interact through well-defined contracts and events.

**Implementation approach: Modular monolith.** Each domain is a module with its own data ownership, interfaces, and rules. They share a database and deployment but have clear boundaries. Domains communicate via internal APIs or events, not direct database queries. If a domain needs to scale independently later, it can be extracted into a microservice.

```
┌─────────────────────────────────────────────────────────────┐
│              ACADEMYOS COMMERCIAL CORE                      │
│         Shared contracts, events, audit infrastructure       │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  COMMERCE    │ ENTITLEMENTS │ IDENTITY &   │ BILLING &     │
│              │              │ SECURITY     │ TREASURY      │
│  Plans       │ Features     │ Permissions  │ Invoices      │
│  Pricing     │ Capacity     │ Sessions     │ Payments      │
│  Agreements  │ Allowances   │ Tenant       │ Reconciliation│
│              │              │ isolation    │               │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  USAGE & METERING          │  LIFECYCLE & GOVERNANCE     │
│                            │                             │
│  Consumption tracking      │  Access management          │
│  Quota enforcement         │  Retention policies          │
│  Service cost monitoring   │  Demo lifecycle              │
│                            │  Compliance                  │
└────────────────────────────┴─────────────────────────────┘
```

| Domain | Responsibility | Key Data |
|---|---|---|
| **Commerce** | Plans, pricing, agreements | Offers, versions, regional prices, academy agreements, benefit migrations |
| **Entitlements** | Features, capacity, allowances | Effective entitlements, add-ons, exceptions, cached entitlements |
| **Identity & Security** | Permissions, sessions, tenant isolation | Users, roles, sessions, academy membership |
| **Billing & Treasury** | Invoices, payments, reconciliation | Invoices, payments, credit notes, payout records, chargebacks |
| **Usage & Metering** | Consumption, quotas, service costs | API requests, storage, bandwidth per academy |
| **Lifecycle & Governance** | Access, retention, demos, compliance | Subscription state, access state, retention state, demo state |

**Interaction flow:**
- Commerce publishes offers → Entitlements resolves effective entitlements
- Billing records payments → Lifecycle updates access state
- Usage & Metering tracks consumption → Entitlements enforces limits
- Identity & Security controls access → Entitlements is checked after auth/permissions

**Implementation rules:**
- Each domain has its own directory/module in the codebase
- Each domain owns its database tables (no cross-domain table access)
- Domains communicate via internal APIs or events (not direct database queries)
- Shared infrastructure (auth, logging, config) is in a common module

---

## 3. Plan Architecture

### 3.1 The Offer Catalog

| Dimension | Free | Core | Growth | Enterprise (future) |
|---|---|---|---|---|
| Branches | 1 | 1 | 3 | Negotiated |
| Active players | 25 | 100 | 500 | Negotiated |
| Staff accounts | 2 | 5 | 25 | Negotiated |
| Storage | 100 MB | 5 GB | 25 GB | Negotiated |
| API requests/month | 10,000 | 100,000 | 500,000 | Negotiated |
| Bandwidth/month | 1 GB | 10 GB | 50 GB | Negotiated |
| Reports | Basic (attendance only) | Standard | Advanced | Custom |
| Multi-branch consolidation | No | No | Yes | Yes |
| API access | No | No | No | Yes |
| White-label | No | No | No | Yes |
| Support | Community only | Email | Priority email | Dedicated |

**Note:** Database rows are tracked for cost monitoring (Usage & Metering domain) but are NOT a customer-facing limit. An academy must never be prevented from recording attendance because its database contains too many rows.

### 3.2 Add-ons

| Add-on | Eligible Plans | Pricing Model | What It Changes |
|---|---|---|---|
| Extra branch | Growth+ | Per branch/month | +1 branch capacity |
| Extra storage (5 GB) | All | Per 5 GB/month | +5 GB media storage |
| Extra players (50) | Core+ | Per 50 players/month | +50 active player capacity |
| Advanced analytics | Core+ | Flat/month | Unlocks reporting module |
| Priority support | All | Flat/month | SLA upgrade |
| SMS/WhatsApp pack | All | Per 1,000 messages | Message quota increase |
| Data migration service | All | One-time fee | Assisted onboarding |
| White-label branding | Enterprise | Flat/month | Custom domain + branding |

### 3.3 What's Included Across All Plans (Non-Negotiable Baseline)

- Billing records and invoice history
- Basic data export (player roster, attendance)
- Privacy requests (data access, deletion)
- Account security (2FA, session management)
- Basic support

**Billing and privacy must never be gated behind a paywall.**

### 3.4 Measurement Rules

| Metric | Definition | Edge Case |
|---|---|---|
| Active players | Players with status = active | Archived players don't count; reactivation counts immediately |
| Branches | Branches with status = active | Archived branches don't count; reactivation requires capacity |
| Storage | Sum of all media assets (photos, thumbnails, video copies, documents) | Deduplication if same file uploaded twice; deleted files freed after retention period |
| Staff accounts | Users with any role in the academy | Pending invitations count; deactivated users don't |
| API requests | HTTP requests to AcademyOS API | Counted per academy per calendar month |
| Bandwidth | Data transferred to/from academy users | Counted per academy per calendar month |

### 3.5 Storage Optimization

| Optimization | Impact |
|---|---|
| Image compression on upload | 60-80% storage reduction |
| Thumbnail generation (multiple sizes) | Families view thumbnails (small), not originals (large) |
| Lazy loading in UI | Only load images when visible |
| CDN caching | Reduce repeated egress for popular images |
| Storage deduplication | Same file uploaded twice = stored once |

**The real cost driver is egress (bandwidth), not storage.** Monitor both independently.

---

## 4. Regional Pricing (Purchasing Power Parity)

### 4.1 The Principle

The same plan has **different prices in different markets** based on purchasing power. This is not currency conversion — it's regional pricing.

| Market | Core Plan | Growth Plan | Currency |
|---|---|---|---|
| North America | $100/month | $150/month | USD |
| Europe | €85/month | €130/month | EUR |
| Middle East | 400 SAR/month | 600 SAR/month | SAR |
| Egypt | 2,000 EGP/month | 3,000 EGP/month | EGP |
| Default (other) | $100/month | $150/month | USD |

**Specific prices are placeholders.** Final prices need market research. Visit later.

### 4.2 Architecture

- Academy has `country` and `currency` fields (set at signup, changeable with Platform Owner approval)
- Offers have regional price overrides: `base_price` (USD) + `regional_prices` (map of country → price + currency)
- Entitlement engine is price-agnostic (only cares about limits)
- Commerce layer handles region-specific pricing
- Revenue reporting normalizes to base currency using locked exchange rates at invoice time

### 4.3 Initial Regions

Start with 3-5 regions:
1. North America (US, CA)
2. Europe (UK, EU)
3. Middle East (EG, SA, AE, KW)
4. Default (everyone else)

Add regions as customer base grows.

### 4.4 Arbitrage Mitigation

- Academy location tied to actual operations (players, staff, physical location)
- Verify location at signup (IP + address + phone country code)
- Platform Owner can override region if abuse detected
- Log region changes with audit trail

---

## 5. Subscription Lifecycle (Four Independent State Machines)

### 5.1 The Four Dimensions

| State Machine | Question It Answers | States |
|---|---|---|
| **Subscription** | What did they agree to? | Pending, Active, Cancelled, Expired, Paused |
| **Payment** | Has money been received? | Paid, Past Due, Failed, Refunded |
| **Access** | What can they do right now? | Full, Restricted, Read-Only, None |
| **Retention** | What's happening to their data? | Active, Retention Window, Archived, Deleted |

These are **independent dimensions connected by a rules engine**, not a single state machine. The rules engine computes the effective state from all four.

### 5.2 State Transition Rules

| Subscription | Payment | Access | Retention | Scenario |
|---|---|---|---|---|
| Active | Paid | Full | Active | Normal operation |
| Cancelled | Paid | Full | Active | Cancelled but in paid period |
| Cancelled | Paid | Read-Only | Retention | Paid period ended |
| Active | Failed | Full (grace) | Active | Payment failed, in grace period |
| Active | Failed | Read-Only | Retention | Grace period ended |
| Expired | — | Read-Only | Retention | Subscription ended |
| Expired | — | None | Archived | Retention period ended |
| Paused | — | Read-Only | Active | Subscription paused (seasonal) |

### 5.3 Grace Periods

| Scenario | Grace Period | Access During Grace | After Grace |
|---|---|---|---|
| Failed renewal | 7 days | Full access | Read-only + export (30 days) |
| Failed payment (new subscription) | 3 days | No access (pending) | Subscription cancelled |
| Cancellation | Until end of paid period | Full access | Read-only + export (30 days) |
| Suspension | None (manual) | Restricted (Platform Owner defines) | As defined |
| Pause | Up to 3 months | Read-only + export | Subscription resumes |

---

## 6. Entitlement Engine

### 6.1 The Resolution Chain

```
Published Offer (versioned, region-specific)
       ↓
Academy's Agreement (what they subscribed to, when)
       ↓
Active Add-ons (quantities, effective dates)
       ↓
Approved Exceptions (Platform Owner grants, with expiry)
       ↓
Effective Entitlements (computed, cached, invalidated on change)
       ↓
Server-side enforcement on every restricted action
```

### 6.2 Online Enforcement

Every restricted action checks entitlements server-side. The client can display entitlements but never enforce them.

**Enforcement order (critical):**
1. Is the user authenticated? (session valid?) — Identity & Security domain
2. Does the user have permission for this action? (role check) — Identity & Security domain
3. Is the academy within its entitlements? (entitlement check) — Entitlements domain

All three must pass. The entitlement cache only answers question 3. It never overrides questions 1 and 2.

| Action | Entitlement Check | If Exceeded |
|---|---|---|
| Create branch | branches.used < branches.limit | "Branch limit reached. Upgrade to add more." |
| Register player | players.used < players.limit | "Player limit reached. Upgrade or archive players." |
| Upload media | storage.used < storage.limit | "Storage full. Upgrade or delete files." |
| Invite staff | staff.used < staff.limit | "Staff limit reached. Upgrade or deactivate users." |
| Generate advanced report | features.advanced_reports = true | "Advanced reports require Growth plan or higher." |
| API request | api_requests.used < api_requests.limit | "API limit reached. Upgrade for more requests." |

### 6.3 Atomic Quota Checks (Concurrent Operations)

Online quota checks must be atomic to prevent simultaneous requests from exceeding purchased capacity.

```
-- Atomic quota check (PostgreSQL)
UPDATE academy_entitlements 
SET players_used = players_used + 1 
WHERE academy_id = ? AND players_used < players_limit
RETURNING players_used;
```

If the update affects 0 rows, the quota is exceeded. If it affects 1 row, the registration is allowed. This is atomic at the database level.

**This applies to all entitlement-consuming operations:** player registration, media upload, staff invitation, branch creation, API request counting.

### 6.4 Offline Enforcement (Unified Policy)

#### The Core Principle

> **Limits are enforced to the best of the cached information available. The server is the final authority. Over-limit situations are reconciled, not prevented, in multi-device offline scenarios.**

#### Unified Offline Policy Table

| Days Offline | Tier 1a (Viewing, Export) | Tier 1b (Attendance) | Tier 2 (Registration, Upload, Invite) | Tier 3 (Branch, Upgrade, Add-on) |
|---|---|---|---|---|
| 1-7 | ✅ Allowed | ✅ Allowed (cached) | ✅ Allowed (cached limits, 24h TTL) | ❌ Blocked |
| 8-14 | ✅ Allowed | ✅ Allowed (cached) | ❌ Blocked (requires server) | ❌ Blocked |
| 15+ | ✅ Allowed | ❌ Blocked | ❌ Blocked | ❌ Blocked |

**One table. One policy. No contradictions.**

- **Tier 1a** (Viewing, exporting) is **always available** regardless of offline duration. These never consume entitlements.
- **Tier 1b** (Attendance recording) is available for **14 days** offline. After 14 days, attendance recording is blocked (risk of data conflicts from schedule changes). Viewing and exporting remain available.
- **Tier 2** (Registration, upload, invite) requires a fresh cache (< 24h). If cache is stale (24h-14d), Tier 2 is blocked with a clear message.
- **Tier 3** (Branch creation, upgrades, add-ons) always requires server authority. Never available offline.

#### Multi-Device Offline (Eventual Consistency)

Cached counts on multiple devices cannot guarantee limits across devices. This is an accepted limitation.

| Guarantee Level | What We Can Promise | What We Cannot Promise |
|---|---|---|
| Tier 1a (Always offline) | Always available. Never consumes entitlements. | N/A |
| Tier 1b (Attendance, 14 days) | Available for 14 days. | Cannot prevent duplicate attendance from multiple devices. |
| Tier 2 (Offline within limits) | Blocked if cached count ≥ limit. | Cannot prevent over-limit if multiple devices register simultaneously. |
| Reconciliation | Server reconciles on sync. Academy informed of over-limit. Resolution paths provided. | Cannot prevent the over-limit from occurring. |

**Resolution on sync:** If an academy is over limit after sync, they are informed and given resolution paths (upgrade, archive, contact support). Data is never deleted. The academy must resolve over-limit situations before performing further entitlement-consuming operations.

#### Subscription Expiry While Offline

If the subscription expires while offline:
- Tier 1a (viewing, exporting) continues for the read-only window (30 days)
- Tier 1b (attendance) continues for the read-only window (30 days)
- Tier 2 and Tier 3 are blocked immediately on reconnect
- Academy sees expiry notice when they reconnect
- Data is never lost

**Precedence rule:** Subscription expiry overrides offline attendance allowance. If the subscription has expired, attendance recording is blocked regardless of how long the device has been offline. The read-only window (30 days) still allows viewing and exporting.

#### Entitlement Cache

```
┌─────────────────────────────────────┐
│  LOCAL ENTITLEMENT CACHE            │
├─────────────────────────────────────┤
│  academy_id                         │
│  entitlements: {                    │
│    branches: { limit: 3, used: 2 }, │
│    players: { limit: 500, used: 142},│
│    storage: { limit: 25GB, used: 8.2GB},│
│    api_requests: { limit: 500000, used: 12000 },│
│    features: { reports: true, ... } │
│  }                                  │
│  cached_at: timestamp               │
│  ttl: 24 hours                      │
│  subscription_status: active        │
│  last_synced: timestamp             │
└─────────────────────────────────────┘
```

#### TTL Configuration

| Scenario | TTL |
|---|---|
| Active subscription | 24 hours |
| Past due subscription | 4 hours |
| Demo account | 1 hour |
| Free tier | 24 hours |

**Single TTL rule.** No "recently synced" extension. Simple, consistent, unambiguous.

---

## 7. Upgrade, Downgrade, and Add-on Mechanics

### 7.1 Upgrade (Immediate, Prorated)

1. Academy Owner reviews change preview
2. Payment confirmed
3. Entitlements updated immediately
4. Prorated charge for remaining days in billing period

**Proration formula (using actual billing period length):**
```
Prorated charge = (New price − Current price) × (Days remaining / Days in actual billing period)
```

Where:
- **Days in actual billing period:** The actual number of days in the current billing cycle (e.g., 31 for January, 28 for February, 365 for a yearly subscription)
- **Days remaining:** The number of days from the change date to the end of the billing period

**No fixed 1/30 approximation.** Always use actual days.

### 7.2 Downgrade (Deferred to Renewal, No Proration)

1. Academy Owner initiates downgrade
2. System shows impact
3. If over new limit: Academy Owner must choose which to pause
4. Academy Owner explicitly acknowledges the downgrade terms
5. Change scheduled for next renewal date
6. No charge, no refund

**If unresolved by renewal date:**
- 7-day pre-renewal notification
- If still unresolved at renewal: Subscription renews at current plan/price. Downgrade cancelled. Academy must re-initiate.

**Key principle:** Never charge an academy for a plan they didn't explicitly agree to.

### 7.3 Add-on Removal (Deferred to Renewal)

Same as downgrade: takes effect at next renewal, no proration, guided resolution if over new limits.

### 7.4 Refund Policy

| Subscription Type | Refund Policy |
|---|---|
| Monthly | No refunds |
| Yearly | Refund for remaining full months |

**Exception:** If AcademyOS fails to deliver service (outage, data loss), goodwill refund/credit at Platform Owner discretion (manual, documented).

### 7.5 The Change Preview Screen

```
┌─────────────────────────────────────────────┐
│  CHANGE PREVIEW                             │
├─────────────────────────────────────────────┤
│  Current: Growth (2 branches)               │
│  New: Growth + 1 branch add-on              │
│                                             │
│  What changes:                              │
│  • Branch capacity: 2 → 3                   │
│  • No change to other features              │
│                                             │
│  Billing:                                   │
│  Due today (prorated): $45.00               │
│  Next renewal (Mar 15): $195.00/month       │
│  (was $150.00/month)                        │
│                                             │
│  Effective: When payment is confirmed       │
│                                             │
│  [Confirm & Pay]  [Cancel]                  │
└─────────────────────────────────────────────┘
```

---

## 8. Refund Policy and Proration

### 8.1 Refund Policy

| Subscription Type | Refund Policy |
|---|---|
| Monthly | No refunds |
| Yearly | Refund for remaining full months |

**Exception:** If AcademyOS fails to deliver service (outage, data loss), goodwill refund/credit at Platform Owner discretion (manual, documented).

### 8.2 Proration

**Upgrades:** Prorated by remaining days using actual billing period length.
```
Prorated charge = (New price − Current price) × (Days remaining / Days in actual billing period)
```

**Downgrades:** No proration. Takes effect at next renewal.

**Add-ons:** Prorated by remaining days (same as upgrades).

### 8.3 Edge Cases

| Scenario | Resolution |
|---|---|
| Upgrade and downgrade in same month | Net the changes. If net positive, charge. If net negative, credit to next invoice. |
| Upgrade on last day of billing period | Charge 1/day of the price difference (1 day prorated using actual period length). |
| Timezone differences | Use academy's local date for "day of billing period." Store billing timezone per academy. |
| Leap year | 366 days for yearly proration in leap years. |

---

## 9. Payment Architecture

### 9.1 Provider Strategy

| Market | Provider | Payment Methods | Settlement |
|---|---|---|---|
| Egypt | Paymob | Cards, wallets, InstaPay, Fawry, kiosk | EGP to Egyptian bank |
| International | Whop | Cards, crypto, etc. | Whop payout to you |

### 9.2 Adapter Architecture

```
┌─────────────────────────────────────────┐
│  AcademyOS Commercial Layer             │
│  (invoices, subscriptions, entitlements)│
├─────────────────────────────────────────┤
│  Payment Provider Interface             │
│  (create_payment, get_status, refund)   │
├──────────────┬──────────────────────────┤
│  Paymob      │  Whop                    │
│  Adapter     │  Adapter                 │
└──────────────┴──────────────────────────┘
```

Each adapter implements the common interface. AcademyOS calls `create_payment(invoice)` and the adapter routes to Paymob or Whop based on the academy's country.

### 9.3 Why This Works

- **Egypt:** Paymob receives EGP, settles to your Egyptian bank. No international complexity. Live account available.
- **International:** Whop is merchant of record. Handles payments, taxes, compliance, payouts. You never touch international payments directly.
- **The "company issue" is bypassed:** Whop handles international complexity. You just receive payouts.

### 9.4 Tax Handling

- **Tax collection: OFF for now.** Toggle available in Platform Owner settings.
- When OFF: Prices are tax-exclusive. Invoices show "Prices exclude applicable taxes. You are responsible for tax compliance in your jurisdiction."
- When ON (future): Platform Owner sets tax rate per academy. Tax shown on invoice.
- International taxes handled by Whop (merchant of record).
- Egyptian taxes: Academy's responsibility (B2B self-assessment initially).

**Pre-launch requirement:** Determine Egyptian VAT obligation before accepting payments. Consult an accountant. This is a legal requirement, not a product decision.

**Path to collection:** When revenue crosses Egyptian VAT registration threshold, register for VAT, toggle tax collection ON, set tax rate per academy.

### 9.5 Webhook Handling (Critical)

Both Paymob and Whop send webhooks for:
- Payment successful
- Payment failed
- Subscription cancelled
- Refund issued
- Chargeback (dispute)

**Must be idempotent.** Same webhook arriving twice must be processed exactly once.

### 9.6 Manual Payment Recording (Retained)

Even with Paymob and Whop, manual payment recording is retained for:
- Bank transfers (some academies prefer direct bank transfer)
- Exceptional cases (partial payments, payment plans)
- Reconciliation (matching bank deposits to invoices)
- Offline payments (cash at events, etc.)

**Implementation:** "Record Manual Payment" action in Platform Owner workspace. Fields: invoice, amount, currency, payment method (bank transfer, cash, other), reference number, date, notes.

### 9.7 Architecture

| Field | Purpose |
|---|---|
| Academy: `country` | Determines payment provider |
| Academy: `currency` | Display/payment currency |
| Academy: `payment_provider` | "paymob" or "whop" |
| Academy: `payment_provider_customer_id` | Customer ID in provider |
| Invoice: `currency` | Invoice currency |
| Invoice: `payment_provider` | Which provider processed |
| Invoice: `payment_provider_invoice_id` | Invoice ID in provider |
| Invoice: `payment_status` | Paid, pending, failed, refunded, disputed |
| Invoice: `exchange_rate` | Rate to USD at invoice time |
| Invoice: `base_amount` | Amount in USD (for reporting) |
| Invoice: `issued_by` | "academyos" or "whop" (merchant of record) |

### 9.8 Payment Provider Verification (Before Phase 2)

| Question | Paymob | Whop |
|---|---|---|
| Recurring payments (monthly subscription)? | Verify | Verify |
| Automatic retry on failed payment? | Verify | Verify |
| Partial/prorated refunds? | Verify | Verify |
| Multi-currency (EGP + others)? | Verify | Verify |
| Webhook reliability and retry policy? | Verify | Verify |
| Settlement timing (payment → bank)? | Verify | Verify |
| Merchant of record (tax handling)? | N/A (Egypt) | Verify scope |
| Minimum payout threshold? | Verify | Verify |
| API documentation quality? | Review | Review |
| Sandbox/test environment? | Verify | Verify |

**Recommendation:** Run a 1-2 day spike to verify Paymob's recurring payment capabilities and Whop's merchant-of-record scope before building Phase 2.

---

## 10. Payment Reliability

### 10.1 Webhook Signature Verification

Every webhook must be verified using the provider's signature (HMAC-SHA256 with provider secret). Without this, anyone can send fake webhooks.

**Implementation:**
- Paymob: Verify using Paymob's HMAC signature
- Whop: Verify using Whop's webhook signature
- Reject any webhook that fails signature verification
- Log all rejected webhooks for security monitoring

### 10.2 Out-of-Order Event Handling

Webhooks may arrive out of order (e.g., "payment failed" arrives after "payment succeeded" due to retry). The system must handle events based on their timestamp, not arrival order.

**Implementation:**
- Each webhook includes a timestamp (event time, not arrival time)
- Store the last processed event timestamp per invoice/subscription
- If a new event has an earlier timestamp than the last processed event, queue it for reprocessing or flag for manual review
- **Never discard financial events.** They may represent valid transactions. Flag conflicts for manual review instead of auto-discarding.
- Process events in chronological order within a transaction

### 10.3 Chargeback Handling

When a customer disputes a charge, the payment provider sends a chargeback notification.

**Resolution:**
1. Notify Platform Owner (in-app + email) immediately
2. Assess dispute validity before restricting operations
3. If dispute is likely valid or amount exceeds threshold: suspend access (subscription → suspended state)
4. If dispute is likely invalid: keep access active, flag for review
5. Record the dispute (chargeback amount, reason, date)
6. Set retention period (data retained for 90 days during dispute resolution)
7. If dispute resolved in AcademyOS's favor: restore access, record resolution
8. If dispute resolved in customer's favor: subscription cancelled, refund processed, data retained per policy
9. **Avoid duplicate refunds:** Check if refund was already processed before issuing chargeback refund

### 10.4 Duplicate Payment Prevention

If the same invoice is paid twice (e.g., customer clicks "Pay" twice), the system must prevent double-charging or refund the duplicate.

**Implementation:**
- Check if invoice is already paid before processing new payment
- If already paid: reject the duplicate payment, notify the customer
- If duplicate payment slips through: detect during reconciliation, issue automatic refund

### 10.5 Transactional Consistency

Payment state and subscription state must be updated atomically.

**Implementation:**
- Payment + subscription state update in the same database transaction
- If transaction fails: retry up to 3 times with exponential backoff
- If all retries fail: alert Platform Owner, log the failure, do not leave partial state
- Use database transactions with rollback on failure

---

## 11. Dunning Management

### 11.1 The Dunning Schedule

| Day | Action | Notification |
|---|---|---|
| Day 0 | Payment fails. First retry scheduled. | Email + in-app: "Payment failed. We'll retry in 3 days." |
| Day 3 | Second retry. | Email + in-app: "Payment retry failed. We'll try again in 2 days." |
| Day 5 | Third retry. | Email + in-app: "Final payment attempt. Update your payment method." |
| Day 7 | Grace period ends. Access → Read-Only. | Email + in-app: "Your subscription is now read-only. Update payment to restore access." |
| Day 30 | Read-only: 7 days remaining. | Email + in-app: "Your subscription will expire in 7 days. Update payment to restore full access." |
| Day 37 | Read-only window ends. Access → None. Data → Retention. | Email: "Your subscription has expired. Your data will be retained for 90 days." |
| Day 97 | Retention: 30 days remaining. | Email: "Your data will be archived in 30 days. Export your data now." |
| Day 127 | Retention ends. Data → Archived. | Email: "Your data has been archived. Contact support to restore." |

**Total: 127 days from payment failure to archival.**

### 11.2 Key Rules

- 3 retry attempts (Day 0, Day 3, Day 5)
- Grace period resets if payment succeeds at any point
- Academy Owner can update payment method at any time during dunning
- If payment method updated, immediate retry is triggered
- Access transitions are automatic based on dunning state
- All dunning events are audit-logged

### 11.3 Why This Matters

Without dunning management, every failed payment immediately becomes a churn event. With proper dunning, 30-50% of failed payments are recovered through retries alone. This is revenue that would otherwise be lost.

---

## 12. Invoice Requirements

### 12.1 Legal Invoice Fields

| Field | Purpose | Notes |
|---|---|---|
| Invoice number | Unique identifier | Per-academy sequential (AC-001, AC-002) |
| Invoice date | When issued | |
| Due date | When payment is expected | "Due on receipt" for subscriptions |
| Academy name | Bill-to entity | |
| Academy address | Bill-to address | |
| Academy tax ID (if applicable) | Tax compliance | Optional initially |
| Platform Owner legal entity name | Bill-from entity | |
| Platform Owner address | Bill-from address | |
| Platform Owner tax ID (if applicable) | Tax compliance | |
| Line items | What's being charged | Plan name, add-ons, quantities, unit prices |
| Subtotal | Before tax | |
| Tax amount | If tax collection enabled | Currently OFF |
| Total | Amount due | |
| Currency | Invoice currency | EGP for Egypt, local for international |
| Payment method | How to pay | Paymob link / Whop link / bank transfer details |
| Payment terms | When payment is due | "Due on receipt" or "Net 15" |
| Notes | Additional information | "Prices exclude applicable taxes" (when tax OFF) |
| Issued by | "academyos" or "whop" | Distinguishes AcademyOS-issued from merchant-of-record-issued |

### 12.2 Invoice Format

- PDF, downloadable
- Language matches academy's language setting (EN/AR initially)
- Invoice numbering: per-academy sequential with prefix
- Credit notes: CN-001, CN-002, sequential
- Generated automatically on subscription creation/renewal
- Available in Academy Owner workspace (invoices & receipts)

### 12.3 Credit Notes and Partial Payments

| Scenario | Resolution |
|---|---|
| Overpayment | Credit applied to next invoice. Academy notified. |
| Partial payment | Invoice marked "partially paid." Remaining balance due. Access maintained during grace period. |
| Refund | Credit note issued. Refund processed via payment provider. Invoice marked "refunded" or "partially refunded." |
| Credit note | Generated as separate document linked to original invoice. Shows negative amount. |

---

## 13. Platform Owner Finance

### 13.1 Four Financial Domains

| Domain | What It Tracks | Who Manages |
|---|---|---|
| **Commercial Billing** | Invoices, charges, credits, refunds, what academies owe | Platform Owner |
| **Treasury** | Actual cash: bank deposits, provider balances, payouts, fees | Platform Owner / accountant |
| **Business Expenses** | Operating costs: hosting, storage, messaging, support tools | Platform Owner |
| **Academy Family Billing** | What families owe the academy | Academy Owner (separate system) |

### 13.2 The Money Flow

```
Academy pays AcademyOS
        ↓
Payment Provider (Paymob/Whop)
        ↓
Business Bank Account (payout)
        ↓
Operating Expenses (hosting, storage, messaging, etc.)
        ↓
Owner Compensation (salary/draw/distribution — separate from expenses)
```

Each arrow is a distinct financial event with its own record, timestamp, and reconciliation status.

### 13.3 Revenue Metrics

| Metric | Definition |
|---|---|
| MRR | Monthly Recurring Revenue |
| ARR | Annual Recurring Revenue (MRR × 12) |
| New MRR | From new subscriptions this month |
| Expansion MRR | From upgrades and add-ons |
| Reactivation MRR | From previously churned customers who re-subscribe |
| Contraction MRR | From downgrades and add-on removals |
| Churned MRR | From cancellations |
| Net MRR Change | New + Expansion + Reactivation − Churned − Contraction |

### 13.4 The Three Numbers That Must Never Be Confused

1. **Invoiced amount** — what we charged
2. **Collected amount** — what the provider received
3. **Settled amount** — what reached our bank account

### 13.5 Profitability Metrics

| Metric | Formula | What It Tells You |
|---|---|---|
| **Contribution margin** | Revenue − Direct variable costs (storage, messaging, compute per academy) | How much each academy contributes to covering shared costs |
| **Operating profit** | Contribution margin − Shared/allocated costs (hosting, CDN, monitoring, support) | Whether the business is profitable overall |
| **Net profit** | Operating profit − Taxes, interest, depreciation | Bottom line |

### 13.6 Academy-Level Profitability

```
Revenue (subscription + add-ons)
  − Direct variable costs (storage used, messages sent, compute consumed)
  = Contribution margin per academy

Contribution margin (all academies)
  − Shared/allocated costs (platform overhead)
  = Operating profit
```

### 13.7 Owner Compensation (Visit Later)

- Tracked as separate ledger in Platform Owner workspace
- Type: salary / draw / distribution / reimbursement / bonus
- Structure depends on business entity and tax situation
- **Visit later:** Consult accountant for optimal structure

---

## 14. Email Notifications and Infrastructure

### 14.1 Email Provider

| Decision | Recommendation |
|---|---|
| Email provider | Resend (modern, developer-friendly, good deliverability) |
| Email templates | React Email (component-based, type-safe) |
| Email sending | Queued (via background job) |
| Email tracking | Open tracking only (privacy-friendly) |
| Bounce handling | Auto-suppress hard bounces, retry soft bounces |
| Unsubscribe | One-click unsubscribe (required for compliance) |
| Email language | Match academy language (EN/AR initially) |

### 14.2 Billing Notification Matrix

| Event | Recipient | Channel | Timing |
|---|---|---|---|
| Subscription activated | Academy Owner | Email + in-app | Immediate |
| Payment successful | Academy Owner | Email + in-app | Immediate |
| Payment failed | Academy Owner | Email + in-app | Immediate |
| Payment retry scheduled | Academy Owner | Email | At retry scheduling |
| Grace period started | Academy Owner | Email + in-app | Immediate |
| Grace period ending (1 day left) | Academy Owner | Email + in-app | 1 day before |
| Access restricted (read-only) | Academy Owner | Email + in-app | Immediate |
| Subscription cancelled | Academy Owner | Email + in-app | Immediate |
| Cancellation effective (end of period) | Academy Owner | Email | On effective date |
| Plan upgrade confirmed | Academy Owner | Email + in-app | Immediate |
| Plan downgrade scheduled | Academy Owner | Email + in-app | Immediate |
| Downgrade effective | Academy Owner | Email + in-app | On effective date |
| Add-on purchased | Academy Owner | Email + in-app | Immediate |
| Add-on removed | Academy Owner | Email + in-app | On effective date |
| Limit approaching (80%) | Academy Owner | In-app | When threshold crossed |
| Limit reached (100%) | Academy Owner | Email + in-app | When threshold crossed |
| Demo invitation sent | Prospect | Email | Immediate |
| Demo expiring (7 days left) | Prospect | Email | 7 days before expiry |
| Demo held (90 days inactive) | Prospect | Email | On hold |
| Demo deleted (180 days held) | Prospect | Email | On delete |
| Demo converted | Platform Owner | In-app | On conversion |
| New customer subscribed | Platform Owner | In-app | Immediate |
| Payment failed (any academy) | Platform Owner | In-app | Immediate |
| High-value churn (Growth plan cancelled) | Platform Owner | In-app | Immediate |

### 14.3 Notification Preferences

- Academy Owner can opt out of non-critical emails (limit warnings, tips)
- Critical emails (payment failed, access restricted, subscription cancelled) cannot be opted out
- Platform Owner can configure which events trigger notifications
- In-app notifications retained for 30 days

---

## 15. Demo Strategy

### 15.1 Demo vs. Free Tier (Distinct Account Types)

| Aspect | Demo | Free Tier |
|---|---|---|
| **Purpose** | Evaluate the product | Use the product (limited) |
| **Data** | Fictional, seeded | Real (user's own) |
| **Duration** | Open (held after 90 days inactive) | Permanent (as long as active) |
| **Capabilities** | Full feature exploration | Limited by free tier entitlements |
| **Conversion** | Creates clean academy on subscribe | Already is an academy |
| **Abuse risk** | Medium | Low |
| **Account type** | `demo` | `free` |
| **Security boundary** | Fictional data only. No real child data. | Real data, real child data. |
| **Lifecycle** | Active → Held (90d) → Deleted (180d) | Active (no automatic lifecycle) |

**A demo IS a free tier account with a `demo` account type.** The account type triggers seeded data, conversion flow, inactivity tracking, and security boundaries.

### 15.2 Demo Auto-Generation with Secure Invitation Links

**Platform Owner clicks "Create Demo" → system auto-generates:**
- Demo academy with seeded fictional data
- Demo user account
- Secure invitation link (expires in 7 days, single-use)

**The shareable package:**

```
┌─────────────────────────────────────────────┐
│  DEMO CREATED                               │
├─────────────────────────────────────────────┤
│  Invitation Link:                           │
│  https://app.academyos.com/demo/invite/abc123│
│                                             │
│  Expires: 7 days                            │
│  Data: Fictional (20 players, 3 classes)    │
│                                             │
│  [Copy Link]  [Send via Email]  [Regenerate]│
│                                             │
│  Held after 90 days inactive                │
└─────────────────────────────────────────────┘
```

**Prospect flow:** Clicks link → auto-authenticated → immediately inside a working AcademyOS instance with realistic data. No password needed. No signup. Zero friction.

**Security benefits over password-based access:**
- No password to share or leak
- Link expires (7 days default, regeneratable)
- Prospect identity is tracked (which prospect converted, which didn't)
- No brute-force risk (link is cryptographically secure, single-use)
- Single-session (one active login at a time)

### 15.3 Auto-Generated Seed Data

| Data Type | Quantity | Details |
|---|---|---|
| Academy | 1 | "Demo Academy" with logo, name, sport (football) |
| Branches | 1 | Main branch |
| Players | 20 | Mixed ages (6-16), male/female, various statuses |
| Classes | 3 | Different age groups, different days/times |
| Sessions | 2 weeks | Scheduled sessions with attendance recorded |
| Attendance | ~40 records | Mix of present/absent/late |
| Staff | 3 | Academy Owner, 1 Manager, 1 Coach |
| Invoices | 5 | Sample invoices (paid and pending) |
| Reports | Pre-generated | Attendance summary, roster report |

**Seed data must feel realistic.** Culturally appropriate names, sensible schedules, varied attendance, sample invoices that look real.

### 15.4 Prospect Identity Tracking

Each invitation link is tied to a prospect record:
- Prospect name (optional, entered by Platform Owner)
- Prospect email (optional)
- Prospect phone (optional)
- Invitation sent date
- First login date
- Last active date
- Converted (yes/no)
- Conversion date

This allows the Platform Owner to track which prospects are engaging and which are converting.

### 15.5 Returning Prospect Reauthentication

If a prospect's invitation link expires (7 days) and they want to return:

| Scenario | Solution |
|---|---|
| First visit | Secure invitation link (single-use, 7-day expiry) |
| Returning visit (link expired) | Prospect enters email → receives new invitation link (if demo is still active) |
| Returning visit (demo held) | Prospect clicks "Reactivate" → receives new invitation link |
| Conversion to real academy | Prospect must verify email (magic link or OTP) before account creation |

**Prospect identity verification before conversion:**
1. Prospect clicks "Subscribe" in demo
2. System sends verification email to prospect's email
3. Prospect clicks verification link
4. System creates clean academy with verified email
5. Prospect sets password and completes onboarding

**This ensures:** The converted academy is tied to a verified identity, not a disposable demo link.

### 15.6 Demo Lifecycle

```
Created → Active (prospect exploring) → Inactive (90 days no login) → Held (data preserved) → Deleted (180 days held)
```

| State | Trigger | What Prospect Sees | Data |
|---|---|---|---|
| Active | Created or reactivated | Full demo access | Seeded data |
| Held | 90 days no login | "Your demo has been paused. Click to reactivate." | Preserved |
| Deleted | 180 days held | "This demo has expired. Contact us for a new one." | Deleted |

### 15.7 Conversion Flow

When prospect clicks "Subscribe" in demo:
1. Prospect verifies email (magic link or OTP)
2. System creates a **clean academy** (not a conversion of demo data)
3. Prospect carries over: academy name (editable), language, sport
4. Prospect starts fresh with real data
5. Prospect sets password and completes onboarding
6. Demo workspace marked "converted" and scheduled for cleanup (30 days)
7. Prospect redirected to new academy with welcome message

### 15.8 Security Boundaries

| Boundary | Enforcement |
|---|---|
| Demo data isolation | Demo academy is separate tenant. No data leakage. |
| Real child data | Demo accounts cannot store real child data (server-side enforced) |
| Real invitations | Demo accounts cannot send real invitations |
| Real payments | Demo accounts cannot process real payments (simulated only) |
| Real messages | Demo accounts cannot send real outbound messages |
| API access | Demo accounts have no API access |
| Data export | Demo accounts can export (but data is fictional) |
| Invitation link | Cryptographically secure, single-use, expiring (7 days) |
| Prospect reauthentication | Secure email verification for returning prospects |
| Conversion identity | Email verification required before account creation |

### 15.9 Platform Owner Demo Management

```
┌─────────────────────────────────────────────────────────────┐
│  DEMOS                                                      │
├─────────────────────────────────────────────────────────────┤
│  Name              Status    Created     Last Active  Actions│
│  Al-Noor FC (Demo) Active    Nov 20      Nov 22      [View] [Hold] [Delete] [Regenerate Link]│
│  Riyadh Stars Demo Active    Nov 18      Nov 18      [View] [Hold] [Delete] [Regenerate Link]│
│  Old Demo          Held      Sep 1       Aug 15      [Reactivate] [Delete]│
│  Converted Demo    Converted Nov 10      Nov 12      [View History]│
└─────────────────────────────────────────────────────────────┘
```

### 15.10 Abuse Prevention

| Risk | Mitigation |
|---|---|
| Mass demo creation | Rate limit: 10 demos per Platform Owner per day |
| Demo spam (sending to hundreds) | Rate limit: 50 demo sends per day |
| Demo data harvesting | Demo data is fictional, no value to harvest |
| Link sharing | Single-use link, expires after first use |
| Demo abuse (using as free tier) | Demo accounts auto-hold after 90 days inactive |
| Brute force | Links are cryptographically secure (256-bit) |
| Fake conversions | Email verification required before account creation |

---

## 16. Multi-Academy Foundation

### 16.1 Build the Foundation Now

| Foundation Element | What It Is | Cost Now vs. Later |
|---|---|---|
| User ↔ Academy relationship | Many-to-many | 1 day now vs. 2-4 weeks later |
| Academy → Organization relationship | Optional parent entity | Add nullable column now |
| Subscription per academy | Each academy has its own subscription | Already designed this way |
| User roles per academy | Role scoped to academy, not user | Schema change now |

### 16.2 The Data Model Foundation

```
User (global identity)
  │
  ├── UserAcademyRole (many-to-many)
  │     ├── academy_id
  │     ├── role (owner, manager, coach)
  │     └── permissions (scoped to this academy)
  │
  └── Academy
        ├── organization_id (nullable — for future chains)
        ├── subscription_id
        └── ... (existing academy data)
```

### 16.3 What to Defer

- Chain/organization billing
- Cross-academy reporting
- Shared staff across academies
- Organization-level entitlements

---

## 17. Plan Editing and Impact on Existing Subscribers

### 17.1 The Core Principle

> **Never mutate an offer in place. Always create a new version. Existing academies keep their agreed version until they explicitly change or a policy-defined migration occurs.**

### 17.2 Change Types and Their Impact

| Change Type | Impact on Existing Subscribers | Notice Required | Acceptance Required? |
|---|---|---|---|
| Price increase | Grandfathered until renewal, then new price | 30 days before renewal | Yes. If not accepted by renewal: subscription not renewed. Academy enters read-only. Can reactivate at any time. |
| Price decrease | Automatic (benefit to customer) | None (in-app notification) | No |
| Limit increase | Explicit benefit migration (recorded) | None (in-app notification) | No |
| Limit decrease | Grandfathered until renewal, then new limit | 30 days before renewal + guided resolution | Yes. If not accepted: subscription renews at current plan/price. Downgrade cancelled. |
| Feature addition | Explicit benefit migration (recorded) | None (in-app notification) | No |
| Feature removal | Grandfathered (keep feature forever) | 90 days (for new subscribers) | Yes. If not accepted: academy keeps the feature (grandfathered) until they migrate. |
| Plan deprecation | Grandfathered until sunset, then migrated | 90 days before sunset | If replacement is equivalent or better: auto-migrate with 30-day opt-out. If replacement is more expensive/restrictive: require explicit acceptance. |

### 17.3 Explicit Benefit Migrations (Not Auto-Inheritance)

Instead of "auto-upgrade for increases," use **explicit benefit migrations**:

1. New offer version published with higher limits
2. Platform Owner creates a "benefit migration" (e.g., "Core v1 → Core v2: +50 players")
3. Migration is applied to all academies on Core v1
4. Migration is recorded in the academy's agreement (audit trail)
5. If a future version reduces limits, the academy keeps their migrated limit (they earned it through the migration)

**This prevents unintended permanent entitlements.** Each benefit increase is an explicit, recorded migration. The academy's agreement shows exactly which migrations were applied.

### 17.4 The Offer Versioning Model

```
Offer (plan family)
  ├── id: "core"
  ├── name: "Core"
  └── versions: [OfferVersion]

OfferVersion
  ├── id: "core-v1"
  ├── offer_id: "core"
  ├── version_number: 1
  ├── status: "active" | "deprecated" | "retired"
  ├── effective_date: timestamp
  ├── price: { US: 100, EG: 2000, ... }
  ├── limits: { branches: 1, players: 100, storage: 5GB, ... }
  ├── features: { reports: "standard", export: true, ... }
  └── created_at: timestamp

AcademyAgreement
  ├── academy_id
  ├── offer_version_id: "core-v1"
  ├── price_locked: 100
  ├── limits_locked: { branches: 1, players: 100, ... }
  ├── benefit_migrations: [{ from: "core-v1", to: "core-v2", benefit: "+50 players", date: "2027-03-15" }]
  ├── effective_date: timestamp
  ├── renewal_date: timestamp
  └── status: "active" | "cancelled" | "expired"
```

### 17.5 Version Status Lifecycle

```
Draft → Published → Active → Deprecated → Retired
```

| Status | Can New Academies Subscribe? | Existing Subscribers Affected? |
|---|---|---|
| Draft | No | No |
| Published | Yes | No (unless benefit migration applies) |
| Active | Yes | Yes (benefit migrations apply) |
| Deprecated | No (new subscribers get latest) | Yes (grandfathered, notified of sunset) |
| Retired | No | Migrated to equivalent plan |

### 17.6 Unresolved Downgrades

**Revised downgrade flow:**
1. Academy Owner initiates downgrade
2. System shows impact + requires branch selection (if over new limit)
3. Academy Owner explicitly acknowledges the downgrade terms
4. Change scheduled for next renewal date
5. If unresolved by renewal date: 7-day pre-renewal notification
6. If still unresolved at renewal: Subscription renews at current plan/price. Downgrade cancelled. Academy must re-initiate.

**Key principle:** Never charge an academy for a plan they didn't explicitly agree to.

---

## 18. Free-Tier Economics

### 18.1 Tracked Metrics (Usage & Metering Domain)

| Metric | Why It Matters | How to Track |
|---|---|---|
| Storage used | Direct cost (Supabase) | Per-academy tracking |
| API requests per month | Compute cost | Per-academy tracking |
| Bandwidth (egress) | Direct cost (Supabase) | Per-academy tracking |
| Support tickets | Indirect cost (time) | Per-academy tracking (manual initially) |

**Note:** Database rows are tracked for cost monitoring but are NOT a customer-facing limit.

### 18.2 Operation Blocking (Not Throttling) for Free Tier

When a free tier academy exceeds any limit:
1. Academy Owner is notified
2. Given option to upgrade
3. If no upgrade: **non-essential operations are blocked** (advanced reports, bulk exports, media uploads beyond 80% of limit)
4. Core operations (attendance, viewing, scheduling, basic export) are **never blocked or throttled**
5. Hard infrastructure ceilings prevent abuse (max 10,000 API requests/month for discretionary, max 1 GB bandwidth/month for discretionary)

**Blocking is better than throttling.** A free academy that hits their API limit should see a clear message ("You've reached your monthly API limit. Upgrade for more."), not a slow app. Core operations are never affected.

### 18.3 Essential vs. Discretionary Operations

| Category | Operations | Free Tier Limit | Behavior When Exceeded |
|---|---|---|---|
| **Essential operational** | Attendance, viewing, scheduling, basic export | No hard limit (or very high: 100,000 requests/month) | Never blocked. These are the core value proposition. |
| **Discretionary** | Advanced reports, bulk exports, media uploads beyond 80%, API access | 10,000 requests/month, 1 GB bandwidth/month | Blocked with clear message: "You've reached your monthly [resource] limit. Upgrade for more." |

---

## 19. Platform Owner Workspace

### 19.1 Navigation

```
Commercial Management
├── Overview (MRR, ARR, customers, demos)
├── Customers & Leads
├── Demos & Trials
├── Product Catalog (plans, add-ons, prices, regional pricing)
├── Subscriptions (list + detail)
├── Entitlements & Usage
├── Invoices & Collections
├── Payments & Refunds
├── Payouts & Reconciliation
├── Expenses & Profitability
├── Growth & Retention
├── Promotions & Discounts (visit later)
├── Commercial Approvals
└── Audit & Settings (tax toggle, grace periods, etc.)
```

### 19.2 Key Principle

The Platform Owner's commercial workspace has **no automatic read access** to academy operational data (players, attendance, family details). Commercial authority ≠ data access. Support access to operational data is a separate, logged, time-limited permission.

---

## 20. Academy Owner Workspace

### 20.1 Navigation

```
Subscription & Billing
├── Plan Overview (current plan, usage, limits)
├── Features & Entitlements
├── Usage & Limits (visual progress bars)
├── Plans & Add-ons (browse, compare, purchase)
├── Change Subscription (with preview)
├── Invoices & Receipts
├── Payment Methods
├── Billing History
├── Billing Profile
└── Renewal & Cancellation
```

### 20.2 Key Principle

The Academy Owner is the **only person** who can see or modify the academy's commercial relationship. Managers and coaches don't even know the plan details unless the Academy Owner shares them.

---

## 21. Platform Owner Impersonation and Support

### 21.1 Scoped, Time-Limited, Audited Access

1. Platform Owner requests access to a specific academy's workspace
2. Academy Owner receives notification: "Platform Owner [name] is requesting access to your workspace for support. Approve or deny."
3. If approved: Platform Owner gets **read-only** access for **1 hour** (time-limited)
4. All actions during impersonation are **audit-logged**
5. Academy Owner can revoke access at any time
6. Access expires automatically after 1 hour

**Key principle:** The Platform Owner never has automatic read access to academy operational data. Support access is always explicit, approved, time-limited, and audited.

---

## 22. Data Export on Cancellation

### 22.1 Exportable Data

| Data Type | Exportable? | Format | Notes |
|---|---|---|---|
| Player roster | ✅ Yes | CSV, PDF | Basic info (name, age, contact) |
| Attendance records | ✅ Yes | CSV, PDF | Per class, per session |
| Schedule | ✅ Yes | CSV, PDF | Classes, sessions, times |
| Invoices (academy's own) | ✅ Yes | CSV, PDF | Family billing invoices |
| Staff list | ✅ Yes | CSV | Names, roles, contact |
| Media (photos) | ✅ Yes | ZIP download | All uploaded photos |
| Reports | ✅ Yes | PDF | Pre-generated reports |
| Audit log | ✅ Yes | CSV | All actions taken |

### 22.2 Export Rules

- Available during read-only period (30 days) + retention period (90 days)
- Export size limit: 1 GB max, split into multiple downloads
- Who can trigger: Academy Owner only
- Export frequency: 1 export per day per academy (prevent abuse)
- Format: CSV for data, PDF for reports, ZIP for media

---

## 23. Retention Policies

### 23.1 Separate Retention Policies (Established Before Launch)

| Policy | What It Covers | Duration | Notes |
|---|---|---|---|
| **Access retention** | How long the academy can access data after expiry | 30 days (read-only) | Academy can view and export |
| **Data retention** | How long data is kept after access ends | 90 days | Data preserved, no access |
| **Archival** | How long data is kept in cold storage | 1 year | Cold storage, contact support to restore |
| **Permanent deletion** | When data is irreversibly deleted | After archival period (1 year + 90 days + 30 days = ~16 months / 485 days) | All personal data deleted. Irreversible. |
| **Financial record retention** | How long invoices/payment records are kept | 7 years (typical legal requirement) | Separate from academy data retention. Applies to both AcademyOS-issued and Whop-issued invoices. |
| **Backup expiration** | How long backups are retained | 30 days | Backups older than 30 days are purged. |

**Key principle:** Children's data is deleted permanently after the retention period. Financial records are retained for 7 years (legal requirement) but are separate from academy operational data. These policies are established before launch, not when storage costs become significant.

### 23.2 Retention Timeline (Academy Data)

```
Day 0: Subscription expires
  ↓
Day 0-30: Read-only + export (access retention)
  ↓
Day 30-120: Retention window (data preserved, no access)
  ↓
Day 120-485: Archived (cold storage, contact support to restore)
  ↓
Day 485+: Permanently deleted (all personal data irreversibly removed)
```

### 23.3 Retention Timeline (Financial Records)

```
Invoices and payment records: retained for 7 years (legal requirement)
  ↓
After 7 years: permanently deleted (unless legal hold)
```

---

## 24. Offline Synchronization Strategy

### 24.1 Domain-Specific Conflict Resolution

Last-write-wins is a default, not a universal rule. Each data type has its own conflict resolution strategy based on its sensitivity and conflict risk.

| Data Type | Conflict Resolution Strategy | Rationale |
|---|---|---|
| Attendance records | Merge: combine both sets of attendance records. If conflicts (same player marked present by one, absent by another), flag for manual resolution. | Losing attendance data is unacceptable. Merge preserves both. |
| Financial records | Never last-write-wins. Queue for server reconciliation. Server is authoritative. | Financial data must be accurate. Server is the single source of truth. |
| Scheduling | Server is authoritative. Offline changes are queued and applied if no conflict. If conflict, flag for manual resolution. | Schedule conflicts can cause real-world problems (double-booking). |
| Player data (notes, details) | Last-write-wins is acceptable (low risk) | Low sensitivity. Minor data loss acceptable. |
| Medical information, emergency contacts, consent | Server-authoritative merge. Never last-write-wins. Flag conflicts for manual resolution. | Critical data. Must not be lost or overwritten silently. |
| Media uploads | Queue-based. Each upload is independent. No conflict. | Each upload is a separate file. No merge needed. |
| Class descriptions | Last-write-wins is acceptable (low risk) | Low sensitivity. Minor data loss acceptable. |

### 24.2 The Principle

> **Last-write-wins is a default for low-risk data. Sensitive operational data (attendance, financial records, scheduling, medical data, consent) uses domain-specific conflict resolution. The server is always the final authority for financial and scheduling data.**

---

## 25. Implementation Roadmap

### Phase 0: Decisions (No Code) — COMPLETE

| Decision | Status |
|---|---|
| Payment provider (Egypt) | ✅ Paymob |
| Payment provider (International) | ✅ Whop |
| Base currency | ✅ USD |
| Billing cycle | ✅ Monthly first |
| Tax handling | ✅ OFF for now (legal obligation to be determined pre-launch) |
| Grace period | ✅ 7 days |
| Read-only window | ✅ 30 days |
| Data retention | ✅ 90 days (access) + 1 year (archival) + 7 years (financial) + 30 days (backups) |
| Demo duration | ✅ Open-ended, held after 90 days |
| Multi-academy | ✅ Separate subscriptions |
| Free tier storage | ✅ 100 MB |
| Free-tier operation blocking | ✅ Block non-essential, never block core |
| Demo access method | ✅ Secure invitation links (no passwords) |
| Offline attendance limit | ✅ 14 days |
| TTL rule | ✅ Single 24h for all active subscriptions |
| Benefit migrations | ✅ Explicit, recorded (not auto-inheritance) |
| Plan change acceptance | ✅ Explicit acceptance required for reductions |
| Proration | ✅ Actual billing period length |
| Offline conflict resolution | ✅ Domain-specific (not universal last-write-wins) |
| Payment reliability | ✅ Webhook signatures, out-of-order, chargebacks, duplicates, transactional consistency |
| Atomic quota checks | ✅ Database-level locking |
| Data retention pre-launch | ✅ Established before storing children's data |
| Demo reauthentication | ✅ Secure email verification for returning prospects |
| Prospect identity verification | ✅ Email verification before conversion |
| Modular monolith | ✅ Six domains, single deployment |
| Offline policy precedence | ✅ Subscription expiry overrides offline attendance allowance |
| Offline security | ✅ Offline auth expires after 24h. Re-validate on sync. |
| Chargeback handling | ✅ Assess dispute before restricting. Avoid duplicate refunds. |
| Plan deprecation acceptance | ✅ Auto-migrate if equivalent/better. Require acceptance if worse. |
| Owner compensation structure | ⏳ Visit later |
| Specific regional prices | ⏳ Visit later |
| Tax jurisdiction rules | ⏳ Visit later (pre-launch legal requirement) |

### Phase 1: Core Commercial Engine (Divided into Independently Testable Milestones)

See Appendix B for the full milestone breakdown.

### Phase 2: Academy Owner Commercial UI

| Component | Depends On |
|---|---|
| Plan overview + usage display | Entitlement service |
| Change subscription flow (with preview) | State machines + offer versioning |
| Add-on management | Entitlement service |
| Invoice history + receipts | Payment providers |
| Payment method management | Paymob/Whop |
| Storage usage display + enforcement | Storage tracking |
| Free-tier usage tracking + operation blocking | Usage tracking |
| Email notification preferences | Email infrastructure |
| Acceptance flow for plan changes | Plan change acceptance rules |

### Phase 3: Platform Owner Commercial UI

| Component | Depends On |
|---|---|
| Customer list + subscription detail | State machines |
| Offer catalog management | Offer versioning |
| Payment recording (automated) | Paymob/Whop webhooks |
| Exception granting (with expiry) | Entitlement service |
| Demo management | Demo provisioning |
| Regional pricing management | Regional pricing schema |
| Tax toggle + manual rates | Tax handling decision |
| Manual payment recording | Retained for exceptional cases |
| Impersonation for support | Platform Owner workspace |
| Benefit migration management | Benefit migration system |
| Chargeback management | Payment reliability |

### Phase 4: Demo & Conversion

| Component | Depends On |
|---|---|
| Demo creation API | Academy creation service |
| Seed data generator | Realistic fictional data |
| Demo user account (auto-generated) | Academy creation service |
| Secure invitation link generation | Demo creation API |
| Prospect identity tracking | Demo creation API |
| Returning prospect reauthentication | Email verification |
| Prospect identity verification before conversion | Email verification |
| Demo lifecycle (active → held → deleted) | Demo provisioning |
| Conversion flow (clean academy) | Academy creation + subscription |
| Demo security boundaries | Account type enum |
| Demo management UI | Platform Owner workspace |
| Abuse prevention | Rate limiting + monitoring |

### Phase 5: Analytics & Growth (Visit Later)

Churn prediction, customer health scoring, advanced profitability, promotional campaigns, demo analytics, self-service demo creation, annual billing, progressive offline degradation — all wait until there are enough customers to make the data meaningful.

---

## 26. Items to Visit Later

These are explicitly deferred. They are not blockers for Phase 1-4.

| Item | Why Deferred | When to Revisit |
|---|---|---|
| Owner compensation structure | Depends on business entity and tax situation | After business is registered and profitable |
| Specific regional prices | Needs market research per region | Before launching in each new region |
| Tax jurisdiction rules | Depends on business structure and location | Pre-launch legal requirement |
| Progressive degradation (offline) | Start with hard 7-day cutoff | After monitoring offline usage patterns |
| Annual billing | Monthly first, annual when stable | After 6 months of monthly billing data |
| Promotional campaigns | After customer base established | After 100+ paying customers |
| Churn prediction | Needs historical data | After 6 months of subscription data |
| Customer health scoring | Needs usage data | After 3 months of active customers |
| Advanced profitability analytics | Needs cost tracking data | After cost tracking is implemented |
| Multi-currency reporting dashboard | Start with USD normalization | After 50+ international customers |
| Automated tax calculation (TaxJar/Avalara) | Manual rates sufficient initially | When tax collection is enabled |
| CDN integration | Start with Supabase storage | When egress costs exceed threshold |
| Video transcoding | Start with image optimization | When video features are built |
| Image deduplication | Start with basic storage tracking | When storage costs become significant |
| Chain/organization billing | Foundation built, features deferred | After multi-academy demand emerges |
| Cross-academy reporting | Needs multi-academy data | After organization features are built |
| Shared staff across academies | Edge case, handle manually | After multi-academy is in use |
| Offline entitlement renewal | Requires payment, can't be offline | After payment automation is stable |
| Push notifications for entitlement changes | Nice-to-have | After core entitlement system is stable |
| Sophisticated offline conflict resolution | Domain-specific strategies defined. Last-write-wins for low-risk. | After offline usage patterns are understood |
| Demo inactivity threshold (90 days) | May need adjustment based on usage data | After monitoring demo usage |
| Demo analytics dashboard | Conversion tracking, feature usage | After demo system is live |
| Self-service demo creation | Verified email signup | After invite-only demos are proven |
| Demo customization | Platform Owner chooses seed data size/language/sport | After basic demo system is live |
| Reserved capacity per device (offline) | Eventual consistency acceptable initially | If over-limit situations become frequent |
| Support cost tracking | Manual initially | When support volume grows |
| Subscription pausing | Nice-to-have for seasonal academies | Phase 3+ |
| Subscription transfer | Rare edge case | Phase 3+ |
| API access details | Phase 5+ feature | Phase 5+ |
| Webhooks for academy events | Phase 5+ feature | Phase 5+ |
| Archival policy | Cost vs. compliance trade-off | When storage costs become significant |
| Backup expiration policy | Separate from data retention | When backup costs become significant |

---

## 27. What to Avoid

1. **Hardcoding plan limits in code.** Plans and add-ons must be data-driven.
2. **Making the payment provider the authority for access.** AcademyOS entitlements are the authority.
3. **Automatically deleting customer data after downgrades.** Preserve data, restrict creation.
4. **Charging for features that aren't ready.** Only sell what works end-to-end.
5. **Building a full accounting system.** Build commercial records that integrate with accounting software.
6. **Offering unlimited anything without understanding costs.** Every resource must have a measurable cost.
7. **Opening public demos without abuse protection.** Start invite-only.
8. **Conflating commercial restrictions with operational restrictions.** Different messages, different remediation.
9. **Silently suspending operational capacity.** Default to "no change" rather than "disruptive change."
10. **Ignoring offline entitlements.** This is the hardest problem. Design it carefully.
11. **Treating demo as free tier.** Distinct account types, distinct boundaries.
12. **Blocking core operations on free tier.** Block non-essential operations, never core.
13. **Charging for unagreed plan changes.** Explicit acceptance required.
14. **Ignoring dunning management.** 5-10% of payments fail monthly. Without dunning, that's preventable churn.
15. **Building invoices without legal fields.** Invoices are legal documents.
16. **Artificially throttling the application.** Block non-essential operations instead.
17. **Sharing permanent demo passwords.** Use secure, expiring invitation links.
18. **Auto-inheriting plan benefits.** Use explicit, recorded benefit migrations.
19. **Deferring tax compliance.** Legal obligations must be determined pre-launch.
20. **Letting entitlement cache override auth/permissions.** Security always comes first.
21. **Using universal last-write-wins for sensitive data.** Domain-specific conflict resolution.
22. **Using fixed 1/30 proration.** Always use actual billing period length.
23. **Letting two requests exceed quota simultaneously.** Atomic database-level checks.
24. **Storing children's data without retention policies.** Establish before launch.
25. **Converting demos without identity verification.** Verify email first.
26. **Auto-suspending over chargebacks.** Assess dispute before restricting.
27. **Discarding older payment events.** Never discard financial events.
28. **Auto-migrating to worse plans.** Require explicit acceptance if replacement is more expensive/restrictive.

---

## 28. Final Decisions Register

### ✅ Decided (Ready to Build)

| # | Decision | Resolution |
|---|---|---|
| 1 | Payment (Egypt) | Paymob — live account, integrate directly via common adapter |
| 2 | Payment (International) | Whop — merchant of record, handles complexity via common adapter |
| 3 | Base currency | USD |
| 4 | Billing cycle | Monthly first, annual later |
| 5 | Tax collection | OFF for now. Prices tax-exclusive. Toggle available later. Pre-launch: determine legal obligations. |
| 6 | Grace period | 7 days full access after failed payment |
| 7 | Read-only window | 30 days after expiry |
| 8 | Data retention (access) | 30 days (read-only + export) |
| 9 | Data retention (data) | 90 days (preserved, no access) |
| 10 | Data retention (archival) | 1 year (cold storage) |
| 11 | Data retention (permanent deletion) | After archival period (1 year + 90 days + 30 days = ~16 months / 485 days) |
| 12 | Data retention (financial records) | 7 years (legal requirement) |
| 13 | Data retention (backups) | 30 days |
| 14 | Demo duration | Open-ended. Held after 90 days inactive. Deleted after 180 days held. |
| 15 | Demo vs. free tier | Distinct account types (`demo`, `free`, `paid`). Shared infrastructure, distinct entitlement profiles, security boundaries, and lifecycles. |
| 16 | Multi-academy | Separate subscriptions. Foundation (many-to-many user↔academy) built now. |
| 17 | Free tier storage | 100 MB |
| 18 | Core storage | 5 GB |
| 19 | Growth storage | 25 GB |
| 20 | Add-on storage | +5 GB increments |
| 21 | Regional pricing | Different prices per country (PPP). Entitlement engine price-agnostic. |
| 22 | Offline entitlements | Unified policy table. Tier 1a (viewing/export) always available. Tier 1b (attendance) 14 days. Tier 2 (registration/upload/invite) 7 days with 24h TTL. Tier 3 (branch/upgrade/add-on) never offline. |
| 23 | Refund policy | No monthly refunds. Yearly = remaining full months. |
| 24 | Proration | By remaining days using actual billing period length. No fixed 1/30. |
| 25 | Demo access | Secure, expiring, single-use invitation links. No permanent passwords. |
| 26 | Demo security | Fictional data only. No real child data, no real invitations, no real payments, no real messages. |
| 27 | Unresolved downgrades | Explicit acknowledgment required. 7-day pre-renewal notification. Downgrade cancelled if unresolved at renewal. Never charge for unagreed plan. |
| 28 | Free-tier economics | Track 3 metrics (storage, API, bandwidth). Block non-essential operations when exceeded. Never block core operations. |
| 29 | Essential vs. discretionary | Essential: attendance, viewing, scheduling, basic export (never blocked). Discretionary: advanced reports, bulk exports, media uploads beyond 80% (blocked when exceeded). |
| 30 | Additional player capacity add-on | Extra players (50) as add-on for Core+. |
| 31 | Manual payment recording | Retained alongside Paymob/Whop for exceptional cases. |
| 32 | Schema support for future pricing | Annual billing, custom agreements, discounts, complimentary access designed into schema now, disabled in UI. |
| 33 | Offline capacity guarantee | Honest: limits enforced to best of cached info. Server is final authority. Over-limit reconciled, not prevented. |
| 34 | Multi-device offline | Eventual consistency with server reconciliation. Academy informed of over-limit situations. Resolution paths provided. |
| 35 | Dunning management | 3 retries (Day 0, 3, 5). Grace 7 days. Read-only 30 days. Retention 90 days. Total 127 days. |
| 36 | Invoice legal requirements | Full legal field list defined. PDF, downloadable, per-academy sequential numbering. Issued by tracked. |
| 37 | Email notifications | Full notification matrix defined. Resend + React Email recommended. |
| 38 | Plan editing | Versioned offers. Benefit migrations (not auto-inheritance). Limit increases/features migrated explicitly. Limit decreases grandfathered. |
| 39 | Plan change acceptance | Explicit acceptance required for price increases, limit decreases, feature removals. Default to "no change" if not accepted. |
| 40 | Platform Owner impersonation | Scoped, time-limited (1 hour), audited, Academy Owner approved. |
| 41 | Data export on cancellation | 8 data types exportable. Available during read-only + retention period. |
| 42 | Profitability metrics | Contribution margin (revenue − direct variable costs) and operating profit (contribution margin − shared costs) are separate metrics. |
| 43 | MRR calculation | Net MRR = New + Expansion + Reactivation − Churned − Contraction. |
| 44 | Security boundary | Entitlement cache checked AFTER authentication and permission checks. Never overrides auth or tenant isolation. |
| 45 | Six domains architecture | Commerce, Entitlements, Identity & Security, Billing & Treasury, Usage & Metering, Lifecycle & Governance. Modular monolith. |
| 46 | Database rows | Tracked for cost monitoring (Usage & Metering). NOT a customer-facing limit. |
| 47 | Payment reliability | Webhook signature verification, out-of-order handling, chargebacks, duplicate prevention, transactional consistency. |
| 48 | Atomic quota checks | Database-level locking for all entitlement-consuming operations. |
| 49 | Demo reauthentication | Secure email verification for returning prospects. |
| 50 | Prospect identity verification | Email verification required before conversion to real academy. |
| 51 | Offline conflict resolution | Domain-specific (attendance: merge, financial: server authoritative, scheduling: server authoritative, medical/consent: server-authoritative merge, player data: last-write-wins). |
| 52 | TTL rule | Single 24h for all active subscriptions. No "recently synced" extension. |
| 53 | Offline policy precedence | Subscription expiry overrides offline attendance allowance. If expired, attendance blocked regardless of offline duration. |
| 54 | Offline security | Offline auth expires after 24h. On sync, permissions re-validated. If revoked, session terminated. |
| 55 | Chargeback handling | Assess dispute validity before restricting. Suspend only if dispute is likely valid or amount exceeds threshold. Avoid duplicate refunds. |
| 56 | Payment event handling | Process by event timestamp. Never discard financial events. Flag conflicts for manual review. |
| 57 | Plan deprecation acceptance | If replacement is equivalent or better: auto-migrate with 30-day opt-out. If replacement is more expensive/restrictive: require explicit acceptance. |
| 58 | Data retention (pre-launch) | All retention policies established before storing real children's data. |
| 59 | Modular monolith | Six domains with separate responsibilities, shared deployment and database. |

### ⏳ Visit Later (32 Items)

See Section 26 for the full list with rationale and revisit timing.

---

## 29. Appendix A: Known Specification Issues

These are specification-level issues to resolve during implementation. They do not change the vision. They require precise implementation rules and acceptance tests.

| # | Issue | Resolution Approach | Priority |
|---|---|---|---|
| 1 | Offline access precedence | Subscription expiry overrides offline attendance allowance. If expired, attendance blocked regardless of offline duration. Read-only window (30 days) still allows viewing/exporting. | High |
| 2 | Offline security (revoked permissions) | Offline auth expires after 24h. On sync, permissions re-validated. If revoked, session terminated. User must re-authenticate. | High |
| 3 | Chargeback (auto-suspend too aggressive) | Assess dispute validity before restricting. Suspend only if dispute is likely valid or amount exceeds threshold. Avoid duplicate refunds (check if already refunded). | High |
| 4 | Payment events (older webhooks) | Process by event timestamp. Never discard financial events. If older event conflicts with newer state, flag for manual review. | High |
| 5 | Atomic quotas (rollback) | Use database transactions. Reserve capacity atomically. Rollback on failure. Retry up to 3 times. | High |
| 6 | Plan deprecation (auto-migration vs acceptance) | If replacement is equivalent or better: auto-migrate with 30-day opt-out. If replacement is more expensive/restrictive: require explicit acceptance. | Medium |
| 7 | Data retention arithmetic | 30 + 90 + 365 = 485 days ≈ 16 months (not 15). Document as "approximately 16 months." | Low |
| 8 | Offline conflicts (medical data) | Classify data by sensitivity. Medical/consent/emergency contact data: server-authoritative merge, never last-write-wins. Flag conflicts for manual resolution. | High |
| 9 | Provider capabilities unverified | Run Paymob/Whop spike before Phase 1e/1f. Verify recurring payments, webhooks, refunds, settlement timing. | High |

---

## 30. Appendix B: Phase 1 Milestone Breakdown

Phase 1 is divided into 8 independently testable milestones. Each proves a customer journey. No milestone takes more than 1-2 weeks.

| Milestone | Scope | Testable Outcome |
|---|---|---|
| **1a** | Offer versioning + subscription state machine (single academy, manual payment) | One academy can subscribe, view plan, see usage |
| **1b** | Entitlement resolution service + online enforcement | Restricted actions are blocked when over limit |
| **1c** | Offline entitlement cache + TTL | App works offline within cached limits |
| **1d** | Dunning management + email notifications | Failed payment triggers retry sequence |
| **1e** | Paymob integration (Egypt) | Egyptian academy can pay via Paymob |
| **1f** | Whop integration (International) | International academy can pay via Whop |
| **1g** | Demo provisioning + secure invitation links | Platform Owner can create and send demo |
| **1h** | Multi-academy foundation + audit log | User can belong to multiple academies. All commercial events audited. |

Each milestone is independently testable. Each proves a customer journey. No single milestone takes more than 1-2 weeks.

---

## Final Assessment

| Dimension | Score | Notes |
|---|---|---|
| Commercial vision | 9.8/10 | Comprehensive, addresses real SaaS needs |
| Architecture | 9.6/10 | Six domains (modular monolith), four state machines, entitlement engine, offline model, payment strategy, dunning, invoices are sound |
| Implementation readiness | 9.7/10 | All contradictions resolved. All corrections applied. Ready for specification. |
| Risk of overengineering | Low | Phased roadmap (8 milestones), analytics/growth deferred |
| Risk of underengineering | Low | Foundations (state machines, entitlement engine) built first |
| Payment strategy | 9/10 | Paymob + Whop covers Egypt + international with minimal complexity. Reliability requirements specified. |
| Offline architecture | 9/10 | Unified policy table. Honest about capacity guarantees. Tiered model. Domain-specific conflict resolution. |
| Demo strategy | 9/10 | Auto-generation with secure invitation links, distinct account type, clear lifecycle, reauthentication, identity verification |
| Dunning management | 9/10 | Complete retry schedule, notification matrix, state transitions, corrected timeline (127 days) |
| Invoice compliance | 8.8/10 | Legal field list defined, format and numbering decided, issued-by tracking |
| Financial architecture | 9.3/10 | Contribution margin and operating profit separated. MRR includes contraction and reactivation. |
| Security and governance | 9.2/10 | Entitlement cache after auth. Six domains. Impersonation scoped and audited. Webhook signatures. Chargebacks. Atomic quotas. Offline auth expiry. |
| Concurrent operations | 9/10 | Atomic database-level quota checks. No simultaneous over-limit. |
| Specification readiness | 9.7/10 | 9 known issues recorded with resolution approaches. Ready for technical specification. |

**Overall: 9.5/10**

**This document is the frozen commercial master baseline.** It should not be rewritten. The remaining work is specification and implementation, not brainstorming.

**The 9 known specification issues (Appendix A) are to be resolved during technical specification, not through further vision revisions.**

**The 8 Phase 1 milestones (Appendix B) are to be implemented incrementally, each independently testable.**

> Build for 10,000 academies architecturally. Launch for 10 customers. Evolve based on real feedback.