# M1 — controlled synthetic academy onboarding

22 October 2026 · Packet M1/v1 · Owner: Moamen · Source assessed: `a475dadda5294510e43c7a64c14f29603bfa8748`.

**Policy and design accepted by Moamen on 22 October 2026 in this implementation chat. M1-D2, M1-D3a–d, M1-I, M1-S and M1-R are accepted for this synthetic staging slice. Working-journey acceptance remains pending. No privileged grant is authorized by policy/design acceptance.**

Approved [connected prototype](../assets/onboarding-m1-prototype.html). Its role switch and scenario controls are design tools, never proposed authorization controls. All records and outcomes in it are simulated. Moamen approved the connected design for implementation on 22 October 2026; runtime and native-language usability acceptance remain separate. Local browser persistence demonstrates a draft/checklist concept only; it is not proof of database persistence or a proposed storage policy for real data.

## Authorized outcome and current boundary

Platform Owner creates a synthetic academy → appoints its intended Academy Owner → recipient authenticates and accepts → enters that academy's setup-only workspace → saves and resumes branch/sport setup. Current instruction permits implementation, tests, commit/push and deployment to existing protected staging **after dependent business decisions and design review**. Production, real academies/children/customers, purchases/upgrades and privileged grants retain separate explicit authorization.

The engineering charter, accepted repository decisions and current owner instruction govern this work. No later discussion in another chat is assumed. Relevant families: J01–J05; screens S02/S03/S06/S07/S13–S15/S21; loading rows L01–L03. Requirement coverage is scoped below, rather than claiming all these families complete.

## Assessment: preserve and extend

| Layer | Observed implementation/evidence | M1 delta |
|---|---|---|
| Repository | npm workspace, Next.js 16.4.2 / React 19.3.1 / TypeScript; EN/AR layouts and light Workspace tokens | Reuse shell, tokens, localized route pattern; introduce only the needed forms/status/context primitives |
| Identity | Clerk route protection with authorized staging origins; caller-token Supabase client, publishable key, exact project binding, no-store and 10-second fetch bound | Reuse authenticated identity; add verified invitation-recipient proof and current platform/tenant capability resolution |
| Membership | `loadMemberships` bootstraps identity, validates five tenant role labels; read-only workspace distinguishes unavailable/empty/list | Bounded context chooser, academy-specific setup landing, current revocation checks; no grant from signup |
| Database | Four migration files; private academy identities/academies/memberships, active-membership index, caller-bound bootstrap/list RPCs; no platform role, branch, sport, invitation, outbox, audit or operation tables | Add reviewed private records and narrow transactional operations; retain table-denial boundary |
| Providers | Setup-only Redis throttling, signed QStash callback and one approved-recipient Resend test exist | Reuse clients/configuration validation; setup callback/email are **not** business delivery/outbox implementations |
| Monitoring/recovery | Existing privacy filters, encrypted backup/restore and operator receipts in setup index | Safe operation/audit references; no new replay/tracing/raw request capture; rehearse forward repair of this slice |
| Tests | 15 existing unit tests passed and lint passed in this assessment on host Node 26.9.0 (repository calls for Node 24); existing E2E targets public EN/AR, phone layout, unconfigured denial and process health | Add real transactional, direct access, concurrency, recovery and authenticated browser coverage after approval; use supported Node 24 for build evidence |

Live read-only checks in this assessment: Supabase project `academyos-staging` / `snpphkenmvmhpjstbeul`, eu-west-1, PostgreSQL 17.11, ACTIVE_HEALTHY; four hosted migration versions exactly match repository files. Catalog query confirmed all three academy tables have RLS and no authenticated SELECT/INSERT grants. The table-list connector failed; the narrow catalog query supplied the stated evidence. No private identity rows were read. Existing setup receipts are historical runtime proof, not a new signed-in browser test here.

