# I3a Owner-only draft programs — implementation receipt

26 October 2026. **Implemented and deployed to synthetic staging; local checks and the hosted 40-date pause/reload/resume journey passed. Owner working-feature wording/usability accepted; wider verification gates remain pending.** The completed connected design was explicitly approved on 26 October; that approval is not working-feature acceptance.

## Authorized scope and traceability

J09-A01 / IMP-J09-A01, S22/S23/S25, L07, SEC-J09; partial AO-021/022/029 and AT mappings. Only the current Academy Owner with completed initial branch/sport/timezone setup creates fictional, private drafts. Full explicit periods and independent weekday times replace the old whole-program 28-day/20-date cap. No assignment, enrollment/capacity, publication, Trainer/family schedule, attendance, billing, notification, account grant or real data is introduced. Those broader requirements remain open.

Keep the accepted [policy](../06-delivery/i3a-program-dates-decisions.md), [connected preparation design](../06-delivery/i3a-program-preparation-design-contract.md), [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md) and [previous-journey comparison](../03-design/pysa-comparison-completed-journeys.md). PYSA programs/calendar/detail continuity is reused as a workflow reference. Its documented partial-linked-write and recurrence/recovery defects motivate one immutable program identity, deterministic dates and explicit completeness. PYSA source/audit evidence is not hosted verification, AcademyOS authorization or copied persistence code; PYSA was not changed.

## Actual product and authoritative operations

- [Program workspace](../../apps/web/src/components/program-workspace.tsx): shared shell/panes/native controls, Programs and bounded Draft dates, EN/AR, desktop contextual detail and phone Back. The saved setup links to Training. Existing identity changes remount private state; denial wipes it. Failed reads differ from empty results.
- [Input/action contract](../../apps/web/src/lib/programs.ts) and [API route](../../apps/web/src/app/api/programs/route.ts): seven named RPCs; exact fields, 8 KiB streamed body cap, same-origin and synthetic-staging checks, existing authenticated entry budget plus signed gateway budget. Recovery is charged as a write. No privileged key stands in for caller authority.
- [Migration](../../supabase/migrations/20261026181240_i3a_draft_programs.sql): three private RLS tables, revoked direct client privileges, tenant-bound foreign keys/date index and current Owner/setup locks. Public entry functions have empty search paths, 3 s statement and 2 s lock limits. Private helpers have no client execution grants.

`list` returns 25 headers plus a cursor sentinel. `preview` validates one 28-calendar-day window (at most 28 occurrences), derives UTC separately for each local start/end and rejects gaps/folds. It returns a fixed-size signed review-chain receipt: actor, academy, immutable definition, branch/sport/timezone/context and the complete ordered UTC prefix are bound cryptographically. The next window cannot be skipped; previous windows can be revisited without advancing the receipt. A receipt attests authoritative validation, not human attention or legal consent.

`create` verifies the final receipt and atomically records one immutable definition, intent and redacted audit. `step` prepares at most one window, pauses/resumes the original identity or performs separate finalization. Each chunk's rows, progress, rolling timestamp digest and audit commit together. Replaying a committed version returns current state without processing another chunk. Finalization requires every window, the exact expected count and a digest matching the reviewed dates. Changed timezone rules produce a preserved failed draft, not a ready projection. A failed immutable definition needs a new deliberate review; a transient interrupted chunk resumes the original.

`read` exposes saved date rows only after readiness. `dates` returns 25 ready occurrences plus a sentinel inside a 28-day academy window and opens the correct program window. Full-period totals use at most seven rules; no full-period row JSON, date-by-date requests or unbounded generation transaction is used. Input uses valid four-digit ISO calendar years; this parser range is not an unlimited-service promise or a new business-duration rule.

Preparation uses existing authenticated sequential requests, not a new worker, provider or detached credential. Leaving/closing stops further requests; reopening lists the persisted incomplete program and resumes its cursor. The existing 60-read/10-write per-minute gates remain unchanged. Large preparations can stop on 429 and resume after the limit clears. No hidden quota upgrade, perpetual background work or completion ETA is claimed.

Unknown create/step replies retain only an opaque actor/academy-scoped recovery identifier in session storage. Check original operation resolves the persisted record or serializes a no-commit cancellation fence before replacement. Confirmed ready followed by failed read stays confirmed ready and retries the saved-date read. Unsaved form fields are retained on recoverable in-page failure, not persisted across a browser reload.

