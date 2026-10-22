# M1 staging execution — 22 October 2026

Current execution receipt; supersedes earlier source-only/apply-pending statements in the [implementation history](onboarding-m1-implementation.md) and [usage-reset checkpoint](onboarding-m1-resume.md). Policy/design accepted; working-journey acceptance remains open.

## Database and recovery evidence

Fresh encrypted pre-apply backup [39784097969](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39784097969) succeeded. Downloaded encrypted package SHA-256 `010e7c8fb92a162e41f67610d20a84a193059ff8c63d08cd76ad91262230d2fe`, 153832 bytes, matched the trusted workflow log/receipt. Local recovery validated all manifest checksums; Storage object count was zero for this snapshot. Recovery key and recovered payload stayed in permission-restricted local storage.

Actual hosted baseline restored into a disposable socket-only PostgreSQL 17 cluster. Replayed the reviewed M1 migration in one transaction; existing membership-boundary tests passed. Result: one restored identity, zero academies/memberships, eleven private tables with RLS after migration. No private identity values were printed by the rehearsal. Eleven backup-safety tests and thirteen onboarding database groups also passed after the rehearsal addition. `rehearse_local.py --migration <repository-migration>` is optional, accepts only a reviewed file from this repository's migration directory and cannot target an existing/remote database.

Applied `controlled_onboarding_m1` to **snpphkenmvmhpjstbeul only**, hosted version `20261022130955`. Local filename now matches provider history to prevent duplicate replay. Source SHA-256 at apply: `16f1a42056322ba3fe64c3e19b27e0c59d57e1e03bca9f967e05db1a17a08dce`. Before apply: four migrations, three private tables, one identity, zero academies/memberships. After apply: five migrations, eleven RLS tables, no direct authenticated SELECT/INSERT grants, zero academies/memberships/platform grants.

A new rollback-only hosted SQL packet (`supabase/tests/onboarding_boundary.sql`) passed first locally, then on staging under simulated JWT claims/roles. It checks repeat creation, intended-recipient acceptance, two-academy denial, private-table denial, wrong-role/platform denial, incomplete completion, stale version, branch/sport persistence, resume, suspended membership and unsigned/anonymous calls. The transaction uses synthetic non-account subjects; it creates no Clerk accounts and commits no grant or business record. Postcheck confirmed zero academies/memberships/platform grants/audit events. This proves hosted SQL logic, **not actual JWT verification at the Data API, HTTP or browser authorization**.

The pre-apply review also corrected JSON field-type validation and aligned invitation operation-lock order. No assertions were weakened. The migration was rehearsed and applied with those fixes already included.

## Private key and provider boundary

`ONBOARDING_PROOF_KEY` is configured as a Secret for this existing project's Vercel **Production target, which is AcademyOS staging**. The matching value exists only in private `academy.m1_secrets` and a restricted local custody file. No value is in source, docs, PR text or application logs. No Preview or unrelated project credential was added, and no platform grant was created during key configuration. The separately authorized bootstrap is recorded below. Owner vault custody confirmation remains a handoff task.