GitHub [foundation run 39762450348](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39762450348) succeeded at the assessed commit. Inspection of `main` protection returned HTTP 403 / plan-eligibility error. Branch protection is **not verified**; do not buy a plan or make the repository public. This does not contradict the selected protected staging environment, whose access protection must also be rechecked before demonstration. No infrastructure rebuild is needed.

## Accepted M1 choices — Moamen, 22 October 2026

| Choice | Accepted M1 selection | Alternative and consequence |
|---|---|---|
| M1-D2 / D-002 admission | Invite-led pilot. Only a currently provisioned Platform Owner can create a synthetic academy and nominate its first owner. Public signup creates identity only. Show pending owner/setup separately from operational activation. | Public applications with review require additional admission/abuse/rejection flows; retain in later scope |
| M1-D3a / D-003 roles and branches | Fixed selected role templates; Academy Owner has academy-wide setup authority. Other tenant roles have no M1 setup writes. Future manager operational access requires explicit branch scope and named capabilities; no wildcard from an empty branch list, no custom roles/delegation editor in M1. | Custom roles/delegation now expands policy, UI and security surface. It remains future scope, not cancelled |
| M1-D3b / D-003 ownership | One accountable active Academy Owner initially; before acceptance, pending appointment confers no tenant access. Acceptance atomically installs that owner. Platform authority does not create tenant membership or private-content access. No generic staff edit, last-owner removal, transfer or emergency reassignment endpoint in M1. | Multiple owners requires conflict/quorum/last-owner rules before implementation. Transfer/disputed recovery stays a dedicated later reviewed workflow |
| M1-D3c / D-003 initial platform provisioning | Explicit audited one-time operator procedure binding Moamen's separately confirmed Clerk subject in this staging issuer to platform capability. Require fresh authenticated identity confirmation, named grantor/reason, before/after verification and revocation test. No first-signup, email/domain allowlist, token metadata or public provisioning endpoint. | Self-enrollment or first-user admin enables takeover. Environment allowlists lack the desired durable grant/revocation audit |
| M1-D3d / D-003 lost sole owner | Fail closed; preserve records. Clerk identity recovery does not transfer academy ownership. A disputed/lost owner opens a manually reviewed recovery case with verified evidence and a separately approved recovery action; no automated bypass. M1 must explain this limitation and provide a safe support reference. | Automated reassignment needs approved evidence/reviewer/notification/dispute rules first. Do not invent a cooling-off interval |
| M1-I / invitation mechanics | Recipient must authenticate and have the exact intended verified email; no email/account mutation to make it match. Proposed expiry: 72 hours, measured by database time. Revoke/reissue invalidates the previous secret. Resend retries the same invitation/delivery intent without extending expiry. Same-subject redemption returns its original receipt; another subject is denied. | Longer validity increases link risk; magic-link possession alone is insufficient recipient proof. Duration can be changed by owner before build |
| M1-S / setup and AT-011 | Create academy + pending appointment + operation/audit + delivery intent atomically. Keep one recoverable provisioning operation open through owner acceptance and the first valid branch/sport save. Only that final atomic save can mark **initial setup complete**. No auto-named branch/sport or implied commercial activation. | Creating branch/sport at admission requires Platform Owner to supply tenant setup earlier and changes the requested handoff. See traceability limits below |
| M1-R / configuration inputs | Owner enters branch name, sport EN/AR labels and an explicit IANA academy timezone; no guessed country/currency, fees or sport catalog. Save branch and sport as separate resumable steps, then bind selected sport to branch in final review. At least one branch and one enabled sport association are the proposed initial completion rule. | A platform-seeded sport catalog needs an owner-approved catalog; preserve AO-012 seed/archive scope for later, rather than inventing sports |

Accepting the provisioning **design** does not authorize executing a privileged grant. Before execution prepare the exact staging subject, grant/capability, audit and revoke procedure for explicit authorization. No such grant is executed in this packet. Invitation email delivery also stays within the current approved recipient restriction; obtain the intended test mailbox authorization before sending elsewhere. No real recipient/customer onboarding is implied.

