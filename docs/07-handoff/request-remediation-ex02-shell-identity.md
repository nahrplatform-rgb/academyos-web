# EX-02 — shell versus identity measurement

2 November2026. Authorized living continuation from [dated-resume checkpoint](request-remediation-ex02-dated-resume.md). J01-A01/IMP-J01-A01 and J09-A01/IMP-J09-A01, existing S03/S22/S23/S25, L01/L04/L07, SEC-J01/SEC-J09 and AO/AT joins retained. NR04/G01 measurement only: no app, API, database, permission, cache, dependency or deployment-setting change.

## Question and method

Does the visible wait prove every navigation reloads the document, shell or identity provider? Inspect source first: `apps/web/src/app/layout.tsx` places the real ClerkProvider at the root; `workspace-shell.tsx` places WorkspaceLayoutProvider inside each shell; Experience and date-planning journey wrappers render PublicWorkspace while `useUser().isLoaded` is false. Those are distinct ownership boundaries. A shell remount does not itself prove a Clerk network lookup, server auth call or SQL query.

Extended the isolated actual Next production routing harness with opt-in `EX02_SHELL_MEASURE=1`. Its existing fictional identity/HTTP adapters remain explicit. At bundle time only, an esbuild onLoad transform adds a mount/unmount effect to the actual WorkspaceShell wrapper. The repository product file is unchanged; no diagnostic counter, synthetic event handler or telemetry enters the product build. The identity fixture can deliberately toggle pending/ready through its external store to exercise the existing wrapper branch. It does not implement or measure ClerkProvider, FAPI, BAPI or token behavior. The ordinary harness mode remains uninstrumented.

Each EN/AR scenario waits for route heading, current projection and expected read completion before snapshotting. Initial row visibility alone can still belong to the departing route, so it is not used to infer transition completion. Recorded document marker and document request counts distinguish client route transitions from document loads. Existing dirty/busy/unknown, long-list/history, event-pair and local-control assertions run afterward unchanged.

Run locally:

```sh
EX02_SHELL_MEASURE=1 UI_EVIDENCE_DIR=/tmp/academyos-shell-identity node scripts/navigation/test_next.mjs
```

The opt-in diagnostic is not a newly enforced CI gate. Current default CI still executes the ordinary actual Next suite. No mutation/load test or access restoration is authorized by this measurement.

## Results

Both EN/AR sequences are the same:

| Step | Shell mounts / unmounts | Cumulative domain reads | Documents |
|---|---:|---:|---:|
| Home | 1 / 0 | 1 | 1 |
| Calendar | 2 / 1 | 2 | 1 |
| Selected date | 3 / 2 | 3 | 1 |
| Same-date focus | 3 / 2 | 4 | 1 |
| Local language | 3 / 2 | 4 | 1 |
| Calendar return | 4 / 3 | 5 | 1 |
| Forced identity pending | 5 / 4 | 5 | 1 |
| Identity ready | 6 / 5 | 6 | 1 |

Route-level shells really do remount in this scoped actual-router fixture. Same-page authority refresh and locale controls do not. The browser document survives and only one shell exists at each snapshot. Forced identity pending replaces the private shell with its public sign-in placeholder; readiness creates a fresh scoped projection. That last experiment proves the code branch's mechanism, **not that real Clerk toggles pending on every route or resume**.

These counts do not establish that remounting causes the perceived wait. The required domain reads continue independently, and prior checkpoints already measured height collapse and redundant lifecycle reads without same-route shell remount. No shared authenticated-layout rewrite is justified from this count alone; root identity stability, focus/scroll/geometry effects and actual provider requests need correlated evidence before such a change.

## Hosted attempt and limits

Read-only native Chrome attempt used the existing synthetic Academy Owner dated task. DevTools was intended to filter `accounts.dev` after clearing prior requests, without exporting headers, cookies, tokens, private bodies or HAR. Native focus transitions between DevTools and the app triggered additional current-authority checks and interrupted the intended clean route sample. Early attempted text input did not update the filter; direct AX setValue then confirmed it, but there was no clean completed route interval. **No hosted auth request rate, route-to-provider causality, positive zero, latency, shell mount count or backend cost is reported from this attempt.** Diagnostic tools were closed; no operating save or access grant was performed. The prior dated-resume native1request evidence remains valid in its original scope.

G01 therefore remains partial. A future hosted capture needs reliable focus/input ownership, exact interval and URL-path-only sanitization; observed accounts.dev browser traffic still would not reveal server Clerk BAPI/SQL/Redis work. No credentials, private payload or production counters should be introduced to make this easier.

## Decision and next work

Keep current production implementation unchanged at this checkpoint. Shell ownership is confirmed locally; identity-refetch causality and harmful remount cost are not. Continue the concrete EX-04 unhinted cold Calendar/read-dependency measurement while preserving remaining EX-02 hosted role/history and shell/identity gaps. Neither the whole redesign nor NR04 is declared complete. Owner acceptance and independent security remain open; there is no new feature to approve or deploy.

PYSA remains read-only reference: scheduling review, Player schedule's local filtering and EV-0025 historical weekday-loss evidence were rechecked. They support preserving orientation and verifying actual outcomes; they do not establish AcademyOS's provider lifecycle or authorize copying source/permission assumptions. No PYSA behavior was freshly tested live.
