# Functional local development environment

13 November 2026 · EX-07 / MP-B01, supporting local-data/PWA work. Owner instruction: make local development usable for all implemented work, including offline, and handle commits/pushes from this workspace. Staging is a meaningful release checkpoint. This later instruction extends the [initial local-workflow setup](local-first-workflow-2026-11-13.md); it does not claim completion of unbuilt modules or every device/provider case.

## Current useful state

- **14 November Attendance:** the signed-in Academy Owner passed the normal production-mode Attendance flow in Chrome Nahr at localhost. Two fictional marks survived a reload and a closed-tab reopen with the local listener stopped. Reconnect synced automatically, and the scoped database read-back showed two marks, two history rows, one operation and one audit. Arabic online reopening showed the same result. A first DevTools-only cold navigation stalled while the listener stayed available. The fixture also checks browser relaunch and exact-original replay. See the [local Attendance checkpoint](evidence/ex07-local-offline-attempt-2026-11-14.json).
- **Live editing:** `npm run dev` → `http://localhost:3000/en`. The actual signed-in Academy Owner Home and four-player Academy A directory were observed in the existing Chrome Nahr window. The local server recorded successful current Home/People requests. The extension-controlled Hiếu sign-in tab was a different browser profile; do not confuse its form with the user's successful local login.
- **Production-mode local testing:** `npm run local:production` builds the same application and runs **`http://localhost:3100/en`**. The earlier numeric browser address is superseded by the correction below. Storage/worker scopes are separate from port3000; localhost-domain sign-in cookies may be shared, so verify the actual account. Both modes use verified in-memory offline configuration. No deployed alias changed.
- **Existing offline settings:** `ACADEMYOS_LOCAL_OFFLINE=true` opts this Mac into verified recovery of its two existing encrypted wrapping-root archives. The private file contains the opt-in and existing core credentials, **not** decrypted wrapping roots. Flags are enabled only in the local server process after exact staging/purpose/digest/key checks. Preflight reports `verified_archives_loaded`, both roots present and core settings configured.
- **Actual connected preparation:** the earlier port3000 Owner preparation entered Preparing, with successful workspace-key/download responses. On corrected port3100, the actual Owner chooser exposed Academy A/B, Academy A opened with four saved players, and personal-device preparation reached Online. These are connected observations, separate from the offline boundaries below.
- **Live browser boundary:** native Chrome Nahr is the actual Owner session at localhost; extension control was attached to a different profile. The clean production/server-stopped trial reopened Arabic Calendar with30 November sessions and Arabic Players with four records, then reconnected. The earlier mixed emulation/rebuild/reconnect failure is retained below; its cause remains unobserved. Live Attendance save/reopen/sync is still open. No sign-out, manual storage reset or register-original replacement was used to obtain these read results.

The local frontend uses shared **synthetic staging Clerk, Supabase and Redis**. The completed connected Attendance test wrote only its scoped fictional plan, moved occurrence, publication, preparation and register records through the normal app. The existing owner and Trainer identities were used. The earlier setup/rehearsal evidence below retains its original limits.

## Local access correction and stronger checks

The Owner reported “Access is unavailable” at the numeric production address. The actual `api/onboarding` handler rejects an Origin not equal to `req.nextUrl.origin` before session lookup. Installed NextURL normalizes numeric loopback to `localhost`. An unauthenticated numeric-origin POST returned403 in the request phase only; the canonical localhost request reached session checking and returned401. The numeric tab also showed the Gmail Platform account, but that was **not** the cause of this pre-authentication rejection.

The launcher, environment template, manual and continuation generator now use `localhost:3100`. Its exact local staging allowance was added to `config.ts`; every strict route Origin comparison remains intact, arbitrary hosts/ports remain refused, and hosted production still requires `staging.academy.nahr.dev`. Seven focused configuration tests passed, including an actual NextRequest origin match. On the real running app, the enhanced anonymous smokes passed for dev and production: same-origin POST401 with session timing, foreign-origin403 and other-local-port403. These assertions catch what the earlier public HTML/Clerk-redirect smoke missed. They are not signed-in database proof; the observed Owner chooser/Home/Players supply that separate live layer.

The clean production run then stopped the actual local server before reload: Arabic Calendar reopened offline with30 November sessions, and Arabic Players reopened with four permitted records. October/November/December totals observed before the clean trial were10/30/24; restoring network returned Players with four records and the connection label متصل. The earlier mixed emulation/reload remains a retained failed trial: it first showed no prepared workspace and an absent `academyos.register-account.v1` locator after a server-stopped attempt, but its cause is **not observed**. `clearRegisterAccount` is the canonical marker-removal path; do not weaken account cleanup or count that mixed run as a product failure. The clean scope is recorded in [the offline reopen receipt](evidence/local-functional-environment/offline-reopen-2026-11-13.json). Offline Attendance save/reconciliation and installed-device proof remain open.