D-009 commercial activation/entitlements, D-014 broader messaging and D-015 real-data retention remain unresolved. M1's restricted workspace means **setup-only**, not billing suspension, a trial or an operational plan. Do not invent prices, grace periods, retention periods or a commercial activation rule. D-001 country/currency/contact profile requirements remain unfinished prerequisites for later operational activation; setup-complete does not claim the entire academy profile is launch-ready.

## Connected journey and action contracts

Navigation: Platform workspace (S06) → create/review (S07) → appointment/delivery receipt (S21) → authenticated recipient acceptance (S02) → explicit context (S03) → setup checklist and editors (S13–S15) → initial-setup receipt. Keep platform and tenant navigation visibly distinct. Do not render unavailable operational modules as enabled links.

| Stable action | Actor / outcome / requirements | Inputs and proposed atomic boundary | Handoff, recovery and audit |
|---|---|---|---|
| J02-A01 | Platform Owner creates pending academy; AO-003/008/011 | Name, intended owner verified destination, review of setup-only consequence; transaction: academy, pending appointment, durable operation, audit, outbox intent; actor derived server-side | Receipt separates saved academy from queued/accepted/failed email. Lost response: lookup same operation. No owner membership yet |
| J03-A01 | Intended recipient reviews invitation; AO-005 | Authenticate; server-only verified-email proof; retrieve minimal invitation for current subject, no secret in rendered URLs/telemetry | Wrong account explains switch without revealing recipient/foreign details. GET never accepts or grants authority |
| J03-A02 | Recipient accepts appointment once; AO-005/006/007/008 | Lock invite + academy owner slot; check expiry/revocation/current issuer/recipient/provisioning state; transaction: redemption, owner membership, setup phase, audit, operation result | Exact academy/name/owner-role receipt. Concurrent redemption has one winner/result. Lost response resolves original operation before retry; no identity replacement |
| J01-A01 | Current user chooses/enters context; AO-002/003/004/009 | Membership cursor/list with academy and role; recheck selected membership before returning setup projection | No automatic fallback to another academy. Clear incompatible selections and late responses; show no-membership versus service failure distinctly |
| J04-A01 | Academy Owner saves branch/timezone draft; AO-003/004/011/019 | Target academy, branch name, explicit timezone, expected setup version, operation ID; one transaction: branch draft/setup progress/audit/receipt | Server persistence drives resume. Unsaved edits are labeled; stale version returns authoritative version and retained local intent for review |
| J04-A02 | Academy Owner saves sport configuration; AO-003/004/012/019 (partial AO-012) | EN/AR labels, target academy, expected version, operation ID; one transaction with setup progress/audit | Resume after refresh. No default sport injected. Archived/foreign references rejected; archive management/seed catalog remain future coverage |
| J04-A03 | Owner reviews and completes initial setup; AO-011/019 | Revalidate current owner, branch/sport same-academy active state and timezone; atomic association + completion version + provisioning completion + audit/receipt | Failure leaves setup incomplete; no false ready state. Successful result names saved records and clearly says operational modules await later release |
| J03-A03 | Platform Owner resolves delivery or withdraws pending appointment; AO-005/006/008 | Current platform grant and invitation version; audited revoke/reissue or retry existing delivery; acceptance race serialized against revoke | Revocation before redemption denies it; if acceptance wins, withdrawal cannot remove owner through invitation tooling. Requires separate ownership workflow |

These are the approved M1 action contracts, not SQL signatures; actual source/local results and remaining gates are recorded in the implementation receipt. Reuse existing caller-bound Supabase RPC access; review current Clerk verified-email claims/server API and signed assertion design before build. Client-supplied email, role, actor or `verified=true` never proves authority. If verified recipient proof cannot reach the database safely, fail closed and choose a bounded server assertion design with explicit privilege review; do not add a broad service-role bypass.

