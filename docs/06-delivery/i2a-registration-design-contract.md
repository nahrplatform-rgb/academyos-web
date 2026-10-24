# I2a registration: design, data and security contract

24 October 2026. Policy accepted in [the decision packet](i2-people-first-slice-decisions.md); dependent design review pending. J06-A01, S16–S18, AO-013/016 and scoped AO-118/120/121/122/124/127/149–160; L05/L06, SEC-J06. These are scoped joins, not whole-family completion.

## Connected action

Current Academy Owner → explicit academy/initial branch → player directory → new fictional display name and optional unverified contact email → academy-scoped name candidates → open an existing profile or explicitly identify a different person → review → authoritative create → receipt and saved profile. Contact save is never guardian verification, membership, invitation, payer or consent. No player login, enrollment, deletion, merge or operational activation.

The [connected review source](../../design/i2a-registration-review/README.md) uses the actual shared compact-blue shell/controls and clearly labelled synthetic model. EN/AR, phone/desktop, empty/denied/unavailable, pending, validation, same-name distinction, concurrency-induced new candidate, lost-response reconciliation and retryable failure are reviewable. It has no real authentication, API or database write. No new business UI is yet deployed.

## Exact initial fields and projection

- Display name: required, trimmed,1–160 characters; retain entered writing/case for display. It is a fictional display name, not evidence of legal identity.
- Parent/guardian contact email: optional, normalized for storage, max254; proposed staging guard permits only `@example.invalid`. Label unverified and contact-only. No separate guardian person/link/account created.
- Academy and initial branch: selected server-authorized UUIDs, not user-editable free text. Do not allow a foreign branch or silently fall back to a different academy.
- Server-created player UUID, registration version and timestamp. Initial technical state means registered record only, never enrolled/eligible/commercially active. No birth date, age band, health, legal identity, attachments, finance, consent or relationship evidence in I2a.
- Directory: player ID, display name, branch label and registration timestamp only. Contact email is fetched on authorized profile open, never in every list/candidate row. Candidate projection excludes contact email entirely.

## Proposed authoritative operations

Inspect/reuse Clerk identity resolution, current database membership, private schema/RLS, fail-closed signed/rate-limited RPC transport, opaque operation references and redacted audits. Current gateway and database subject helper allow only named M1 methods: new methods require explicit named additions and regression denial tests, not a wildcard or bypass. Current `m1_owner` is membership authority; it does not by itself establish new people policy. Add a people-specific guard requiring active owner, correct academy/initial branch and completed initial setup in synthetic staging; incomplete setup has a safe prerequisite destination. The setup-complete prerequisite is a proposed technical flow guard for review, not commercial activation.

Proposed endpoints/RPC names are design choices pending source implementation:

| Operation | Bound / authority | Outcome |
|---|---|---|
| People context/list | Current owner; academy/initial branch;25 rows+sentinel; stable UUID cursor; server-normalized name search max160 | Minimal page and `more`; no global totals, contact fan-out or other tenants |
| Duplicate review | Current owner; same academy, across its branches; exact normalized-name match;25 candidates+sentinel | Minimal candidates and a reviewed-name-set revision; explicitly paginate candidates when more |
| Player profile | Current owner; academy+player binding; one minimal profile | Optional unverified contact field with no relationship authority |
| Create player | Current owner/branch rechecked; original operation UUID; normalized intent and reviewed candidate revision | Atomic player+optional contact+receipt+audit; no external side effect |
| Operation lookup | Current actor, original UUID, current owner for receipt academy | Found/not-found/denied; result reference only; profile fetched separately |

Do not reuse M1's broad operation receipt for a differently authorized future actor without action-specific current checks. Proposed people receipts may share the private operations store but must use a distinct action and current people guard. Store canonical intent fingerprint and result IDs/version rather than names/contact in operation logs/audit details. No raw form payload in telemetry, URLs, browser storage or screenshots from real data.

### Duplicate and concurrency contract

The server defines normalization: Unicode NFKC, whitespace collapse/trim and case normalization using one tested database routine. No fuzzy matching, transliteration, global identity search or automatic merge. Normalized equality is a review hint, not proof of identity. Directory search semantics are separate and must be documented as scoped name search, not complete identity deduplication.

Review binds academy, normalized name and a transactionally maintained same-name revision. Use a private keyed revision row `(academy_id, normalized_name)` and an indexed player lookup, not a hash/aggregation of every matching ID. Serialize candidate-page reads and creates for the same academy/name with a transaction advisory lock; compare the reviewed revision before insert and increment it atomically with create. A newly committed same-name player returns a review-required conflict with refreshed candidates, even if the original page showed none. Re-review gets a new operation intent only after the prior attempt is definitively rejected; unknown outcomes keep the original UUID. An existing candidate requires explicit different-person confirmation. The name revision covers the entire same-name set while candidate reads stay bounded. Each candidate page carries that revision; if it changes between pages or before confirmation, refresh the review. Show `more` and explicit next-page controls; never imply that the first page is the complete set. Future rename/archive/merge actions must update affected name revisions through their own reviewed contracts. No unique-name constraint, hidden auto-merge or new duplicate identity fields.

