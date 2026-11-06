# Public repository preparation — 6 November 2026

## Outcome and authority

The Owner accepted public copies/forks and explicitly authorized preparing and making the existing `nahrplatform-rgb/academyos-web` repository public. The GitHub change succeeded; an unauthenticated GitHub API request independently read `visibility: public` and `private: false`. No new repository, history rewrite, account grant, paid capacity, operating-data mutation or staging promotion was performed. Existing application functionality, branches, records, originals and the six already modified handoff/review files were preserved.

Canonical instruction: [public repository/CI policy](../00-governance/public-repository-and-ci-policy.md). [Sanitized structured evidence](evidence/public-repository-preparation-2026-11-06.json) records actual settings and evidence limits. This is supporting delivery work for current EX-07; it does not reset the master/redesign sequence or close an app-wide finding.

## Actual provider controls

- Actions is enabled, restricted to GitHub-owned actions with no extra patterns, and requires full-revision pinning. Default token permission is read; it cannot approve PR reviews.
- All outside contributors require maintainer approval for workflow execution. Public PR tests have no private service environment or credentials. No self-hosted runner or personal browser/profile is added.
- Main requires strict `verify` checks from the GitHub Actions app and a PR, with administrators covered. Mandatory human approvals are zero for the current sole-Owner workflow. Force-push and branch deletion are blocked; conversation resolution is required. Read-back verified the settings after GitHub's transient repository lock cleared. An initial pause request combining disabled Actions and allowlist fields returned409; the corrected disabled-only request succeeded. A settings update attempted while disabled also returned409; read-back after re-enabling confirms the earlier allowlist was retained. No transient failure is recorded as success.
- Provider secret scanning, push protection and private vulnerability reporting are enabled. At the recorded read, there are zero open secret-scanning and Dependabot alerts. Generic non-provider secret patterns and automatic provider validity checks are not enabled; no complete vulnerability clearance is inferred.
- `staging-backups` still accepts only main and retains its confidential database/storage slots. The existing monitoring address was installed as `BACKUP_MONITOR_URL` without printing its value. There are no currently retained GitHub workflow artifacts. Backup scheduling, encryption, separate restore evidence and non-cancelling concurrency are preserved.
- Vercel acknowledged an existing-project update requesting `gitForkProtection: true` and `publicSource: false`; preview deployment protection remains enabled. The connector's normalized response omits these two fields, so this is a mutation acknowledgement, not an independently exercised outside-fork denial. No alias, promotion, app authentication or data authority was changed.

## Source preparation and checks

Foundation is prepared to run on PR updates, main pushes and manual dispatch, with a45-minute timeout and cancellation of superseded PR/ref runs. Feature pushes no longer duplicate the open PR's full run. Checkout does not persist its token. Main post-merge validation remains a separate resulting-source check. Every existing assertion is retained; documentation-only updates still run the full suite. No classifier or skipped-suite optimization is claimed.

The monitor now reads the protected environment setting and accepts only its existing HTTPS staging Sentry host/project/monitor with a correctly shaped client key. It rejects missing/malformed/userinfo/query/fragment/other-destination values without printing them. Payload, no-redirect behavior, verified-copy success gate and the backup export's existing recovery behavior are unchanged. All14 backup safety tests pass with pinned runtime dependencies. Checksum-verified actionlint1.7.12 validates all three workflows, exit0. The coordinator reviewed the bounded Terra worker's two-file diff; no helper touched providers, Git or other paths.

The revised monitoring consumer and workflow live on the existing feature branch. Main's older scheduled backup source remains intact and functional; installing the additional environment setting does not switch its source. No merge or runtime promotion is implied. Historical public check-in addresses remain in history, and provider rotation was not performed: those addresses are ingestion telemetry capabilities, never administrative authority or trustworthy backup receipts. Source publication therefore retains possible telemetry-noise/spoofing risk; use trusted workflow status, encrypted-copy verification and restore evidence. Moving a value into settings is not claimed to erase or revoke it.

## Publication exposure review

The non-shallow local repository had311 reachable commits. The official checksum-verified Gitleaks8.30.1 scan reported310 processed commits and179.56MB; its63 matches were reviewed as57 manifest/fingerprint SHA-256 values, five prose/status matches and one synthetic link UUID. No credential was confirmed among those matches. Default rules plus two decoding levels do not establish that all possible credentials or hidden remote refs were examined.

The workflow inventory contained636 records. All completed non-Foundation workflows and four recent successful Foundation runs were selected:55 available run archives, including backup/recovery/graph-update jobs; one contained no text. Downloaded text logs produced0 secret-scanner alerts. No destructive log/artifact deletion was used. Older Foundation logs, all PR comments, image pixels and compressed visual packs were not exhaustively inspected. The tracked tree includes fictional evidence, operating design/security documentation and Owner/test account metadata. Publication is not a promise to remove every provider identifier or Owner contact reference, and no real child/customer record disclosure is authorized.

Private scan reports and raw downloaded logs remain outside the repository; only this sanitized summary is committed. No secrets or raw backup payload are included in public evidence. The root SECURITY.md directs sensitive reports to GitHub's private reporting flow. No permissive licence was added.

## Delivery state and continuation

Prepared source has not yet received its new full remote check at this receipt's initial checkpoint. The earlier90af53d push/PR runs failed before execution and remain historical failures, not retrospectively passing tests. Exact-source public PR validation and automatic Preview readiness must be recorded after push; an available build is not staging or working-feature acceptance. Public compute does not reset the old used allowance; later private visibility resumes private accounting.

After the public CI check passes, follow EX-07: provide the exact checked build to the Owner when a staging promotion is needed, verify the released source separately, then exercise ordinary Clerk restoration on the retained B register without deleting keys, resetting marks or inventing pending work. The global one-register transition/fallback and projection-invalidation work remains next after that proof. No external independent review, real installed/camera test, full redesign acceptance or whole-app offline completion is claimed.

## Delegation

One explicitly configured gpt-6.1-terra medium worker owned only `scripts/backups/monitor.py` and `scripts/backups/test_operations.py`. Peak active helper count1, no nested agents, no duplicate full jobs. Three focused tests passed in the helper; coordinator then installed pinned isolated test dependencies and ran all14 backup tests successfully. Model savings are unmeasured. Architecture, provider authority, settings, integration, documentation and Git remain coordinator-owned.
