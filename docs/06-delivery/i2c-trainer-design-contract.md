# I2c trainer entry — connected action and boundary contract

25 October2026. [Policy accepted for design preparation](i2c-trainer-entry-decisions.md); connected design approved for implementation on 25 October 2026. J08-A01 proposed subdivision, with J03/J05 invitation/authority cases; S20/S21 and minimal own-Trainer profile; L03/L05; SEC-J03/J05/J08. AO-002/003/004/005/006/007/008/009/016/019 are scoped authority/invitation/projection joins. AO-017 transfer remains deferred. This is not broad staff management or Trainer Today implementation.

## Journey and commit boundaries

Current Owner selects the existing initial branch after completed setup, enters fictional staff name/intended recipient → explicit fixed Trainer scope review → one atomic pending profile/invitation/operation/audit → durable delivery queue → intended verified recipient review → explicit accept creates/links distinct identity, staff profile, Trainer membership and branch assignment atomically → restricted own profile → Owner reviews end/reason → Trainer role/assignment end atomically → next Trainer operation denied. Preserve unrelated roles, academies and history. No membership becomes active from delivery alone. Unknown outcome reconciles original operation before replacement; a missing operation must be fenced against delayed completion.

Actual branch and Owner authority are derived on the server, never from the prototype fixture. Initial branch selection is explicit but this narrow slice has no multi-branch creation/transfer selector. Suspended or ended existing membership cannot be reactivated by accepting an invitation. The duplicate recipient path inspects the existing scoped appointment; it does not merge by name or mint another invitation. Later reappointment/restoration needs separate policy and actual grant authorization. No ending action may target an Owner or another role through a generic membership ID.

## Field projections and current authority

| Surface | Retrieve | Exclude |
|---|---|---|
| Owner list | Up to25+sentinel, staff name, Trainer role, branch, current state/version and masked email | Compensation, employment documents, identity/session tokens, foreign staff or full contact export |
| Deliberate Owner inspection/review | Exact selected name/branch/role and intended recipient, lifecycle/delivery/expiry/version | Other membership roles, private family data, broad identity lookup |
| Wrong/unverified recipient | Generic sign-in/unavailable/recovery | Staff name, email, branch and confirmation that a foreign invitation exists |
| Intended verified recipient review | Approved own staff name, Trainer role, branch, exact offered access and expiry/state | Other staff, players, contracts, academy-wide authority |
| Accepted Trainer profile | Own synthetic name, Trainer role, current branch assignment | Directory, player/guardian data, salary, qualifications, documents or inactive/foreign assignments |
| Ending/recovery | Exact actor-scoped operation/link state; Owner-selected Trainer target/reason privately retained | Generic receipt access returning private data from earlier M1/people/guardian operations |

All commands/reads recheck active membership and exact academy/branch/profile capability at the data boundary. Multi-role identities use explicit role-specific routes/projections; an Owner elsewhere gains no Trainer access here. End/revoke/read/accept/replay need deterministic lock order and current-authority tests. No platform-only bypass or service-key caller authority. Worker checks current approving authority, valid invitation, signed lease and allowlisted recipient before delivery.

## Bounded loading, freshness and recovery

Lists25+sentinel with stable cursors, no global total or whole-directory profile fan-out. Selected detail fetched on deliberate inspection; recipient loads one narrow invitation and one own profile. No salary/player tabs or fake session counters. Private no-store, scoped cache keys if introduced; abort/ignore obsolete actor/branch results. Recheck at resume/focus and after operations; distinguish failed lookup from successful empty state. Denial clears projection and draft. Store only scoped opaque recovery references, never names/emails/reasons or verification tokens in browser persistence/telemetry.

Proposed unmeasured budgets: response≤32KiB, public input≤8KiB, DB statement3s/lock2s, route15s, feedback≤100ms, CLS≤0.1. Retain existing shared fail-closed60read/10write per-minute transport and separate entry limits unless measured evidence justifies change. Named-network first-use p95≤2.5s, warm read≤800ms/mutation≤1200ms are measurement targets, not verified claims; collect50 samples/profile and report cold-start/identity/limiter/provider time/bytes/rows separately. Retry the original delivery under stable provider idempotency; unknown provider outcome never automatically creates replacement authority. No purchase, new telemetry or hosted load implied.

## Connected design states

[Simulation source and instructions](../../design/i2c-trainer-review/README.md). EN/AR phone/desktop: initial empty, explicit scope, review, disabled pending, profile/invitation pending acceptance, failed delivery and same-invitation retry, duplicate existing appointment, unverified/wrong recipient, wrong branch, suspended membership, expired/revoked/ended, lookup failure, uncertain original-operation recovery and Owner ending/reason. Actor/verified/scenario switches belong only to the simulation. Native labels/checkboxes/buttons, heading focus and RTL are retained from shared components; no macOS window dots.

## Required real verification after design approval

Two academies and wrong branch; Owner/Manager/Trainer/Guardian/Player/platform-only; same identity with separate roles; wrong/unverified/expired/revoked recipient; no automatic suspended/ended reactivation; name duplicate versus same intended recipient; current approval before delivery/acceptance; concurrent accept/revoke/end/read and operation replay; response loss, cancellation fences, delivery publication/provider/lease failures; private table/function ACLs and unsigned direct JWT calls; receipt cross-domain isolation; context-switched delayed responses; EN/AR/keyboard/physical device/screen reader; declared workload/cost measurement. Inspect source/gateway contracts before extending named endpoints.

Contain by disabling only new entry/RPC/delivery capabilities; preserve staff/audit history and repair forward. Backup/restore rehearsal, advisors and compatible gateway rollout precede a hosted migration. No seed accounts/roles/recipients. Each hosted invitation or restoration needs separate explicit authorization. Independent human review remains separate from implementing-agent checks. No production/real staff rollout follows from this design.

Status: policy accepted; design approved for implementation; source implementation/local checks complete; hosted migration, Trainer journey verification and working acceptance pending. See [implementation evidence](../07-handoff/i2c-trainer-implementation.md).