First lock/revalidate current membership/academy/branch under a consistent order; then actor/operation and academy/name locks. Exact replay returns the one committed player reference only after current authorization. Same operation UUID with a changed name/contact/branch/confirmation/revision conflicts. Concurrent revocation and create must serialize so a write cannot commit after an earlier revocation committed. Test deadlock/retry behavior; do not silently regenerate intent.

## Retrieval, freshness, cost and budgets

L05 directory: one useful context/page operation;25 rows per request,25+sentinel on server; optional search debounced300ms with obsolete requests aborted/ignored; no search shorter than2 normalized characters unless empty browse. L06 profile fetched only on open; one projection, no forbidden tabs. Duplicate review occurs on deliberate Continue, not every keystroke. Client shows matching/candidate pagination limits; no hidden truncation or whole-academy total query.

Private `no-store` responses. Identity/academy/branch changes clear projections and drafts and reject late responses. In-memory drafts only; a reload can lose an unsaved form and says so. Persist only opaque actor/academy-scoped operation UUID for uncertain-save recovery. Fresh reads on re-entry/resume/refresh and after confirmed write. No cached permission authorizes create; commit revalidates current state. Contact stays off directory/candidate projection and general logs.

Proposed budgets to measure, not passed results: per list/candidate/profile response ≤32KiB; normal fresh registration ≤4 business RPCs (page/context, candidates, create, profile); zero delivery/job/storage side effects; each business RPC spends the existing shared gateway actor budget; preserve the distinct route-entry limit where applicable rather than claiming it is free or double-counting it as another business RPC. Preserve existing60-read/10-write per-minute transport limits unless a reviewed change is needed. Database statement3s/lock2s maximum, route15s outcome boundary. Target warm authenticated API p95≤800ms/read and≤1200ms/create; first useful page p95≤2.5s on declared desktop and midrange-phone/4G profiles; feedback for a click within100ms, CLS≤0.1. Measure50 observations/profile and record cold starts, query plans, rows, bytes, retries and provider command counts. Limits are not an SLA or hard billing ceiling. Use two small academies plus a skewed fixture with ≥1000 players and repeated common names; no real data. Optimize only on evidence.

## Independent security gate and acceptance cases

Assets: player/contact projections, branch binding, operation reference and audit. Crossings: browser→authenticated route→shared limiter/proof→named RPC→private tables. Platform capability alone grants no player/contact access; manager/trainer/guardian/player have no I2a operations. RLS plus revoked direct table grants remain defense in depth; constrained functions check current caller/resources, fixed search path and explicit EXECUTE ACLs. New SECURITY DEFINER boundaries require exact negative tests/advisors, never broad exposure to fix access errors. See official [function security guidance](https://supabase.com/docs/guides/database/functions).

Required cases: A owner versus B player/branch/receipt; platform-only and all wrong roles; anonymous/forged/direct JWT without gateway proof; suspended membership during read/create; stale identity response and contact-field isolation; repeated/exchanged UUID and changed intent; two concurrent same-name saves; >25 candidate handling and stale review; empty search versus failed lookup; oversized/unexpected fields; limiter failure/timeout; commit followed by dropped response; interruption before commit; no side-effect job, invitation or membership; literal text/XSS-shaped names; EN/AR keyboard/native validation, phone reflow and safe navigation/discard.

Detect through safe correlated operation IDs and redacted denied/conflict/limited outcomes, not free-text payload logging. Contain by current membership and fail-closed transport; recover through same-operation lookup or refreshed duplicate review after a definite rejection. Any discovered foreign/contact leak blocks rollout. Human independent security review and physical-device acceptance cannot be supplied by this design model or an AI's self-review.

## Review and implementation sequence

Owner policy is accepted. Connected design review remains pending. After review: implement private schema and exact operations locally; test real SQL/HTTP/React boundaries; rehearsal/backup before hosted schema apply; stage app/RPC compatibility so no unsigned direct-write window opens; verify synthetic two-academy runtime without new grants or outbound invites. Production, real data, guardian access, financial/retention/deletion policy remain excluded. Record design, source, local checks, hosted apply/deploy/runtime and owner acceptance separately.

## Design evidence — 24 October 2026

The [connected preview](../../design/i2a-registration-review/README.md) reuses the current app shell and controls with fictional in-memory state. Its [browser receipt](../../design/i2a-registration-review/evidence/browser-review.json) distinguishes simulated recovery from database proof. Required fields, duplicate confirmation, existing profile, pending/unknown/failure recovery, draft clearing and EN/AR preservation were manually checked. Prototype TypeScript and source hashes passed; phone DOM measured 400px despite a 360px viewport request. Exact 360px, physical-device and screen-reader checks remain open. No app/database/provider mutation was made. This packet is ready for connected design review, not accepted implementation.
