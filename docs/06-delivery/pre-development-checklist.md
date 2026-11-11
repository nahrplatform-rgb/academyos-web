# Pre-development checklist and progressive readiness gates

## Persistent local data and synchronization — LF-v2,2November2026

Before local-data work, read [local-data and sync plan](local-data-and-sync-plan.md) and the working-behaviour/acceptance/execution records. Define fields/device unlock/scope/retention and bootstrap/change/recovery contracts before storing private records; prepare a local-first changed-state review. Do not continue the superseded summary-only policy question or install a cache library as the complete solution.

All boxes start unchecked. Owner: Moamen / named NAHR technical lead to confirm. Documentation is prepared; account configuration and application verification have not been performed by this task.

## Gate A — ready to begin foundation implementation

- [ ] Confirm the exact existing GitHub repository, ownership, visibility and plan.
- [ ] Accept or revise the selected/proposed architecture and initial pilot scope, including what is deferred.
- [ ] Assign service owner, backup custodian, billing owner and budget cap (D-022).
- [ ] Decide launch entity/country and initial currency assumptions sufficiently to choose providers (D-001).
- [ ] Choose region/environment topology before persistent hosted data (D-019).
- [ ] Decide initial signup/invitation and role templates (D-002/D-003).
- [ ] Decide whether any player/minor accounts are in the first slice (D-004).
- [ ] Confirm design direction: Workspace, Light, 18 px cards; EN/AR/responsive foundation.
- [ ] Establish vault, MFA and account recovery custody before issuing credentials.
- [ ] Inspect existing Cloudflare/iCloud records and preserve their current working state.
- [ ] Review core service plans, including Vercel commercial eligibility and GitHub protection limitations.
- [ ] Define the synthetic test tenant/personas and forbid production data in development.
- [ ] Assign acceptance owner and evidence storage convention.

Gate A does not require finished payment, payroll, native or public-media policies if those modules are not yet being implemented. It does require that they remain tracked and are not silently invented.

## Gate B — accounts/configuration prepared

- [ ] Record GitHub, Vercel, Clerk, Supabase and Upstash account/resource IDs and scopes.
- [ ] Establish nonproduction resources and explicit production isolation.
- [ ] Populate non-secret environment/DNS/endpoint registers and secret vault references.
- [ ] Prepare repository rulesets and required checks appropriate to the plan.
- [ ] Configure Clerk sign-in methods and allowed origins for foundation testing.
- [ ] Prepare native Clerk–Supabase integration for the intended nonproduction issuer/project.
- [ ] Select the first job transport, email sink and monitoring configuration.
- [ ] Prepare exact staging DNS targets after provider-issued values exist.
- [ ] Establish spend alerts and prohibit accidental paid/production provisioning by tests.

## Gate C — foundation actually integrated

This gate requires code and cannot be truthfully completed before foundation development.

- [ ] Fresh installation/build succeeds with locked versions and documented nonproduction configuration.
- [ ] Database migrations and required seeds replay from empty state.
- [ ] All six roles and two academies pass initial direct/API authorization tests.
- [ ] Native Clerk staging token reaches only permitted Supabase records.
- [ ] Protected staging deployment, TLS, redirects and callback access are verified.
- [ ] CI checks and selected production gate are demonstrably enforced.
- [ ] One idempotent audited operation survives a lost response.
- [ ] Outbox/worker signature, retry and expired-lease recovery are verified.
- [ ] Error monitoring receives a redacted synthetic error with the correct release.
- [ ] EN/AR, role navigation and representative keyboard/phone flow pass.

## Gate D — before each sensitive module

| Module | Required decisions and evidence |
|---|---|
| Family billing | D-001/005/006/007; approved calculation examples and correction authority |
| Trainer compensation | D-008/007; effective-contract and rounding examples |
| Platform subscriptions | D-009; catalog/limits/trial/restricted-state policy |
| Payment gateway | D-010; merchant eligibility and money flow; sandbox credentials |
| Attendance/offline | D-011/012; capture windows, queue authority, conflict and device retention |
| Evaluations | D-013; schema, review and publish audience |
| External communication | D-014; recipients, channels, consent, quiet hours and budget |
| Real personal data/media | D-004/015/019; guardian authority, retention, region, private storage and recovery |
| Inventory | D-017; basic movements versus valuation/procurement |
| Support preview | D-021; disabled until selected policy and tests exist |

## Gate E — before real customers/commercial launch

- [ ] Agreed R1 scope has verified requirements and role-owner acceptance.
- [ ] No unresolved critical tenant/privacy/payment-integrity issue in enabled scope.
- [ ] Production provider configuration, key/origin/mode isolation and live merchant eligibility verified.
- [ ] Database and object restore rehearsal meets accepted D-016 targets, or targets are revised explicitly.
- [ ] Privacy/retention, public legal content and contractual responsibilities reviewed for actual jurisdictions.
- [ ] Monitoring, support ownership, incident response, spend controls and reconciliation schedules active.
- [ ] Release/rollback evidence identifies exact commit, migrations and deployment.
- [ ] Pilot data import, training, customer communication and support handover ready.
- [ ] Owner authorizes production release and records acceptance separately from deployment.

The next practical action after reviewing this pack is to fill Gate A decisions and account metadata, then establish the foundation slice. Do not interpret a written setup guide as proof that a provider is connected.
