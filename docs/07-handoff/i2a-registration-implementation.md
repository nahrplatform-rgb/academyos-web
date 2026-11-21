# I2a synthetic player registration — implementation receipt

24 October 2026. Moamen accepted the narrow policy and then explicitly approved the connected registration design for implementation. [Policy](../06-delivery/i2-people-first-slice-decisions.md), [contract and budgets](../06-delivery/i2a-registration-design-contract.md), [security review](../04-engineering/i2a-registration-security-review.md).

## Implemented outcome

J06-A01 / S16–S18: existing Academy Owner → completed setup / explicit initial branch → paginated player directory → fictional name and optional unverified `@example.invalid` contact → scoped name candidates → existing profile or explicit different-person confirmation → review → atomic registration → persisted profile. No login, guardian link, enrollment, invitation or activation is created. Setup has a real Open players link. Existing M1 behavior is retained.

New `/api/people` route validates exact allowed fields, bounds streaming input, enforces same origin/staging/session and shared rate limits. Five explicitly named RPCs enforce current active Owner and academy/resource scope. Three private RLS tables store players, same-name revisions and people receipts. Separate receipts prevent M1's generic operation lookup exposing people results. Audit contains result IDs, never raw names/contact. Lost-response recovery keeps only an actor/academy-scoped opaque operation UUID in session storage; missing receipt is atomically fenced/cancelled before replacement. All other draft fields stay in memory.

## Local verification

- Disposable PostgreSQL 17: **25 groups passed**, including the 16 existing M1 groups plus persistence/projections, changed intent, foreign academy/branch/player/receipt, platform-only and wrong-role denial, revocation, direct gateway bypass, same-name/exact-operation concurrency, stale review, rollback, recovery fence, paginated candidates and function limits.
- Unit tests: **33 passed**. Actual route harness: 15 limiter timeout/denial/outage cases plus invalid fields/size/contact and cross-origin denial; no RPC on denied entry.
- Actual React component with synthetic identity/transport adapters: passed in production and development modes. Checked duplicate distinction, opening existing without creating, stale review, pending submission, lost-response recovery, actor switch, revoked profile clearing, EN/AR draft preservation and 360px reflow. This does not substitute for real SQL/HTTP or hosted identity evidence.
- Build, TypeScript, lint and existing five foundation E2E checks passed. [UI receipt](evidence/i2a-local-2026-10-24/ui-receipt.json), [local scale measurements](evidence/i2a-local-2026-10-24/sql-scale.json). Local 1000-player/800-same-name p95 function execution under6ms and responses under6KiB; excludes HTTP/identity/limiter/cold starts/device. Full proposed budgets remain unverified.

## Staging / acceptance status

Fresh encrypted backup [40084175093](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40084175093) succeeded. Downloaded ciphertext matched the receipt and trusted successful workflow log; the restored baseline plus forward migration passed the membership boundary suite ([receipt](evidence/i2a-local-2026-10-24/restore-receipt.json)). Recovered plaintext and the disposable cluster were removed. The rehearsal exposed missing signing-extension scaffolding and an outdated unsigned membership fixture; both were corrected in the local restore/test harness without disabling the verifier. Backup safety suite: 11 tests passed. Hosted rollout remains separate. Migration is additive; no account or membership grant, outbound email, existing-record rewrite or destructive rollback is included.

Source implementation and local checks are complete; hosted schema/app/runtime are pending at this point. Owner approval covers policy/design, not the deployed registration feature. Independent human security review, physical-device/screen-reader acceptance, hosted workload/cost meters and broader I2 people/guardian policy remain open. Uncommitted design-chat planning files are preserved separately.

## Hosted rollout — 24 October 2026

Initial source `0349e88622a72cf2f142c01e08fb9e7acc971a8a` reached READY as `dpl_7oBGEJj8XufJkChKjwbEj1xsb2MR`; the deployment reported the canonical staging alias. Both source CI runs [40084691751](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40084691751) and [40084688984](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40084688984) passed, including new people route/UI checks. No production customer environment or protection setting was changed. Vercel's `production` target is this existing synthetic staging project.

Supabase recorded migration `20261024100827` / `i2a_synthetic_player_registration`. The connector assigns the applied timestamp; the local SQL file was renamed to that actual version with identical contents. The restore receipt retains the original rehearsal filename as historical evidence. Staging confirmed five new bounded RPCs, no anonymous execution, three private RLS tables with no authenticated direct table grants, and existing academy/membership counts unchanged.

Through the existing signed-in Owner session, registered **Synthetic Registration Demo** with fictional `demo-contact@example.invalid`. The saved profile appeared; reload restored the directory record; a second same-name review returned the existing candidate with confirmation disabled until explicit distinction, and opening it did not create another record. EN→AR preserved the candidate. The live check exposed inherited LTR direction beneath the English route wrapper; the follow-up shell sets its own locale/direction and the React harness now nests it beneath an opposite-direction wrapper. Follow-up deployment is recorded separately below.

