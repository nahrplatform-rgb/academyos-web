# EX-13B — closed Owner workspace transfer checkpoint

5 November 2026. This implements the first backend slice of the [Owner dataset contract](../04-engineering/owner-workspace-dataset-contract.md). It follows the [EX-13A baseline](ex13a-baseline-and-dataset-checkpoint-2026-11-05.md) and the Owner's full-app local-first direction. **No hosted migration, provider setting, role, promotion or ordinary app screen changed.** The Players/Calendar refresh behavior remains until their protected normal-route integration is delivered.

## Authorized outcome and boundary

EX-13B; IMP-J06-A01/A02, IMP-J09-A01; J06-A01/A02/J09-A01; L04–L07; SEC-J06/J09/J16; AO/AT-013,016,020,021,022,027,029. Findings NR01–04,07,08,13–15,17 and G01,03,06,08,09 remain open beyond this scoped transfer proof. WD-58–71 retain their planned whole-workspace acceptance status; this is not normal-route or all-role acceptance.

The first permitted collection is all academy Player directory summaries: ID, display name and branch ID/name. Calendar keeps the existing initial branch, original program/day identity, scheduled date/time, display labels, publication/moved/cancelled state and capacity/roster counts. Profiles, contacts, full rosters and other domains are absent from this transfer. They remain in the full-app adoption sequence, including settings and future finance. No writer or business rule is broadened.

Trust boundaries: same-origin staging handler → current Clerk session → rate-limited signed gateway → current database Owner/setup/device/namespace checks → bounded purpose-bound transfer. The new key registry is separate from the working one-register namespace. Its test envelope is fictional; real workspace cryptographic wrapping/release and encrypted browser storage are **not** established here.

## Implemented source

| Source | Behavior |
|---|---|
| [Migration](../../supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql) | Transactional People/Calendar revisions; private minimal projections; separate Owner/device key metadata; exact signed manifest/page/resume/completion functions; explicit ACLs and signed-caller allowlist. Created with `supabase migration new`, applied only to disposable PostgreSQL. |
| [Request contract](../../apps/web/src/lib/workspace-download.ts) | Fixed command/receipt shapes, UUID/civil-date/count/version bounds, no caller role authority, separate workspace headers. HTTP shape checks do not replace the database signature/current-authority check. |
| [Closed API](../../apps/web/src/app/api/workspace-download/route.ts) | Staging/same-origin POST only; `OWNER_WORKSPACE_TRANSFER_ENABLED` defaults closed; at most 8 KiB actual input; under 32 KiB output; no-store; codes-only errors. Closed or malformed requests stop before authentication/budget/SQL as specified by the API checks. |
| [Gateway](../../apps/web/src/lib/onboarding-gateway.ts) | Only the exact `x21_workspace_transfer_v1` read and `x21_workspace_key_v1` metadata-write targets were added. Existing canonical commands/budgets stay intact. |
| [CI](../../.github/workflows/verify.yml) | Source-receipt freshness plus disposable database, API-boundary and actual SDK/gateway transport checks. These do not activate the seam or change the staging alias. |

### Revision and writer coverage

Statement-level transition triggers increment each affected academy's collection counter once per relevant statement, in the writer's transaction. Updates compare named projected fields; contact/created-time changes and no-op assignments do not bump the directory. Concurrent increments serialize on the small counter row. Readers never lock it or acquire a new domain-wide lock. Membership/current Owner authority remains a per-request check, not a cached revision grant.

| Watched relations | Projection-affecting fields and actual writer path |
|---|---|
| `academies`, `initial_setup` | Name, timezone, setup/version, selected branch/sport. M1 setup/create; scope hash changes as well as revisions. |
| `branches`, `sports` | Branch identity/name; sport EN/AR labels. Current setup/configuration relations; conservative invalidation is intentional. |
| `players` | Insertion/removal, ID/name/branch; I2 registration and any supported future profile/name writer. Directory spans its existing permitted academy branches. |
| `training_programs`, `training_dates` | Ready visibility, branch, definition/timezone, original/scheduled date, times and cancellation. P5 creation/finalization and T9 session changes. Ready transition must invalidate even when its dates were inserted earlier. |
| `date_plans` | Capacity/roster count; Q6/R7 planning. Private Trainer/roster names are not transferred. |
| `publication_heads`, `publication_events` | Current head and publication visibility; S8 publication/withdrawal. Job preparation without a visible change does not invent a new published state. |