Proposed records: explicit platform grants/revocations; academy provisioning phase/version; private invitation (hashed secret, intended destination, expiry, redeemed subject, version); tenant branch/sport/association records; actor-scoped operation result; audit events; delivery outbox/attempts. Existing identities/memberships remain canonical. No duplicate identity provider or alternative membership store.

Operation contract: key scoped to environment + authenticated actor + action; immutable canonical request hash and result. Same key/same payload returns stored result **only after current authority is checked**; changed payload is conflict. Serialize role/revoke/accept paths using a common lock order to prevent authority-change races. Database constraints protect one initial owner, same-academy references and unique operation effects. Do not infer academy-name uniqueness as a business rule: warn about a potential duplicate and show the existing operation, but two intentional equal names are not silently merged.

Outbox effects start only after commit; job delivery is at-least-once, business intent deduplicated. Use leased claims and provider idempotency, bounded retry, safe dead-letter state and reconciliation. A provider timeout remains unknown until reconciled; do not create another invite or extend expiry to fix it. Notification failure never rolls back a committed academy. Operator containment can pause delivery/revoke a pending invitation under current authority; no arbitrary destination override.

## Prototype and state coverage

The prototype is separate from `apps/web`: no route, API, middleware, real provider call or customer data change. It reuses visual tokens/patterns and models both personas explicitly. Phone uses a task-first single column; desktop keeps context and progress beside the active form. EN/AR toggles preserve simulated state; email/IDs stay LTR. Use browser viewport resizing or the Phone/Desktop controls. Every successful action says **simulated** in the review banner.

| State | Visible behavior / recovery |
|---|---|
| Empty / no membership | Platform queue starts empty; recipient has no authority until acceptance; no fake dashboard totals |
| Loading | Reserved panel with explanation and explicit simulated completion; no endless spinner or empty-result substitution |
| Validation | Labels, required constraints and accessible summary; maintain typed values and return focus to invalid field |
| Pending / partial | Academy saved while invitation is queued or delivery failed; retry delivery only, not academy creation |
| Saving | Visible local feedback; production implementation must await authoritative receipt |
| Wrong account / expired / revoked invite | No accept action; safe account-switch or inviter-reissue guidance |
| Unknown commit | Disable replacement; check original operation; reconcile simulated receipt before continuing |
| Failed read/save | Error and retry, preserving valid input; never convert failed lookup to zero memberships |
| Conflict | Show current saved state and local-intent review; no last-write-wins overwrite |
| Revoked membership | Deny setup, retain no usable private context, offer authorized context chooser; never replay draft to another academy |
| Interrupted/resume | Checklist restores only saved simulated branch/sport state; unsaved input is not called saved |
| Complete | Named branch/sport and saved setup receipt; still setup-only; no invitation-delivery or commercial-launch inference |

Prototype scope: staged role/scenario simulation, not actual authentication, database, inbox delivery, device offline access or security evidence. Arabic copy requires native owner review. Keyboard, reflow and focus checks here are proxy checks; genuine task observation and screen-reader testing remain separate.

## L01–L03 retrieval, freshness and budgets — proposed build contract

All private responses: `no-store`, no CDN/shared data cache, no localStorage business records or invitation secrets. Request-local deduplication only when subject/context match. Keys include environment, subject, academy, role/scope, projection version and locale. Logout/context change clears in-memory projections, cancels in-flight work and rejects late results. Revalidate on new navigation/resume and every operation; previously delivered bytes cannot be recalled. No background tab polling or provider-dashboard fan-out.