Owner A's session was denied at academy B's player route with no player/contact projection shown ([capture](evidence/i2a-local-2026-10-24/staging-foreign-academy-denied.png)). Database independently confirmed one player, one registration receipt and audit, zero players in academy B, two existing memberships and two existing invitations. This is hosted happy path, reload, duplicate-existing and one-direction UI isolation evidence; reverse-account HTTP denial, hosted concurrency/response-drop/revocation and workload measurements remain separate from the real local SQL cases.

[Boundary/advisor receipt](evidence/i2a-local-2026-10-24/staging-boundary.json): the private deny-by-default tables and explicitly authenticated SECURITY DEFINER APIs still generate documented informational/warning notices. The one anonymous signed-worker endpoint predates I2a. Five new authenticated function warnings are expected reviewed boundaries, not a clean-audit claim. Performance advisors identify a new informational compound branch-FK index gap; this slice never changes/deletes a branch key. Future branch-key maintenance must address its covering index and scale behavior. No warning was suppressed or RLS weakened.

Current remaining gates: independent human security approval, physical devices/screen readers and hosted workload/provider-meter evidence. Owner acceptance of wording/usability is recorded below. The broader M1/I2 journey families are not declared complete by this slice.

Follow-up verification also covers literal rendering of XSS-shaped names, two-character search guidance and debounce behavior. Old directory responses are invalidated immediately when search changes; superseded reads are aborted before the next lookup. The shared shell now enforces its own locale/direction beneath an opposite-direction route wrapper. Actual staging anonymous `/api/people` read returned HTTP401. No bearer token or session credential was exported for these checks.

### Follow-up findings and recovery

Source `5f2d9545e5e4653af6f9178460df87c633093228` reached READY as `dpl_3eyzKCk3Cbu1iDeg9jY3qiQS6w8w`. Live language switch beneath the English route measured computed shell direction `rtl`. One browser load failed to initialize Clerk JS (`failed_to_load_clerk_js`); a fresh reload recovered the authenticated directory without any provider/configuration change. Added a15-second sign-in initialization deadline with an EN/AR retry action and no private-data calls while unresolved. Actual React tests exercise that deadline with a controlled clock; this does not claim the external provider failure cannot recur.

CI40085404646 failed because the older foundation `[dir]` selector now matched both locale wrapper and shell. The assertion was narrowed to `.app-scene`, with additional language and computed-direction assertions; no expected business result or visibility assertion was removed. All five local foundation E2E cases pass after that correction. The final deployment/CI receipt follows below.

## Final deployed source and checks

Final app source **`e84d51bb96b44964033bc493b65bcb8862f18752`**, READY deployment **`dpl_G9dwFFNUejopeCMBnaAWTaWxWFq4`**, canonical alias **https://staging.academy.nahr.dev**. Exact-source CI [40085968853](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40085968853) and [40085964368](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40085964368) both passed. These supersede the earlier failed ambiguous-selector run. The private schema, one fictional registration and existing memberships/invitations remain intact; no new grants or outbound invitations were issued.

Implemented: yes. Local checks: passed as scoped above. Deployed: yes, existing synthetic staging. Hosted basic journey/isolation: passed as described above, remaining hosted cases explicitly open. Policy/design: owner accepted. Implemented feature usability/wording: accepted by Moamen on 25 October 2026. Full independent security/device/performance/cost acceptance: pending.

Final-source browser reload loaded the authorized directory and existing profile. English and Arabic [profile captures](evidence/i2a-local-2026-10-24/final-staging-profile-en.png) / [Arabic](evidence/i2a-local-2026-10-24/final-staging-profile-ar.png) show the persisted fictional contact and no relationship authority; the Arabic shell's computed direction was `rtl`. Final database read still showed exactly one player/registration receipt/audit, two memberships and two invitations.

## Owner acceptance — 25 October 2026

Moamen selected **“Accept the working registration flow”** in response to the deployed EN/AR wording/usability review. This records acceptance of the working narrow I2a registration flow: fictional name, scoped duplicate review, save and reopening the profile. It does not approve real data, guardian authority, production launch, new privileged access or independent security/device/load/cost gates. Remaining hosted reverse-account HTTP, concurrency/response-drop/revocation and workload cases remain open as recorded above.

## Hosted continuation — 25 October 2026

[Two-form conflict and interrupted/lost-response verification](i2a-hosted-verification-2026-10-25.md) adds actual hosted evidence and records a stale operation-notice defect with its bounded repair. Prior source/deployment/count snapshots above remain historical. Remaining independent/hosted/device/cost gates are retained.