## Evidence and measurable limits

[Local evidence](evidence/i3a-local-2026-10-26/) separates actual PG17/SQL tests, actual route tests with synthetic limiter/session adapters, product React tests with synthetic HTTP/identity adapters, and backup restoration. These layers are not interchangeable and are not hosted/physical-device evidence.

Targets retained from the engineering packet: directory first useful p95 ≤2.5 s, scoped HTTP read/preview ≤1 s and first write acknowledgement ≤1.5 s on a declared network; local SQL reads ≤100 ms, preview ≤150 ms and a chunk ≤300 ms; encoded directory ≤32 KiB and preview/detail ≤24 KiB. Preparation throughput and total requests are measured separately from acknowledgement. Local scale uses 1,002 program headers, 92 ready dates and 50 observations per operation; write samples roll back. HTTP, identity, limiter, cold-start, hardware and hosted-cost results remain separate.

The fresh encrypted [backup run](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40335930574) succeeded from reviewed main source `a475dadda5294510e43c7a64c14f29603bfa8748`. Its ciphertext digest was checked against that trusted run, restored into disposable socket-only PG17 and rehearsed with the migration. [Backup/restore receipt](evidence/i3a-local-2026-10-26/backup-restore.json). Plaintext recovery material was removed. Zero stored private objects means object-content restoration was not exercised.

## Local result — 26 October 2026

38 disposable SQL test groups passed (13 program groups plus25 inherited M1/people groups). This includes observed create/cancellation and revocation lock orders, concurrent finalize, review-receipt tamper/skip/foreign binding, canonical timestamps across database session timezones and changed-generation suppression. 43 unit tests and21 route budget/timeout/outage denials passed. Product React production/development suites pass, including failed-directory-versus-empty,4-window40-date preparation, pause/reopen, lost response and browser reload, confirmed-ready/read failure, rate-limit stop, stale context and identity clearing. Existing onboarding component regression suites pass in both modes. Local build, typecheck, zero-warning lint,8 foundation E2E (including the new protected program endpoint/page) and11 backup safety tests passed. These are local results, not hosted proof.

[SQL measurements](evidence/i3a-local-2026-10-26/sql-scale.json) use50 observations for each of list,preview,read,dates and a rolled-back28-date preparation chunk. All named SQL/encoded-response budgets pass on1,002 local headers/92 ready dates. The numbers exclude networking and providers.

## Status and remaining gates

| Layer | Status |
|---|---|
| Policy and connected design | Owner accepted for this narrow slice |
| Product source and database migration | Implemented;38 SQL groups,43 unit tests and scoped route/React suites pass |
| Local SQL/API/React/build evidence | 38 SQL groups;43 unit tests; API budget and production/development React pass; build/typecheck/lint and8 foundation E2E pass |
| Hosted schema/deployment/runtime | Applied and deployed; actual Owner 40-date journey, pause/reload/resume and persisted results verified; see hosted receipt below |
| Owner working-feature acceptance | Moamen explicitly accepted the working draft-program wording/usability after staging review |
| Independent human security, physical devices, hosted load/cost | Open; no approval inferred from AI review or local tests |

No whole scheduling module or broader AO requirement is marked complete. [Security review](../04-engineering/i3a-program-security-review.md) records the scoped boundaries and residual gates.

## Hosted result — 26 October 2026

Reviewed commit `db430c487cefbd8b12b4e64b818423435a87bcad` passed both [Foundation checks](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40346640494) and [PR Foundation checks](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40346631036). The existing AcademyOS staging project rebuilt it in deployment `dpl_7uGMWpU8eqDitjDwujgxhvTq1oFa`, Ready after47s, serving the existing staging domain. Vercel calls this project's serving slot “Production”; the application environment and synthetic staging domain remain staging. No customer production launch or access change occurred. A subsequent presentation-only language correction is tracked separately from this initial hosted journey.