Canonical registration and program preparation have different locks from planning/publication. The revision trigger does not acquire those locks. Local concurrent registration and mixed registration/planning/program creation passed; this is not a proof of unlimited write throughput. Current API transactions and audited operator fixtures are covered. A privileged database owner disabling triggers or truncating tables is outside this application protocol: such maintenance must invalidate/rebuild collection metadata before resuming transfers. New writers/fields must extend the projection/revision/negative tests before delivery.

### Coherent transfer and bounded work

The manifest returns indexed context/revisions and four seed receipts: People and requested/current, next and previous 42-day Calendar grids. It reads/counts no Player or date rows. First-page count, projection revision and rows share one `STABLE` helper statement snapshot. Later pages carry the authenticated total and cursor; completion/revalidation checks metadata without rescanning the collection. Revisions are decimal strings, preserving values beyond JavaScript's safe-integer range.

Directory pages use a UUID seek and at most 25 rows. Calendar transport uses scheduled date/start/program/original day and at most 50 rows; display order remains an ordinary UI concern. The actual Calendar query materializes at most 51 eligible date candidates before its display/publication joins, then removes the sentinel and applies the 24 KiB row-byte bound. The final envelope stays below 32 KiB. This limits returned/enriched work; first-page counts, eligibility checks, data distribution and statistics still affect database cost.

Receipts bind the subject, academy, device, namespace, field epoch, scope, period, revision, cursor, total/seen and accumulated row chain. Changing a signature, scope or progress fails. `changed` and `expired` are explicit outcomes, never empty collections. A 600-second continuation can be renewed by `resume` only after current scope/revision checks; it does not expire a completed read replica. The future repository must verify actual staged ciphertext/count/chain before atomically publishing coverage; receiving a final page is insufficient.

