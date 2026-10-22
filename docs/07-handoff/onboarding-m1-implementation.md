# M1 implementation and staging continuation

22 October 2026 · Branch `codex/onboarding-decision-design-packet` · Working-journey acceptance pending.

Moamen explicitly accepted [M1 policy/design](../06-delivery/onboarding-m1-decision-design-packet.md) in this chat. This receipt supersedes its earlier proposal-only implementation table. No new platform grant is authorized by that acceptance. Existing staging services are preserved.

## Implemented in source

- EN/AR context chooser with bounded membership pages; platform admission list/create/review; intended-recipient review/acceptance; academy-specific setup-only workspace with saved branch/timezone and localized sport, review/completion and refresh/resume.
- Private additive database records, narrow caller-derived transactions, explicit platform grants separate from tenant membership, one active initial owner per academy, hashed invitation secrets, 72-hour expiry and exact verified-recipient matching.
- Durable actor/action/payload-bound operation receipts, atomic audits, serialized duplicate effects and version conflicts. Lost-response UI checks the original operation; access-denied removes private projections. No optimistic access or setup success.
- Durable invitation delivery intent in PostgreSQL; post-commit QStash dispatch, bounded provider attempts/leases and explicit queued/accepted/failed/blocked/unknown states. Publication failure stays queued for explicit retry. Reissue invalidates the previous secret. A lease-active callback requests transport retry; a crashed worker can be reclaimed. Unknown provider results require review and are not blindly resent. Resend idempotency key stays stable per invitation generation, with a conservative 23-hour recovery bound.
- Existing approved staging email recipient restriction retained. Delivery callback uses the existing Vercel protection bypass and QStash signature validation; neither grants tenant authority. No arbitrary worker destination or payload access.

The new SQL migration is **local source, not applied to hosted staging**. No person or application platform capability has been granted. No invitation email has been sent by this implementation task. No production deployment or real academy/child record is involved.

## Narrow attestation boundary

The existing database receives the caller's Clerk token through a publishable-key client; no service-role credential is added. The server reads current Clerk verified email addresses only during invitation review/acceptance, then signs a 30-second proof bound to subject, invitation and secret hash. The database rechecks the signature, current invitation, issuer and matching recipient. Client email/role/verified flags are never trusted. This avoids an identity-provider claims configuration change and a privileged generic database client.

`ONBOARDING_PROOF_KEY` is a proposed **new server-only staging secret**, with its matching value in the inaccessible `academy.m1_secrets` row. It is not configured yet. It is also used to derive generation-specific invitation secrets and encrypt the transient handoff cookie; purpose-separated HMAC inputs prevent cross-protocol reuse. The database stores only invitation hashes. This increases the importance of keeping the proof key private and including it in approved custody/rotation procedures. A key compromise permits forging recipient/worker attestations, but does not itself create a platform grant or bypass current tenant role checks. Rotation invalidates older derived invitation secrets; reissue outstanding invitations after a reviewed rotation.

Invitation secret arrives only in a fragment. The client clears it, exchanges it for an encrypted HttpOnly, SameSite=Strict cookie scoped to `/api/onboarding`, with a 15-minute handoff expiry, and returns from sign-in through a fixed local route. The original invitation still expires at database time after 72 hours; reopen its original link if the handoff cookie expires. The acceptance page sets no-referrer. The root Clerk identity integration is still loaded; no new third-party analytics/replay is added.

The UI retains only an opaque operation UUID and start time in sessionStorage, partitioned by subject, environment, view and academy. It never stores form fields, email, invitation secrets or private projections there. After an interrupted reload it requires operation reconciliation; it cannot reconstruct an unsaved form. Saved branch/sport progress comes from the database. A receipt lookup shares the operation lock with writes. A missing receipt is not a successful save; users must review current state before starting a replacement. Lost-response recovery across network/provider boundaries still needs actual deployed failure injection.

## Actual checks and limits