The phone walkthrough also found the generic toolbar `.badge` hiding rule concealed Offline. The existing connection badge now has a dedicated class and status semantics, with one narrow phone display override. The protected workspace fixture asserts visible EN Players and AR Calendar offline statuses at390px, then restores its viewport; existing read/transfer budgets remain. No sync, cleanup, key or permission rule changed for this presentation repair.

## Secure runtime integration

The coordinator added the local-only adapter in `scripts/local/workflow.mjs`. One bounded Terra helper implemented `scripts/local/runtime_keys.py` and `test_runtime_keys.py`; no nested helper was used. The Python adapter reuses unchanged `scripts/register-key/custody.py` and independently retained repository receipts for the exact existing register/workspace capabilities. It validates bounded input, absolute paths, exact receipt scope, purpose, digest and a FIFO/socket output channel.

Recovered roots travel only through inherited descriptor 3 into the parent process, then the server environment. They never enter helper stdout/stderr, command arguments, a plaintext key file or an evidence record. The parent rejects unexpected output, bad types, additional fields, identical roots, reuse of the signing secret, a mismatched existing root or a foreign backend. Errors are constant and sanitized. No replacement root is generated and no remote environment is modified.

`preflight`, `dev` and `production` can perform the explicit local recovery. Fixture verification does not invoke it and retains its minimal environment allowlist. The source fingerprint now includes Python local-tool sources. The existing CI tooling step includes the six mocked adapter tests; CI has no Owner archive/identity requirement. Actual model/provider telemetry and cost savings were not available; requested helper configuration is the existing `gpt-6.1-terra`, medium-effort route, peak one helper.

This is engineering/source and local recovery evidence, not an independent human security review, assurance against all same-origin threats or a claim that encrypted storage survives OS deletion. The existing account, cleanup, original, attendance-deadline and conflict contracts remain.

## Executed verification

| Check | Result and boundary |
|---|---|
| `npm run local:preflight` | Passed actual recovery from this Mac's existing protected archives; metadata only, no key output. Configuration presence/recovery, not a completed app journey. |
| `node --test scripts/local/workflow.test.mjs` | Final 10 passed: prior launcher/evidence tests plus private-pipe opt-in, staging/root/output fencing, sanitized refusal and simultaneous-run evidence isolation/atomic report replacement. Recovery transport is mocked in these units. |
| Python runtime adapter tests | 6 passed: exact purpose/digest binding, invalid/oversize input, root collision, wrong scope, unsafe output descriptor and sanitized errors. Mocked roots/fictional receipts, not actual age/provider proof. |
| Existing custody tests | 12 passed, including disposable age roundtrip and hostile/scope/replacement cases. These supplement the actual private preflight without exposing Owner keys. |
| Workspace download/browser suite `--record` | Passed 70 checks in 41,467ms. Real signed handlers/disposable PostgreSQL/Chromium/protected repositories and worker behavior; fictional identity/provider transport, no live credentials. |
| Normal Attendance suite `--record` | Passed 28 checks in 96,327ms, including local save/original, cold reopening, reconnect/recovery, deadlines/account fencing and Owner task returns. Same declared synthetic fixture boundary. |
| Owner startup suite `--record` | Passed 8 checks in 18,638ms, including startup/account recovery under its declared fixture boundary. |
| Production build / compiled guard | Owning production build/start and current source/asset guard passed with the private local settings loaded only in server memory. |
| Serial public reruns after evidence repair | Development passed in 2,828ms; production passed in 2,261ms, each with its own unique trace/capture bundle. Anonymous EN/AR/phone/fence scope only. |

Before that combined offline checkpoint, the workspace receipt had three source mismatches (root manifest, device hook and Experience component), normal Attendance had two (navigation/Experience) and startup had one (navigation). The actual owning suites were rerun to refresh those receipts; their hashes were not hand-edited. Separate fixture subprocesses received a minimal runtime environment with no connected secrets. Their canonical receipts/captures remain in their existing directories. The private local run log/result is under `test-results/local-workflow/functional-parity/`; raw connected logs remain ignored.

Actual signed-in local Home/Players and successful transfer responses are a stronger layer than anonymous smoke, but they do not prove offline completion, actual upload/reconciliation after disconnect, every role or installed-device behavior. The successful fictional suites are not relabelled as those live results.

The 114 application unit tests, typecheck and lint passed again for this connected checkpoint; their output exposed existing npm `allow-scripts` configuration warnings, not a new application failure. Execution/master/PWA/implementation/continuation checks passed, including 20 continuation tests. The existing factual HTML source-freshness guard passed for unchanged product capture inputs. No new complete visual/installed acceptance is inferred.