Supabase AcademyOS-staging `snpphkenmvmhpjstbeul` applied the reviewed migration as version `20261026181240`. The repository filename was aligned to the provider-assigned version; the earlier local/rehearsal filename was `20261026145710_i3a_draft_programs.sql`. Both have identical SQL SHA256 `29ebeb88e048106e09574df4d344c37acc129dccd677cd8445e5478edc48db2a`. Historical local/rehearsal receipts retain their actual filenames. [Hosted schema/ACL receipt](evidence/i3a-local-2026-10-26/hosted-schema.json) confirms private tables and the seven bounded public entries. No seed account or membership was added.

The existing signed-in Academy Owner created “Synthetic I3a Full-period Demo” in AcademyOS M1 Synthetic Academy:1 November2026–31 January2027; Sunday17–18, Tuesday19–20, Thursday18–19 in Africa/Cairo. The Owner reviewed all four windows, saved, paused after12/40 dates and reloaded. The same program `5c1d13f7-83f4-4637-a9fe-2081938b1ab7` reopened at the saved cursor. Draft dates excluded its incomplete rows. Resuming prepared the remaining windows and finalized40 unique dates; reviewed/prepared digests match. UTC examples15:00 Sunday/17:00 Tuesday/16:00 Thursday correspond to the saved local times. Audits record one create, four preparation chunks, one pause, one resume and one finalize. Memberships remain4. [Paused state](evidence/i3a-local-2026-10-26/hosted-paused.json), [ready state](evidence/i3a-local-2026-10-26/hosted-ready.json).

Hosted advisors are evidence, not a zero-finding security certificate: [security](evidence/i3a-local-2026-10-26/hosted-security-advisors.json) reports intentional private deny-all RLS and existing signed-callback/authenticated security-definer warnings; [performance](evidence/i3a-local-2026-10-26/hosted-performance-advisors.json) includes foreign-key indexing INFO, including five new child references. Current requests use indexed bounded reads; parent mutation/aggregate scale and index coverage still need assessment before expansion. Fresh unused-index suggestions do not justify dropping safeguards. The staging build retained existing cache/install-script/Sentry instrumentation warnings. No authentication, direct-table restrictions or request budgets were weakened.

This hosted single-account journey does not replace the local negative-access/race evidence or establish hosted multi-account direct-API, sustained load/cost, physical-device accessibility or independent human security approval. Owner working-feature acceptance remains separate from accepted policy/design.


### Corrected presentation rollout

Follow-up source `43c5457ec826c9ec1a582b3960676529721e47f0` renders retained confirmations and invalid-time feedback in the current language instead of storing already-translated text. A regression switches EN→AR→EN after successful finalization in both actual React modes. Build/typecheck/lint and documentation/CSV integrity passed. The complete [PR Foundation suite](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40377696582) passed on that exact commit; the duplicate branch run was still executing when this receipt was written.

Deployment `dpl_4bveybUBb6ekYBvNrT9EqXQDJNZk` rebuilt that source in38s and is Ready on the existing staging domain. The existing40-date program reopened, later saved windows loaded, and the Arabic Draft dates next-window occurrence opened program window2. EN/AR desktop1440 and phone360 screenshots were inspected; document width equaled viewport width. These browser viewport checks are not physical-device or screen-reader proof. [Follow-up receipt](evidence/i3a-local-2026-10-26/hosted-followup.json), [EN desktop](evidence/i3a-local-2026-10-26/staging-ready-en-1440.png), [AR desktop](evidence/i3a-local-2026-10-26/staging-ready-ar-1440.png), [AR phone](evidence/i3a-local-2026-10-26/staging-ready-ar-360.png), [EN phone](evidence/i3a-local-2026-10-26/staging-ready-en-360.png). The post-save notice-switch regression is local; no second hosted program was created to repeat that presentation-only case.

Git push also reported default-branch Dependabot alert1. Read-only provider inspection identifies its title as a withdrawn `braces` advisory; the alert remains open and no dependency/security closure is claimed. It is distinct from this slice's tests and independent review gate.


## Owner working-feature acceptance

Moamen explicitly answered “Accept the working draft-program flow” to the staging review request for the deployed Owner-only journey: full-period program, independent weekday times, authoritative date review, saved draft and pause/reopen/resume. This records working-feature wording/usability acceptance separately from earlier policy/design approval and implementation/deployment evidence. Independent human security review, broader hosted direct-API/race/load/cost and physical-device/accessibility gates remain open. It does not accept assignments, enrollment, publication or the full scheduling module.