| Evidence | Actual result | Limits |
|---|---|---|
| Original hosted baseline | Earlier in this assessment: exact staging project, four migrations and three private-table RLS/direct-grant states checked read-only | New migration not applied; no authenticated M1 HTTP proof |
| Local SQL runner | Thirteen groups passed on isolated PostgreSQL 17; original membership tests replayed | Test auth claims are synthetic, not a JWT gateway signature test; Storage migration excluded from plain PG harness |
| SQL positive/negative cases | Signup has no authority; direct private table denial; wrong recipient/token/stale proof/expiry/revoke; two academies; all nonowner roles; platform cannot read tenant setup; suspended owner denied; atomic complete/resume; rollback and lost-result receipt lookup | Hosted/direct Data API/browser authorization remains pending |
| Concurrency | Ten simultaneous identical creates produce one academy/receipt; ten accepts produce one owner; ten version-competing edits produce one winner | The local revoke/accept race has consistent single-winner state; grant-revoke/commit interleavings and hosted demonstration remain pending; no independent security audit |
| UI runner | Actual React component with synthetic Clerk and transport adapters: create→accept→setup, lost-response reconcile, stale conflict retains fields, completion/reload, denied access clears setup; EN/AR 360px no horizontal overflow | Not live identity, permission enforcement, inbox delivery, genuine participant usability or physical-device evidence |
| Unit suite | 18 passed, including purpose/subject/target separation, verified-only emails, generation-specific secrets and encrypted cookie tampering/expiry | No proof that production identity/provider configuration matches |
| App quality | Node 24.14.0 local build/typecheck/lint, 18 unit cases and four production-build browser tests passed; synthetic UI runner also passed | Local npm bundled with this Node is 11.9.0; CI uses repository-pinned npm 11.19.1 |
| Documentation | CSV row/ID/status/link validation; original 180 requirements and acceptance scenarios retained | Historical verification-report counts are not current counts |
| Performance and cost | Bounded RPCs, one initial branch/sport detail projection, no provider fan-out in normal reads; no new provider/library plan | Proposed latency/CLS/workload budgets are **not measured** on M1 staging; no cost or production capacity claim |

The first SQL test run failed on Arabic because the disposable harness initialized SQL_ASCII. The harness now explicitly creates UTF-8 and the same Arabic assertion passes. Earlier lint/build failures were corrected in source; no business assertion was removed. Backup code is unchanged and its schema list already covers the new `academy` tables. The SQL runner also dumped and restored the new schema in a separate disposable database and verified private-table RLS/grants survived; this is not a restore of the actual hosted baseline.

Run local checks from the canonical root:

```sh
npm run lint
npm run build
npm run typecheck
npm test
npm run test:e2e
node scripts/onboarding/test_ui.mjs
python3 scripts/onboarding/test_boundary.py
```

The PostgreSQL runner creates and tears down its own disposable cluster on port 55441. Set `M1_POSTGRES_BIN` to a local PostgreSQL 17 bin directory when different from the macOS default. Never point its harness at hosted data. UI runner uses port 3194, mocks transport only in the test harness and introduces no application test route. CI adds this synthetic UI runner; the local PostgreSQL runner is not yet part of CI. Existing foundation CI alone does not enforce the SQL/security journey gate.

## Deployment/access blockers

During continuation, Supabase and Vercel connectors became unavailable. Vercel CLI scope `academy-os2` returned scope-not-existent; current Supabase CLI lists only unrelated Shift projects, not AcademyOS. Local browser control returned **“Local browser use is disabled in Work settings.”** No alternate account, new service, permission change or browser bypass was attempted.

To continue hosted work, restore access to the existing AcademyOS Supabase/Vercel connections or enable the existing signed-in browser. The app itself needs no provider rebuild. Do not replace AcademyOS with a project visible under another account.

## Next bounded staging actions

1. Reverify target `snpphkenmvmhpjstbeul`, four baseline migrations, current schema/grants and deployment protection. Inspect/restore-test an authorized encrypted pre-apply backup. Replay migration on a disposable restored baseline first; inspect advisors and query plans. Resolve known defects before apply.
2. Generate/store the proof key privately in the exact staging server secret and inaccessible database row; no value in logs/Git/PRs. Apply only `20261022130955_controlled_onboarding_m1.sql` after rehearsal, record actual migration version and grants, and compare against source. Do not seed a platform grant automatically.
3. Prepare **exact initial Platform Owner provisioning** for owner authorization: Moamen's freshly verified Clerk subject in the selected Development issuer; capability = current platform admission/invitation management; environment = existing staging only; no Academy Owner membership or child/private-content access. Require explicit subject confirmation and authorization to execute, because the user expressly excluded privileged grants. Record grantor/reason/time and a reversible audit event. Set `academy.operator_subject` to the verified acting operator within the same privileged transaction; a database trigger requires this attribution and audits every grant/revocation atomically. Grants are revoked via status update, not deletion of history. No subject has been guessed or harvested from a restored snapshot.
4. Test that an ungranted current account is denied. Execute the approved operator-only grant with a transaction and before/after queries; verify revocation blocks the next platform operation; restore a grant only within the explicitly approved demonstration scope. No public provisioning endpoint exists.
5. Deploy to existing protected staging, preserving `APP_ENV=staging`; verify actual Clerk→HTTP→database claims, ordinary/wrong-role access, recipient proof, two-academy isolation and email allowlist. Explicitly confirm the intended approved test mailbox/personas before external delivery or tenant-owner grants. Initial policy/design approval is not the grant itself.
6. Run M1-T01–T14 at their required layers, including concurrent revoke/accept, interrupted dispatch/lease recovery, malformed inputs, cross-origin writes, stale context, representative workload/query plans, measured speed/bytes/cost and device/Arabic usability. Record each remaining failure or unavailable layer honestly.
7. Demonstrate synthetic complete journey and obtain owner acceptance independently of deployment/test success. Keep production and real onboarding closed.

