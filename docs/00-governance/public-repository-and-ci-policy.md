# Public repository and hosted verification

Owner decision, 6 November 2026. The Owner explicitly accepted public copies/forks and authorized preparing and making `nahrplatform-rgb/academyos-web` public so ordinary automated testing can run on standard GitHub-hosted computers. This supersedes earlier investigation-only notes for this exact publication. It does not authorize an application production launch, paid runners/services, exposing credentials or operational records, a permissive software licence, history rewriting, or an agent-controlled staging promotion.

## Publication and later privacy

The existing repository, its branches and history are published in place. Making it private later does not retract public copies, forks, downloaded logs or earlier versions. Public source does not grant application login, tenant membership, database or backup access. Keep those authorities enforced independently. Provider identifiers, synthetic fixtures and public telemetry keys are not automatically administrator credentials; do not conceal an actual credential by relabelling it public configuration.

The Owner will decide when to return to private visibility. Do not automatically toggle visibility around individual test runs or promise confidentiality for earlier public versions. Private-repository compute accounting resumes afterward without resetting already consumed allowance. Recheck branch/environment/security-feature availability and backup continuity after that transition. No new open-source licence is granted by this decision; existing third-party licences continue to apply.

## Execution and cost boundary

Use standard GitHub-hosted Ubuntu runners for ordinary automated validation. Public standard-runner compute is free under the current [GitHub billing rules](https://docs.github.com/en/billing/concepts/product-billing/github-actions); concurrency, service limits, artifact/cache storage and other providers remain separate. This is not an unlimited-service or zero-total-cost promise. Actual signed-in provider, camera, installed-device and Owner acceptance checks remain separate from headless CI.

The prepared Foundation workflow runs on pull-request updates, pushes to `main`, and explicit manual dispatch. A code update on the existing open feature PR needs one full source-bound validation rather than duplicate feature-push and PR suites. Main's separate post-merge check validates its resulting source. Superseded Foundation runs cancel within the same PR/ref; backup jobs retain their independent non-cancelling concurrency. Documentation-only PR updates still run the full suite until a separately verified classifier exists; do not silently skip required assertions or call that optimization delivered.

Routine CI has no protected environment, private service credentials, or access to a personal browser/profile. It uses disposable fictional databases, browsers and keys. Keep the GitHub token read-only, checkout credentials unpersisted, actions revision-pinned and action sources restricted to the configured allowlist. All outside contributors require approval before their workflows run. Review the exact proposed code and dependency/workflow changes before approval; never execute outside code with backup or shared preview credentials. No `pull_request_target` checkout of untrusted code or privileged artifact handoff is introduced.

## Protected operating work

The `staging-backups` environment retains its main-only branch policy, confidential database/storage credentials and non-cancelling schedule. Public source and a green ordinary test are not authority to enter that environment. Main requires the `verify` status and a PR; zero mandatory human approvals accommodates the existing sole-Owner workflow. Administrators remain covered, force-push/deletion are disallowed and unresolved conversations must be resolved. These are actual provider settings only where the linked receipt records a successful read-back, not enforcement inferred from prose or CODEOWNERS.

The revised monitor accepts `BACKUP_MONITOR_URL` only from its protected setting and only for the existing HTTPS staging project/monitor. No fallback endpoint or URL value is logged. Missing configuration preserves the existing behavior: export still runs, monitoring failure remains visible and the final workflow fails. Historical client-key/check-in addresses remain obtainable from the published history; moving configuration does not revoke them. Sentry status can be spoofed/abused where a public ingestion capability permits it and is never cryptographic proof of a real backup. Verify trusted workflow identity, encrypted-copy receipt and restore evidence. No Sentry provider-key rotation or historical erasure is claimed.

Vercel fork protection and private build-source/log access are requested through its existing project settings. Preserve deployment protection, app authentication, server authority and Owner-only promotions. Treat a configuration API acknowledgement separately from a real outside-contributor exercise. Never approve an outside preview build with privileged shared environment values without a safe isolated execution scope.

## Exposure evidence and limitations

Read the [publication receipt](../07-handoff/public-repository-preparation-2026-11-06.md) before changing these controls. The history scan and privileged-log checks are bounded engineering evidence, not a complete penetration test or proof that every image/log lacks private content. Preserve synthetic-only fixtures, do not publish secret values, and report any new leak privately through GitHub's security reporting flow. Confirmed exposed credentials require scoped revocation/rotation, not merely deletion of the latest source line.

The security policy and source scans do not close the deferred independent review or any app-wide UX/offline finding. The single [execution tracker](../06-delivery/experience-execution.csv), generated continuation and per-journey evidence remain authoritative for implementation and release progress.