Advisor result after apply: eleven informational RLS-with-no-policy notices (intentional direct-table denial); eleven authenticated SECURITY DEFINER warnings (including the two baseline functions); one anonymous SECURITY DEFINER warning for the HMAC-proof-gated delivery worker. These are deliberate sensitive boundaries requiring negative verification, not a clean/full-security result. References: [private-table notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [authenticated function warning](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [anonymous worker warning](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Application release and remaining gates

The updated source passed local lint/build, 18 unit cases, four production-build browser checks and the actual-React synthetic UI runner. A self-account reference is displayed on the context chooser so the owner can confirm the correct identity before provisioning; it does not grant authority.

Release commit, deployment ID, protected staging runtime observations and acceptance are recorded below as executed. Until those receipts exist, do not infer app deployment from database apply. Initial Platform Owner provisioning still requires explicit confirmation of the exact currently authenticated Clerk subject and the scoped grant; no durable platform/tenant access or invitation send has been executed by this checkpoint. Real-device/Arabic usability, actual provider delivery, hosted authenticated isolation and measured latency/cost remain open.

### Additional real gateway checks

Using only the browser-safe publishable key, actual staging Data API requests returned HTTP 401 / SQLSTATE 42501 for anonymous `m1_context_v1` and unsigned `m1_delivery_v1`. A forged unsigned Clerk-shaped JWT was rejected with HTTP 401 / PGRST301. No record was written. The first local Python attempt failed before any response because its default CA store was unavailable; using the system CA bundle retained TLS verification and all three denial assertions passed. These are real negative gateway checks, still not positive authenticated-user or tenant/browser proof.

Staging release requested for exact source commit `686e6d16e314d2a3ab1c58f4c437256aabaf0d32`, deployment `dpl_5VjnKzrHok6Ek54TK9K4kjYw2NE4`, target Vercel Production / AcademyOS staging. No production customer environment exists or was launched. Ready/alias/runtime confirmation is required before treating the request as deployed.

### Protected staging app release confirmed

Deployment `dpl_5VjnKzrHok6Ek54TK9K4kjYw2NE4` reached READY for exact commit `686e6d16e314d2a3ab1c58f4c437256aabaf0d32`. Its aliases include `staging.academy.nahr.dev` and `academyos-web.vercel.app`. Vercel Production here is the pre-existing AcademyOS **staging** target, not a customer production launch. Existing SSO protection applies to all deployments; it was not disabled.

Authenticated Vercel fetches against the canonical staging host returned HTTP 200 for `/api/health` (process-only JSON), `/en` (expected English entry content) and `/ar` (expected Arabic entry content). These are deployed route/configuration checks, not a signed-in Clerk user journey. The current local suite remains green; the commit's GitHub checks were still running at this runtime check and must be recorded separately when complete.

The app displays a self-account reference on the membership chooser. The initial platform bootstrap is prepared in a local permission-restricted operator file, not committed with a target identity. Moamen was asked to compare the displayed current reference and explicitly authorize the exact staging-only capability. Until that response, no durable grant, owner invitation or academy membership is executed. Matching proof-key custody is in a mode-0600 local file under the owner configuration directory and still needs owner vault confirmation; never paste its value into chat or commit it.


### Initial Platform Owner bootstrap executed

Moamen confirmed that the signed-in staging account reference matched the prepared target and explicitly authorized the staging-only Platform Owner grant. Executed the prepared transaction against `snpphkenmvmhpjstbeul`, with the operator identity, reason, advisory lock and state-change guards. The mandatory audit trigger ran in the same transaction.

A separate post-commit read confirmed exactly one active platform grant and one `platform.grant` audit event, with zero academies and zero tenant memberships. This enables platform academy admission/invitation management; it adds no Academy Owner membership or private tenant-content access. The target account reference remains in the restricted operator file rather than this receipt. Positive signed-in browser verification remains open; the owner should refresh the staging workspace to expose the platform entry.

Both current PR checks passed: [verify 39785510213](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39785510213) and [verify 39785518068](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39785518068). The deployed app source remains `686e6d16e314d2a3ab1c58f4c437256aabaf0d32`; subsequent receipt-only commits do not change that runtime.

The next hosted journey requires a named synthetic academy and explicitly approved owner recipient. No invitation was sent as part of this bootstrap. Actual delivery, recipient acceptance, restricted workspace entry, resumable setup, hosted authenticated isolation, measured performance/cost and working-journey owner acceptance remain open. Policy/design approval and this privileged grant authorization do not close those evidence gates.


### Authorized synthetic academy journey

Moamen explicitly authorized the clearly labeled synthetic academy and owner invitation to the existing approved staging mailbox. Browser control became available. Using the signed-in platform UI, created **AcademyOS M1 Synthetic Academy** (`b2c7920d-d467-4e9f-9a68-809ac627399e`). The database confirmed one invitation, generation 1, one worker attempt and a provider receipt; expiry is `2026-10-25T13:28:55.43085Z`. The intended mailbox displayed the bilingual invitation from the configured sender. No additional destination or persona was provisioned.

By the time the agent inspected the received link, the appointment was already accepted; do not attribute that acceptance click to the agent. The UI showed the named academy/owner receipt and setup entry; the database independently recorded one `owner.accept` event. The fragment was cleared after link exchange. Raw invitation links must not be copied into documentation or screenshots.

The owner-only setup workspace opened. Saved **Synthetic Main Branch**, `Africa/Cairo`, **Synthetic Football / كرة قدم تجريبية** and completed initial setup through the app. Reload before sport setup restored the committed branch/timezone. EN/AR navigation preserved saved state. Arabic setup at a tab-specific 390px emulated viewport had document width 390px and RTL locale wrapper, without horizontal overflow. This is browser emulation, not a physical phone or native-language/screen-reader acceptance result. A private local screenshot records the English completed receipt; no inbox capture was committed.

The hosted database confirmed `timezone='Africa/Cairo'`, one branch/sport association and setup completion. Timezone is a per-academy IANA setting; this does not change the database clock or establish future scheduling/local-time behavior. Audit times remain timestamp-with-time-zone records. Five successful setup writes were observed during this shared signed-in session; owner/browser activity cannot be assigned solely to the agent.

Moamen accepted the working wording/usability with a specific timezone issue: free-text entry was hard to choose and its persistence unclear. Implemented a searchable native dropdown using 419 stable ICU IANA choices (including UTC), all verified against staging `pg_timezone_names`. Existing saved aliases/selections remain visible when filtering; no timezone is guessed; database validation and save operation remain unchanged. Extended the actual-React synthetic transport check to choose Cairo, retain that selection on an empty search and assert its saved payload. This does not implement future calendar behavior or accept the remaining security/performance gates.

A real two-tab edit test encountered HTTP 503 rather than the expected conflict. Both original operation lookups reported no committed receipt; the proposed stale branch name was not persisted. Do not mark hosted conflict handling passed. Added bounded diagnostic logging containing only the failing phase or sanitized provider error code, never payloads, tokens, subjects or provider messages. Root cause and post-fix deployment verification remain required. Performance advisors also reported six unindexed foreign keys and two unused indexes; no speculative schema change was made. See [foreign-key advisory](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).


### Hosted conflict root cause and forward repair

The hosted two-tab test exposed a defect missed by direct PostgreSQL tests: business version checks raised SQLSTATE `40001`. The hosted API retried these deterministic failures until the application deadline, producing HTTP 503 and a large error-log burst. [Supabase's documented failure and remedy](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions) matches the observed behavior. These retries rolled back; they did not persist the stale draft. This is a correctness, performance and cost defect, not a successful conflict test.

Replaced only the two business-version exceptions in the setup and invitation-management functions with `PT409`, which maps to HTTP 409 without serialization retry. All authorization, locks, receipts and transaction effects remain unchanged. Rehearsed the additive function-replacement migration with all thirteen isolated database groups passing; updated the hosted rollback test to assert the new specific SQLSTATE and added client mapping coverage (nineteen unit cases passed). Applied the repair to staging as `20261022133922_bounded_onboarding_conflicts.sql`; retained the original applied migration unchanged. Matched four offending backend IDs between error logs and active M1 requests; three were still present and were terminated with narrow role/query guards. The fourth had already ended. Subsequent read confirmed zero of those old backends, saved setup version 5/completion true/timezone Cairo intact, and both functions contain PT409 with no manual 40001 exception. App mapping deployment and successful hosted conflict retest are recorded separately when executed.