| Projection | Bounds and critical fields | Freshness / work / retry |
|---|---|---|
| L01 membership/context | 25 memberships per page + one has-more sentinel; stable academy name/academy ID/role/membership ID sort; opaque cursor bound to filter/subject; IDs, name, role, permitted setup route only; ≤16 KiB JSON/page | Class A for context/current authority. Existing unbounded membership RPC must be extended compatibly. One bootstrap then bounded list; first setup projection incorporates current authority; avoid duplicate bootstrap per widget |
| L02 platform queue/detail | 25 pending academies/page + sentinel, `(created_at,id)` cursor; name, safe provisioning state, appointment/delivery state, operation reference; ≤24 KiB/page; selected detail ≤8 KiB | Current platform grant per read; no children, staff profiles or provider billing APIs. Refresh after commit or explicit retry, not periodic polling |
| L03 invitation review | One recipient-authorized invitation; academy display label, role, expiry/state and safe operation reference; ≤4 KiB; no unrelated recipient directory or raw secret | Class A, DB clock at redemption; recipient proof current. Invalid/foreign token returns generic unavailable response before private disclosure |
| L02 owner checklist | One academy progress/version/timezone; first 25 branch/sport labels + explicit pagination/sentinel ≤16 KiB; selected draft/detail ≤8 KiB | Class A action; bounded fresh read at entry/resume/save; no loading all future setup entries to compute progress—existence predicates/required-record checks |
| Operation receipt | Single actor-authorized operation/status, affected IDs and safe error code; ≤4 KiB | Current scope on every lookup. On unknown outcome, max 3 reads at 1/2/4-second intervals then manual check; honor 429 Retry-After; no uncorrelated replacement mutation |

Server enforces input/body/row/response ceilings; proposed 16 KiB mutation body, name/label limit 160 characters, no free-form raw HTML. Validate timezone against supported IANA values. Lists sort deterministically; response exceeding bounds returns an explicit recoverable size error, never silent truncation. Cursor filtering may not bypass role/tenant checks. One safe read retry with jitter for transient failure only; total deadline 10 seconds. No automatic mutation retry before status reconciliation. Proposed statement timeout 3 seconds for these short transactions; cancellation rolls back and outcome must be looked up if commit status is unknown.

Expected work per ordinary read: one bounded RPC after identity resolution, indexed subject/membership/academy lookups and no per-row provider calls. Per mutation: one database transaction plus safe post-commit projection refresh. Delivery: one outbox intent per invitation, at most five transport attempts with exponential backoff within remaining validity; exhaustion is visible pending/operator recovery. Retry policy is an engineering proposal, not a promise of delivery. Use existing approved Redis throttling pattern with explicit unavailable behavior; fail closed for privileged writes. Proposed per-actor safety ceilings: 10 create attempts/10 minutes, 20 acceptance attempts/10 minutes and 5 delivery retries/invitation/hour, with broader abuse controls at entry. These are abuse bounds, not commercial limits.

Measure on staging after build: Chromium desktop 1440×900 and phone emulation 390×844/360×780; EN/AR; explicit synthetic 150 ms RTT, 1.6 Mbps down/750 Kbps up and 4× CPU slowdown profile, plus unthrottled baseline. These are repeatable lab conditions, not a claim to represent every device. Real iOS/Android browser checks remain pending. Synthetic workload: two small academies and one skewed academy; 30 memberships for chooser paging, 60 branches/sports for pagination, 20 concurrent setup readers and 10 simultaneous duplicate/conflicting writes. These are test assumptions, not product/customer limits.

Budgets: p75 first useful task ≤3 seconds including auth/context (cold/warm separately), p75 local feedback ≤200 ms, p95 server read <800 ms, p95 ordinary transaction ≤1 second, CLS ≤0.1. Run ≥50 successful samples per route/profile and ≥20 injected-failure runs per relevant recovery case; separately report timeout/failure counts and auth/provider time. No measured M1 runtime performance exists yet. Inspect query plans with synthetic workload and record rows/work duration, payload/transfer bytes, application requests, Redis commands, outbox attempts and sends per completed/abandoned journey. No new paid analytics or PII telemetry. Budgets are review targets; do not weaken correctness to hit them.

