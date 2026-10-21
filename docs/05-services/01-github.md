# GitHub configuration runbook

Owner: NAHR technical owner, exact account/team to record. Status: repository reported to exist; URL, visibility, plan and controls not inspected. Stage: A/B before foundation; CI verification at C.

## Account and repository preparation

1. Confirm exact organization/owner and repository name from the existing account. Record URL and repository ID. Proposed repository visibility is private. Do not create a duplicate because the blueprint did not include the URL.
2. Require MFA for human owners, establish recovery custody and use individual collaborator accounts. Give routine contributors the minimum role; reserve administration for named maintainers.
3. Set default branch `main`. Proposed workflow: short feature branches and PRs into main; a stable `staging` branch only if the selected deployment strategy needs it. Avoid long-lived divergent environments.
4. Add README, contribution instructions, security-reporting contact, PR template, issue templates and CODEOWNERS during foundation. Use actual GitHub handles; do not invent an owner entry that silently matches nobody.
5. Set merge strategy, automatic branch deletion and required conversation resolution. Disable force pushes and branch deletion on protected branches except documented emergency access.

## Rulesets and plan dependencies

Create an active ruleset targeting main and any release branch. Require PRs, passing named checks and up-to-date integration as appropriate. Proposed checks: typecheck, lint, unit/domain, database authorization/migration replay, build and critical end-to-end. Add required review by another qualified person when staffing supports it. Record whether administrators can bypass and who is notified after an emergency bypass.

Private-repository rulesets require an eligible paid plan; Free rulesets apply to public repositories. Verify the actual plan and enforced result. A proposed setting is not protection until a prohibited test action is rejected. [GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

Do not promise private-repository deployment reviewers on Team without checking eligibility: GitHub documents required reviewers/wait timers on Free, Pro and Team for public repositories. Use a supported plan/control or an explicitly enforced external release process. A solo owner cannot provide independent review by approving their own action. [Deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

## Actions and secrets

Default workflow token permissions to read-only, expanding only per job. Pin third-party actions to reviewed full commit SHAs and automate review of updates. Do not run untrusted PR code with production secrets or checkout attacker-controlled code in a privileged `pull_request_target` job. Build/test untrusted contributions in isolated nonproduction contexts. [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use)

Create logical environments `test`, `staging`, `production` where supported. Production jobs select explicit allowed branches/tags, not an ambiguous protected-branches rule with no protected branches. Keep production deployment/migration credentials restricted to the release job. Prefer short-lived federated identity where provider support is verified; otherwise use the smallest scoped expiring token with rotation ownership.

Runtime application secrets belong in Vercel/selected vault, not duplicated in every Actions job. CI may need nonproduction test keys, source-map upload credentials and tightly controlled release tokens. Record each consumer and environment. Never echo secrets, include them in artifacts, pass them in process command arguments or upload `.env`/browser storage.

## Security and operational settings

Enable available dependency alerts, automated update PRs, secret scanning/push protection and code scanning, recording plan availability rather than claiming all are included. Group compatible low-risk dependency updates; framework/auth/database updates require integration tests. Define artifact retention and keep screenshots synthetic/redacted. Cache dependency downloads, never credentials or private exports.

## Verification and recovery

Verify an ordinary contributor cannot push directly to main, failing checks block merge, privileged jobs do not run on an untrusted PR, and a revoked token fails. Check the exact check names are required after their first run. Confirm Vercel automatic deployment behavior separately; GitHub checks alone do not guarantee production waits.

Record evidence with repository, rule ID, plan, workflow run, tested role and time. For a leaked credential, revoke/rotate at its provider first, investigate logs and then remediate repository history if needed. For a bad commit, revert through the normal reviewed path; application/database rollback follows the release runbook. Preserve evidence instead of force-pushing away the incident.