**Evidence collision correction:** the coordinator incorrectly launched the development and production public smokes concurrently. Both reached their assertions, but the old millisecond-only naming chose the same artifact directory, so those mixed traces/captures are invalid evidence and remain ignored under `test-results/local-workflow/2026-11-13T14-58-56-372Z-public/`. The launcher now allocates unique directories and atomically replaces latest JSON; a disposable 16-way test verifies separation and intact reports. The two public smokes are rerun serially after this repair. Do not cite the collided directory as either environment's proof or repeat unrelated offline suites for this logging-only repair.

## Working method and remaining scope

The [operating manual](../06-delivery/local-development-and-verification.md) is updated: all implemented features need a usable local path/settings/test-data boundary; focused checks during editing, one coherent related checkpoint, then commits/pushes here under existing authority. A push can trigger existing CI/Preview automation; it does not require immediate canonical promotion. Ordinary authorized Git work is not newly approval-gated. Existing uncommitted product/design/test edits are preserved; this setup does not bulk-commit them to make the tree clean.

Local production is the right place for cold offline/worker checks; dev HMR is not assumed to supply production-compatible cached assets. Current email/payment providers and public callbacks remain disabled/unconfigured unless explicitly provisioned for a declared test. New finance, richer profiles, broader roles and future offline commands still need their real implementation/contracts. Installing a PWA or copying a secret cannot create those features.

**Current follow-up:** use the [generated continuation](../06-delivery/continue-academyos.md) for the queued MP-B01 Calendar/Players Operations work. The [Trainer delivery repair](trainer-delivery-repair-2026-11-14.md) and [local Attendance checkpoint](evidence/ex07-local-offline-attempt-2026-11-14.json) record the completed prerequisites and the observed failures.

The 28-case normal Attendance fixture and clean local Players/Calendar offline evidence remain useful. The new opt-in Attendance check runs the real Next routes and workers against a disposable database and reports a compact receipt. Use the [verification manual](../06-delivery/local-development-and-verification.md#signed-in-browser-checkpoints) for the separate signed-in smoke.

[Machine-readable current receipt](evidence/local-functional-environment/receipt.json) records input/fixture hashes, private-safe configuration facts, actual checks and the invalidated evidence boundary. Pinned quality commands use the launcher's runtime shims so nested npm invocations also resolve Node24/npm11.19.1. No decrypted wrapping material or live session is copied into that receipt.

## 14 November Platform Owner boundary — historical observation

The separate authenticated `nahr.platform@gmail.com` Platform Owner Chrome session loaded the local `/en/platform` Academy admission surface with two admitted synthetic academies. The normal Platform surface exposed no Trainer-recipient approval control. At that observation no invitation/configuration/access change was made. Later exact recipient authorization and the changes below supersede this initial eligibility boundary; do not ask for another Platform approval control that the implemented UI does not contain.

## 14 November authorized Trainer invitation

The exact mailbox `moamen-ghareeb@outlook.com` was authorized for this synthetic Trainer test. From the normal Academy Owner **Trainer appointments** flow, `Synthetic Offline Trainer 2026-11-14` was created for Synthetic Main Branch. The first UI observation was queued/not sent. Later database verification establishes pending/blocked/attempts1 and no provider receipt or assignment. The local callback targets the hosted worker; local core/key readiness does not supply provider delivery parity.

## 14 November staging recipient configuration

The first edits were incorrect: encrypted provider output was treated as a prior plaintext recipient, and the subsequent two-address invitation list/three-address verification list exceeded source limits. The14November repair now verifies exactly one invitation destination, two verification destinations and one authorized Trainer recipient in project settings. This has not yet been applied by a new deployment. The [repair packet](trainer-delivery-repair-2026-11-14.md) records exact contracts, temporary mailbox coverage, readback, restoration and guarded recovery.

## 14 November recipient deployment checkpoint

**Correction:** the agent created production-target deployments `dpl_2hzouEv9gjQbjx6tJ7wJfBzRD6b1` and `dpl_21p2C6fzJDvSoZWzzMun39TutcK5`; Vercel automatically assigned staging aliases. The earlier “Owner-authorized” description was inaccurate: these actions breached the Owner-only release rule. Current staging resolves to the latter Ready deployment with source `aedb3ad`; it still predates the corrected settings. No further deployment/alias action occurred in the repair checkpoint. No delivery/acceptance or Attendance completion is inferred.

## 14 November hosted retry handoff

The earlier retry tab reached Clerk sign-in; the Owner later reported signing in. Neither fact proves invitation acceptance. The current human handoff is **Owner redeploy of `aedb3ad` with the corrected latest settings**, linked in the repair packet. The rolled-back recovery proved one delivery-only update, one audit and repeat idempotence without an email or access grant. Once the actual release is verified, continue the same invitation through normal delivery and recipient acceptance, then the live local Attendance check. Existing accounts and pending work remain intact. Local dev was restarted at `localhost:3000`; this is server readiness only.