Cost: no new service/dependency/provider upgrade. Expected baseline per create is one transaction, one projection refresh and one delivery intent; retries are bounded as above. Actual Clerk/DB requests and meter costs must be measured, including abandoned paths. No monthly price/zero-cost claim. Preserve current approved-recipient sender and monitoring filters.

## SEC-M1/v1 — independent security gate

Reviewer: engineering assessment in this chat, 22 October 2026; owner/independent security review pending. Environment: synthetic local and existing staging only. Assets: platform grants, intended recipient, invitation secrets, ownership, academy configuration, audit/operation integrity. Trust crossings: browser→Clerk→server→database caller RPC; privileged delivery worker→Resend/QStash; retry/status lookup; environment and tenant/branch boundaries. Private files/exports/payment/offline are not exposed by M1, so no new permission paths for them.

Prevention: retain issuer/authorized-party checks and private tables; derive actor from verified session; current capability/tenant/field/resource checks inside each authoritative operation; exact recipient proof and expiring hash-only secrets; prohibit unsafe redirects; check same-origin/CSRF and JSON content type for browser writes; redact token query/path and email from telemetry, never put invitation secret in event payloads. Proposed link exchange uses a URL fragment cleared immediately, no third-party resources on acceptance, no GET mutation, `Referrer-Policy: no-referrer`; verify Clerk sign-in return preserves only a safe opaque reference. Concrete proof/exchange design must be reviewed before implementation. Audit must record actor, action, target, safe before/after scope, time, operation and reason with access controls; no raw recipient/token in logs.

Detection/containment: safe action/error/operation code to existing monitoring; throttled denial events without account enumeration; Moamen is staging operational owner. Pause only invitation delivery or revoke the pending invite/current capability under approved procedure. Revocation and mutation serialize on the same authority records so no stale request commits after a completed revocation. No weakening authentication or exposing whole tenant records for debugging.

Recovery: reconcile durable operation; retry only uncommitted effect; preserve original identity/tenant and history. No reverse migration deleting academies/audit on rollback. Disable new entry points and pause new delivery before reverting app; keep additive schema/backward-compatible RPCs; inspect pending/unknown operations and forward-repair with audit. Validate backup coverage of new tables before apply and local restore/replay before hosted migration. Synthetic fixture cleanup requires its own bounded reviewed action, never broad cascade deletion. No new synthetic privileged fixture in hosted staging before grant authorization.

| Case ID | Input and required result | Required evidence layer |
|---|---|---|
| M1-T01 | Two academies; owner A submits valid B academy/branch/sport/operation IDs; deny every read/write/receipt without foreign fields or state change | DB/direct RPC, HTTP and deployed browser |
| M1-T02 | Manager (wrong branch too), trainer, guardian, player and ordinary signup call platform/setup operations directly; deny. Platform role alone cannot read tenant setup/private records | DB + HTTP; UI isn't proof |
| M1-T03 | Suspend/end membership or revoke platform grant while page open; next read/write denied; race revoke with commit and verify serial order | Two DB connections + authenticated browser |
| M1-T04 | Wrong issuer/session/account/unverified email, modified secret, expired/revoked invite; no membership, identity mutation or private recipient disclosure | DB logic + actual Clerk/Data API/HTTP integration |
| M1-T05 | Ten simultaneous same-key creates/accepts: one effect/result; same key changed payload conflicts; distinct-key accept race still one initial owner | Independent concurrent DB sessions; row/audit counts |
| M1-T06 | Interrupt before commit, after commit before HTTP receipt, during provider timeout; reconcile original operation, no duplicate academy/owner/message intent | Fault injection at each boundary + persisted rows + UI |
| M1-T07 | Revoke/reissue races acceptance; old secret cannot redeem new invitation; completed acceptance cannot be undone through resend/revoke | DB concurrency + API |
| M1-T08 | Two setup tabs edit same version; loser gets conflict; foreign/archived sport and partial branch failure never complete checklist | DB + HTTP + browser resume |
| M1-T09 | Switch A→B during delayed A response/draft; A never renders/submits in B; logout clears private projection; empty vs unavailable distinct | Authenticated browser, multiple tabs |
| M1-T10 | Cross-origin/oversized/malformed request, arbitrary worker destination, invalid QStash signature/replay and direct private-table access | HTTP/worker/DB; all fail safely |
| M1-T11 | Inbox provider outage, worker crash after send, replay callback and retry exhaustion; visible partial/unknown delivery, one durable intent, bounded attempts | Worker integration + controlled approved mailbox/provider receipt |
| M1-T12 | Keyboard and validation focus, EN/AR phone/desktop and long names/email, 200% zoom/reflow, screen-reader status, interrupted/resumed setup | Prototype proxy then actual browser/device; owner native Arabic/task review |
| M1-T13 | Performance/load/pagination/large-tenant workload above; no N+1/provider fan-out or unbounded lists; small academy remains responsive | Measured staging run, query plan and request/byte record |
| M1-T14 | Sole-owner loss/dispute; generic staff edits/removal cannot take over or strand owner; no impersonation/provisioning-from-signup endpoint | DB/API denial + documented escalation walkthrough |