## Recovery and outstanding scope

Rollback disables new entry points/delivery; retain additive records, audit and receipts. Do not drop created academies or revert financial/operating history. Unknown operations must be reconciled before repair. Protect matching proof-key custody during backup restore; never introduce it into the app's public bundle.

The scoped first setup edits one initial branch and sport. Multiple-branch administration, platform-seeded sport catalog/archive behavior, manager branch management, staff/guardian/player invitations, owner transfer/disputed recovery, support impersonation, business activation and commercial plans remain unfinished. AO-012 catalog/archive and the wider AO-019 operational checklist remain open. No operational module is presented as enabled. Owner policy/design acceptance does not accept these later capabilities or the current implementation's runtime behavior.

## Implementation refinements from the design packet

Bounded context/platform pages use an immutable UUID cursor ordered by record ID, rather than the proposed name/creation-time tuple. Cursor values never grant authority, and every page filters current subject/platform capability. The local 30-membership test verifies 25+5 complete nonoverlapping results. Initial setup returns only the one initial branch and sport it edits; it does not introduce a misleading multi-branch directory. Other directory/admin actions remain later scope.

The shared API currently applies a conservative 10 mutations/minute and 60 reads/minute per hashed subject through existing Redis. These are technical safety limits, not commercial quotas. This differs from the proposed per-action windows; refine only after staged workload/abuse measurement. Direct RPC calls retain authority/transaction validation but do not inherit the HTTP Redis limiter. Global/tenant fair-use limits and hostile high-volume direct-RPC load are still security/performance gate work.

Final local outcomes: thirteen database test groups, including new-schema dump/restore, revoked grant, reissue invalidation, revoke/accept race complete bounded paging and atomic operator-attributed grant/revoke audit; 18 unit cases; four production-build browser checks; actual React UI with synthetic adapters; build/typecheck/lint. Backup/provider code was not changed. No staging performance, provider delivery, real-device or owner journey acceptance claim follows from these checks.

## Review branch and security carry-forward

Source implementation committed as `2378dc1` and pushed in [draft PR #1](https://github.com/nahrplatform-rgb/academyos-web/pull/1). The draft is intentionally unmerged; protected AcademyOS staging has not received M1. CI is tracked on the PR and is distinct from local SQL evidence.

On push, GitHub reported existing [Dependabot alert #1](https://github.com/nahrplatform-rgb/academyos-web/security/dependabot/1). Read-only API inspection confirmed open/high `GHSA-vfj7-8cjw-p6xm`, development dependency `braces`, `package-lock.json`, stack-exhaustion denial of service through deeply nested patterns; no first patched version was listed. The lockfile was unchanged by M1. Keep this existing tooling risk visible and restrict untrusted pattern input; no zero-finding/full-security claim. Remediation requires a reviewed available upgrade or affected-tool replacement; do not force an unverified override or weaken checks merely to remove the warning.

## Usage-reset checkpoint

See [the M1 resume checkpoint](onboarding-m1-resume.md). Supabase/Vercel AcademyOS connector access was restored and checked read-only; both CI runs on implementation head `3e46cc8` passed. No staging migration, proof-key configuration, privileged grant or invitation send was executed before the user-requested wrap-up.

## Staging continuation now underway

The [22 October staging execution receipt](onboarding-m1-staging.md) supersedes earlier apply/configuration blockers: the fresh actual backup was restored/rehearsed, M1 migration was applied to staging, the private proof key is configured, and rollback-only hosted SQL tests passed. Application release and privileged provisioning are separate gates recorded there.
