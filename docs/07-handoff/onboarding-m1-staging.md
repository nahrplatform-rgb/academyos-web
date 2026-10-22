# M1 staging execution — 22 October 2026

Current execution receipt; supersedes earlier source-only/apply-pending statements in the [implementation history](onboarding-m1-implementation.md) and [usage-reset checkpoint](onboarding-m1-resume.md). Policy/design accepted; working-journey acceptance remains open.

## Database and recovery evidence

Fresh encrypted pre-apply backup [39784097969](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39784097969) succeeded. Downloaded encrypted package SHA-256 `010e7c8fb92a162e41f67610d20a84a193059ff8c63d08cd76ad91262230d2fe`, 153832 bytes, matched the trusted workflow log/receipt. Local recovery validated all manifest checksums; Storage object count was zero for this snapshot. Recovery key and recovered payload stayed in permission-restricted local storage.

Actual hosted baseline restored into a disposable socket-only PostgreSQL 17 cluster. Replayed the reviewed M1 migration in one transaction; existing membership-boundary tests passed. Result: one restored identity, zero academies/memberships, eleven private tables with RLS after migration. No private identity values were printed by the rehearsal. Eleven backup-safety tests and thirteen onboarding database groups also passed after the rehearsal addition. `rehearse_local.py --migration <repository-migration>` is optional, accepts only a reviewed file from this repository's migration directory and cannot target an existing/remote database.

Applied `controlled_onboarding_m1` to **snpphkenmvmhpjstbeul only**, hosted version `20261022130955`. Local filename now matches provider history to prevent duplicate replay. Source SHA-256 at apply: `16f1a42056322ba3fe64c3e19b27e0c59d57e1e03bca9f967e05db1a17a08dce`. Before apply: four migrations, three private tables, one identity, zero academies/memberships. After apply: five migrations, eleven RLS tables, no direct authenticated SELECT/INSERT grants, zero academies/memberships/platform grants.

A new rollback-only hosted SQL packet (`supabase/tests/onboarding_boundary.sql`) passed first locally, then on staging under simulated JWT claims/roles. It checks repeat creation, intended-recipient acceptance, two-academy denial, private-table denial, wrong-role/platform denial, incomplete completion, stale version, branch/sport persistence, resume, suspended membership and unsigned/anonymous calls. The transaction uses synthetic non-account subjects; it creates no Clerk accounts and commits no grant or business record. Postcheck confirmed zero academies/memberships/platform grants/audit events. This proves hosted SQL logic, **not actual JWT verification at the Data API, HTTP or browser authorization**.

The pre-apply review also corrected JSON field-type validation and aligned invitation operation-lock order. No assertions were weakened. The migration was rehearsed and applied with those fixes already included.

## Private key and provider boundary

`ONBOARDING_PROOF_KEY` is configured as a Secret for this existing project's Vercel **Production target, which is AcademyOS staging**. The matching value exists only in private `academy.m1_secrets` and a restricted local custody file. No value is in source, docs, PR text or application logs. No Preview or unrelated project credential was added, and no new platform grant was created. Owner vault custody confirmation remains a handoff task.

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