The case matrix defines required layers. See the linked implementation receipt for actual local cases now executed; the hosted and acceptance layers remain pending. Prototype checks can validate only simulated transitions/layout, not close these security cases. No security/privacy gate passes by averaging visual/performance scores.

## Traceability and review disposition

AO-002–009 / AT-002–009 cover context, boundaries and invitation/owner/recovery. AO-011 / AT-011 covers usable recoverable provisioning and branch-failure integrity. AO-012 / AT-012 is only partially addressed by owner-configured sport records: catalog seeding and historical archive behavior stay required later. AO-019 / AT-019 covers persisted progress and real next actions. AO-117–130 require their relevant EN/AR/accessibility/performance/recovery checks; this slice does not complete every theme/navigation/native requirement. AO-001 existing bootstrap evidence is preserved; no claim of webhook/reconciliation completeness. AO-010 support scope stays unchanged; no impersonation added.

AT-011's default-branch failure example must remain. Test failed first branch save leaves provisioning incomplete; retried operation creates exactly one branch and completion only once. If the owner instead requires default branch at admission, revise J02-A01/prototype before build. Do not alter AT-011 to make a partial system look complete. Full profile, catalog, ownership transfer, staff roles and operational activation remain visible later scope.

Family journey/loading/security CSV rows link to this child packet; parent families remain incomplete. Requirement rows receive a proposal reference without changing implementation/test status. No policy row is marked accepted by this work.

| Gate | Current disposition |
|---|---|
| Assessment | Existing source, current migrations/private-table grants and latest CI inspected; signed-in runtime not reverified |
| Decision/design | Moamen accepted bounded M1 choices and approved connected prototype on 22 October 2026 |
| Implementation | Scoped source and local checks recorded in the implementation receipt; hosted apply pending |
| Local product tests / security / speed | Existing unit/lint baseline passed; new product cases and runtime measurements pending |
| Hosted / deployment | Existing staging preserved; no M1 migration, grant or deployment executed |
| Owner acceptance | Policy/design explicitly accepted; working-journey acceptance pending |

After review: record accepted choice IDs/rationale/date and exact design changes; finish verified-recipient proof/provider contract; implement additive SQL and negative/concurrency tests locally; build UI/operations/outbox/recovery; run relevant checks; prepare exact privileged provisioning action for explicit authorization; deploy reviewed staging changes; demonstrate two-academy synthetic journey and independently evaluate security/performance/usability/recovery; record owner acceptance separately. Commit/push alone closes none of these gates.

## Implementation continuation

Moamen accepted the bounded M1 policy and approved the design on 22 October 2026. The [implementation evidence and staging continuation](../07-handoff/onboarding-m1-implementation.md) supersedes the proposal-only status table above: source and local checks have progressed; hosted application, grant authorization/execution, measurement and journey acceptance remain pending.