The observed concurrency check pauses a read after its metadata, commits a writer, then releases it. Production `STABLE` returns the coherent older 26-row version; a fixture-only `VOLATILE` negative control returns 27 rows with the older revision. The fixture restores the production function. This tests the actual interleaving rather than assuming sequential READ COMMITTED statements share a snapshot. [PostgreSQL snapshot rules](https://www.postgresql.org/docs/17/transaction-iso.html) and [function volatility](https://www.postgresql.org/docs/17/xfunc-volatility.html) support that design; the local test supplies implementation evidence.

## Verification and measurements

Machine-readable [database](evidence/ex13b-workspace-transfer/database.json), [observed interleaving](evidence/ex13b-workspace-transfer/snapshot-interleaving.json), [query plans](evidence/ex13b-workspace-transfer/query-plans.json), [actual transport](evidence/ex13b-workspace-transfer/transport.json) and [final validation](evidence/ex13b-workspace-transfer/validation.json) are separate. [Commands and evidence limits](evidence/ex13b-workspace-transfer/README.md) explain reproduction. No tokens, gateway proofs, keys or downloaded names are recorded in these receipts.

The SQL suite covers empty/25/26/1,000-row downloads, all-branch directory scope, multi-page Calendar parity, UTF-8 byte trimming, changed/removal/final-page races, altered/expired proofs, wrong role/academy/device/namespace/account, successor ownership, rollback, concurrent writers and preserved register storage/replay. Query-plan measurement uses 10,001 directory rows and 301 programs, with the actual Calendar page SQL and a mid-directory seek. Its elapsed figures are single local query observations after ANALYZE, not hosted/API/device percentiles.

Actual handler → Supabase SDK → gateway HMAC → disposable PostgreSQL transfers 56 People in one manifest, three pages (25/25/6) and one completion. Each API phase has one entry budget check, one gateway read budget check and one RPC. The ten limiter checks in that five-request sample are **not** ten regional Redis commands: the real Redis backend/quotas/costs are unmeasured. An unchanged manifest uses no dataset pages in this protocol test; there is no automatic browser caller yet, so no live request-saving claim follows.

The default closed handler, invalid/oversized/foreign inputs, account mismatch, budget timeout, database signature rejection and current-role loss were checked independently. Clerk, Redis and the PostgREST wire are fictional adapters; the actual handler, SDK, proof generator and PostgreSQL verifier are exercised. Workspace key custody and browser repository are not substituted into a working claim.

Supabase guidance/changelog were checked before implementation. The installed CLI is 2.90.0; no upgrade was made. Explicit private ACLs/RLS, empty function search paths and the existing signed Clerk/current-Owner checks are deliberate. Local CLI advisors completed with zero WARN/ERROR and 164 INFO. Four new-object notices are dispositioned: two deliberately RPC-only/RLS-without-client-policy tables and two newly unused indexes in the empty advisor fixture. The populated query-plan test separately exercises the cursor index. The other 160 legacy notices retain EX-05 workload review; no blanket index removal follows. The first plain fixture connection was refused because this CLI required TLS; a temporary local certificate/explicit fixture CA allowed the read-only check, with keys removed at teardown. This is automated catalog lint, not an independent security pass. [Statement transition-table rules](https://www.postgresql.org/docs/17/sql-createtrigger.html) inform the trigger implementation.

## Next checkpoint and delivery states

1. Implement the distinct typed protected workspace repository and actual automatic key wrapping/release. Preserve the one-register keys, device slots and pending originals. A key release alone cannot refresh dataset verification time.
2. Prove encrypted page/checkpoint atomicity, final root/count/ciphertext checks, bounded local query/search, overlap ownership, abort/quota/eviction/migration, cross-tab leadership and account-wide logout/30-day cleanup with fictional records. No clear private-name indexes or extra unlock prompts.
3. Connect normal Players and Calendar to task-first preparation, quiet unchanged/changed sync and normal-route public offline startup. Prove local action zero operating requests and stable scroll/selection/input under delayed sync/denial. Only then prepare staging activation/Owner promotion and dedicated-role hosted evidence.

| Delivery layer | State |
|---|---|
| Accepted direction/design | Preserved, including full-app adoption, normal sign-in, no inactivity lock/24-hour cutoff and agreed replica cleanup. No new business decision requested. |
| Backend implementation | Closed local transfer seam and unapplied migration; separate registry metadata, not completed key custody/client. |
| Local verification | Scoped database/API/SDK/gateway checks and existing register regressions recorded in evidence. Whole normal-workspace/device/working-day tests remain open. |
| Deployment/hosted | No new staging promotion, schema or settings change. Prior live `cb00ab8` and scoped EX-11 proof retained. Automatic preview CI/build readiness is separate. |
| Owner acceptance | No working Players/month acceptance or whole-app no-refresh closure. |
| Independent review | Deferred by Owner, nonblocking for authorized synthetic staging, not performed. |

## Delegation, repairs and limits

One explicitly configured `gpt-6.1-terra` worker, medium reasoning, received fresh bounded briefs for writer inventory, the isolated API fixture and the JSONL database bridge. Peak one helper, no nested work, provider/browser changes or publishing. The coordinator inspected and integrated every file, tightened exact failure/budget assertions, and owns the snapshot/counter/key/transport architecture. Scripts handled repetition. Actual model-token/cost/five-hour savings were unavailable and are unmeasured.

Repairs retained integrity assertions: reserved SQL alias; timezone-normalized Calendar parity; a fixed original capture time on replay, while altered capture still conflicts; and a successor-Owner fixture preserving the one-active-Owner constraint. A local port collision was rerun serially. A busy Calendar plan exposed joins before bounding; the query now materializes the eligible date slice first. The initial plan test also assumed a specific index name; it now requires an actual lower-bound index seek and measured row-work bound, allowing PostgreSQL's legitimate UUID primary-key choice in a dominant academy. Existing tests/business results were not weakened. Final exact-source results, including any failures or skips, are retained separately.
