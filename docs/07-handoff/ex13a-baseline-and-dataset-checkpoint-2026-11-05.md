# EX-13A — refresh baseline and normal-workspace dataset specification

5 November 2026. This checkpoint expands the [root-cause investigation](refresh-root-causes-2026-11-05.md), specifies the [Owner Players/month transfer and storage contract](../04-engineering/owner-workspace-dataset-contract.md), and records the Owner's [full-app local-data direction](evidence/full-app-local-data-direction-2026-11-05.json). **No product source, migration, provider, role or deployment was changed.** The working app still has the documented refresh behavior. The current local-first runtime remains the previously verified one-register staging slice.

## Outcome and traceability

EX-13A supplies an actual-source route-family baseline and the engineering contract needed for EX-13B. Existing IMP/J/S/AO/AT/L/SEC joins remain in the action/loading matrices and the [coverage table](ex13a-refresh-family-coverage-2026-11-05.csv). WD-58 and WD-68–71 are planned app-wide acceptance cases, not passed from this measurement alone. The current task does not close NR01–04,07,08,13–15,17 or G01,03,06,08,09.

The Owner clarified that the target is **the full app**, including settings, finance and future modules. The referenced minimal Players/Calendar field list can be the first implementation slice. It is not permission to drop full profiles, operating views or future finance from the product. Each subsequent domain must use the same normal workspace/local-read/sync/recovery architecture, with existing role visibility and its genuine command rules. The canonical [domain adoption plan](../06-delivery/local-data-and-sync-plan.md#full-app-adoption--5-november-2026) owns that sequence. No new finance feature, financial rule or universal offline writer is invented here.

## Local measurement method

The new [measurement launcher](../../scripts/navigation/measure_refresh_families.mjs) imports a test-only [observer](../../scripts/navigation/refresh_trace.mjs) before the existing actual-component UI suites. Original product components, fixtures and assertions remain intact. Historical literal evidence output paths are redirected to a temporary directory. Nothing intercepts the signed-in user's browser or calls a real API/database.

The observer records page/request identities, API path and action name, control label, visible-row/status/dialog counts, focus tag and scroll positions. It omits request bodies, typed values, identity tokens, recipient secrets and private payloads. Known read replies are held for 100 ms so the intermediate UI is observable. This delay is synthetic; it is not a latency or performance percentile. A fallback fixture route is counted/delayed once. Hyphenated action names such as `owner-list` are retained. Some recovery/status operations are intentionally classified separately because they can fence an operation rather than merely read it.

The 15 families are Entry/onboarding/Platform/setup, People, Guardian appointments, Trainer appointments, Programs, dated planning, program planning, publication/Trainer schedule, session changes, attendance, corrections, QR, Guardian training, Development and role Home/Calendar projections. All final observed suites passed their existing assertions. Source/tool hashes, the exact browser/runtime profile, counts and compressed fictional trace are retained in [the evidence directory](evidence/ex13a-baseline-2026-11-05/README.md).

These fixture suites often use a simple test page and a substitute for Next Link or identity. Their document-entry totals include deliberate test reload/reset and are **not a user's navigation/session cost**. A click beside an already-running read does not prove that the click caused that read. The observer's lifecycle subwindows split successive visibility/focus signals; use page/request IDs and the existing explicit assertion metrics when interpreting them. Generic row selectors do not cover every domain's cards. Do not infer blank content merely from a zero generic-row count.

### Results and limits

| Evidence | Result | What it establishes |
|---|---|---|
| All 15 actual-component suites under controlled read delay | Passed; exact counts/profile in the evidence manifest | Current component behavior, including existing dirty/unknown/denial regressions, remains reproducible under delayed reads. It does not establish server authority, Next routing, hosted timing or future no-flash acceptance. |
| People explicit resume assertions | Directory 1 read; profile 1; duplicate review 0 | A return can requery an already-open directory/profile, while the guarded review path behaves differently. |
| Trainer/Guardian appointment explicit resume assertions | Paired clean return 1; later focus 1; unknown return 0; dirty return 0, for each suite | Existing signal pairing and operation/draft guards must be retained. Removing all focus handlers is not a valid fix. |
| Prior actual production Next EN/AR and 20 held Home/Calendar checks | Passed in the separate local receipts, retained with hashes where available | One-document navigation can still mount a screen/read again; same central geometry can remain while rows disappear. These are separate phenomena. |
| Prior hosted Owner sample, `cb00ab8` | Setup → Players document load; Calendar/Players return reads without a document load | Real staging reproduction only for the sampled Owner paths. No new hosted write or new role restoration. |
| Optional cold-start fixture | React hydration error in that isolated diagnostic, still open | Not a measured cold-start budget or a demonstrated staging defect. |

The source map also covers post-save rereads: attendance roster, publication job/dates/list, corrections detail/list and development detail/roster/list according to current state. Existing success/unknown/refusal assertions remain authoritative for those fixtures. **The new observer is a baseline, not a test claiming the target continuity already works.** New no-flash/request-budget assertions belong with each EX-13B/EX-07 implementation change.

## Data-contract conclusions

- Current People pagination has neither a whole-directory revision nor authoritative completion proof. Its duplicate-name revision and fixed player version must not be reused for collection synchronization.
- Current Calendar keeps count/cursor/page coherent within one SQL statement, not across all pages. Its row `id` is not a unique draft-date key; use program/original day. Owner Calendar remains in its existing branch, while the directory follows its existing academy-wide player scope.
- EX-13B needs purpose-bound versioned transfer, transactional revisions covering every projection-affecting writer, a verified page/completion chain, protected indexes/generations, account-wide cleanup and ordinary-route offline boot. V1 may use honest bounded replacement rather than inventing an unimplemented delta feed.
- Keep the one-register namespace, key custody and pending originals intact. Its live capability cannot silently authorize Player/month datasets. Automatic key management and ordinary sign-in remain the selected mechanism; no passkey or extra local secret returns.
- The Owner's response supports the proposed starting field list and explicitly expands the adoption obligation to the full application. Other domains' exact projections/writes still need actual canonical contracts; that is implementation work in the planned sequence, not a claim that all fields or finance already exist.

See the [dataset contract](../04-engineering/owner-workspace-dataset-contract.md) for exact fields, exclusions **for this first slice**, scope/key/retention, revision/removal handling, budgets, implementation order and tests.

## Delivery states and next action

| Gate | State at this checkpoint |
|---|---|
| Product direction/design | Prior normal-workspace/read design retained. Latest full-app response recorded with its interpretation and limits. |
| Baseline/specification | Source map, 15-family controlled local trace and exact first dataset engineering specification recorded. Per-route hosted and platform/device performance gaps remain assigned. |
| Product implementation | Players/month persistence not implemented. No fix to runtime refresh behavior from this checkpoint. |
| Local verification | Existing 15 component suites passed with measurement instrumentation. Structural/document/review-tool results belong to the final validation manifest. Future transfer/repository/offline tests remain unexecuted. |
| Deployment/hosted | No new app release. Prior Owner-promoted `cb00ab8` evidence retained; no new hosted verification inferred. |
| Owner acceptance/security | No working Players/month acceptance. Independent human security review Deferred by Owner, nonblocking and not performed. |

**Next action:** Begin the first EX-13B engineering slice: versioned Owner workspace manifest/revision/page/completion contract and disposable-PostgreSQL negative/concurrency/size tests, then protected local repository and ordinary Players/Calendar integration. Use the named dataset fields and existing current Owner authority. Continue the full-app adoption map, while preserving all delivered UI, dedicated roles, register originals and current command semantics. Do not deploy or claim normal-route offline readiness from the specification.

## Delegation and scope accounting

One fresh `gpt-6.1-terra` worker, medium reasoning, performed the independent read-only actual-source/PYSA dataset inventory. Peak one active helper; no nested workers, shared-file edits, browser/provider work or publishing. The coordinator checked source boundaries and owns policy interpretation, synchronization architecture, evidence integration and validation. Scripts performed repeated local test instrumentation. A first observer revision missed hyphenated read names and double-observed nested fixture fulfillment; the coordinator corrected those measurement defects and reran the affected final instrumented suites without changing assertions. Exact cost/five-hour savings and worker token totals were not available and are unmeasured.
