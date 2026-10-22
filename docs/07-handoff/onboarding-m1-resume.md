# Resume M1 after usage reset

Checkpoint: 22 October 2026. User requested a wrap-up with 2% usage remaining. Resume in the same chat when convenient; no automatic follow-up was scheduled.

## Saved work and evidence

- Canonical root: `/Users/moamenghareeb/AcademyOS`; repository `nahrplatform-rgb/academyos-web`.
- Branch `codex/onboarding-decision-design-packet`; implementation head `3e46cc8`.
- [Draft PR #1](https://github.com/nahrplatform-rgb/academyos-web/pull/1) is open and unmerged.
- Both foundation CI runs on `3e46cc8` passed: [39772384517](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39772384517), [39772388987](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39772388987). Vercel reports the protected branch preview READY. This is not an M1 staging rollout or authenticated journey verification.
- Local evidence: 13 disposable PostgreSQL test groups; 18 unit cases; four production-build browser checks; synthetic actual-React UI walkthrough and EN/AR phone reflow; build/typecheck/lint; documentation validation. The SQL runner remains outside CI.
- Moamen explicitly accepted bounded M1 policy and connected design. Working-journey acceptance remains pending. See [decision/design packet](../06-delivery/onboarding-m1-decision-design-packet.md) and [implementation evidence](onboarding-m1-implementation.md).

## Access restored and checked read-only at wrap-up

The user reconnected Supabase, Vercel, GitHub and Cloudflare. The Supabase and Vercel tools are now present and successfully accessed the exact AcademyOS resources:

- Supabase `academyos-staging`, project `snpphkenmvmhpjstbeul`, eu-west-1, PostgreSQL 17.11, ACTIVE_HEALTHY.
- Vercel `academyos-web`, project `prj_QDy8WrfhTAAp2lyu2wtKowd2nVyx`, account `team_W0PAL8RjzQFCfaVL3JYy6H4g`, team slug `academy-os2`, Node 24.x. SSO protection enabled for all deployments. Latest branch preview `dpl_HPtVdASqycoLcJGG9m4wGVEDHocS` was READY, target null.
- GitHub PR/check access verified. Cloudflare is reconnected but was not re-probed; no Cloudflare change is required merely to start M1 continuation.

These read-only successes supersede the earlier connector-access blocker in the implementation receipt. No database apply, new secret, privileged grant, invitation email or protected staging release was performed at this checkpoint.

## Continue in order

1. Read AGENTS.md, current charter/handoff, accepted M1 packet, implementation receipt and current source/PR diff. Preserve staging foundation. Refresh live migration state, advisors, grants, PR checks and deployment protection before acting.
2. Complete pre-apply backup/restored-baseline rehearsal and review the additive migration `supabase/migrations/20261022130955_controlled_onboarding_m1.sql`. New-schema synthetic dump/restore passed locally; that is not the actual hosted-baseline rehearsal. Keep unresolved security/performance cases visible.
3. Prepare/apply only the reviewed M1 staging migration and configure matching private `ONBOARDING_PROOF_KEY`/`academy.m1_secrets` value with secure custody. No service-role app client or public table grants. Record exact execution evidence without secrets.
4. Prepare Moamen's exact verified staging Clerk subject and the initial platform capability grant for **separate explicit owner authorization**. Policy/design approval did not authorize execution. The migration seeds no grant. The operator audit trigger requires `academy.operator_subject`, a reason and atomic audit; preserve grant history via revocation, not deletion.
5. Reconcile migration/app compatibility before merging or staging release. Deploy only to existing protected AcademyOS staging, preserving `APP_ENV=staging`. Keep preview and staging runtime evidence separate.
6. Obtain explicit authorization for actual privileged test-persona/owner grants and intended invitation recipient where needed. Keep existing approved-recipient Resend restriction. Do not invent a subject or onboard a real academy/customer/child.
7. Exercise real Clerk → HTTP → RPC → persisted result/audit → delivery → recipient acceptance → restricted academy workspace → resumable setup. Test two academies, wrong roles/branches, revoked authority, expired/reissued invitations, concurrency, interrupted commits/dispatch and recovery at required layers. Measure declared performance/bytes/cost; perform device/Arabic usability checks. Local synthetic adapters do not establish hosted authorization or provider behavior.
8. Record deployed, verified, independent security gate and owner working-journey acceptance separately. Production, real onboarding, purchases/upgrades and unrelated privileged grants remain outside scope.

Existing high-severity development-only `braces` advisory GHSA-vfj7-8cjw-p6xm remains open, with no patched version listed during inspection. Do not call green CI a full security review or silently weaken tests to remove it.
