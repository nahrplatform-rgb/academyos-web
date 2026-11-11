# Secrets, provider ownership and access configuration

Required before creating credentials. Proposed approach: a controlled password vault for human account/recovery material, plus Vercel runtime Secrets; Infisical is an optional central source when its operational value justifies it. Do not maintain several unsynchronized “sources of truth.”

## Ownership and access register

For GitHub, Cloudflare, Vercel, Clerk, Supabase, Upstash, mail, Sentry, payments and backup storage record legal/business owner, primary administrator, backup custodian, billing contact, MFA state, recovery reference and least-privilege roles. Use named accounts. A provider login tied only to one unrecoverable personal device is a launch risk.

Separate human credentials, deployment credentials, runtime keys, webhook secrets, database migration credentials and recovery keys. Each secret record includes name, environment, provider/resource ID, consumer, scope, creation/expiry, rotation owner, vault path and last verification. The documentation stores references only.

## Infisical option

If selected, create project `academyos` with distinct local/test/preview/staging/production environments and service-specific folders. Grant developers nonproduction access, release operators only needed production paths, and machines scoped access to their exact consumer/environment. Prefer supported short-lived identity integration; if bootstrap credentials are required, protect and rotate them.

Create a scoped Vercel connection and one explicit Secret Sync per approved source environment/folder and destination project/environment. Review overwrite/delete behavior before enabling; an empty folder must not unexpectedly remove required runtime settings. Test using a harmless canary value. [Infisical Vercel sync](https://infisical.com/docs/integrations/secret-syncs/vercel)

Do not map staging to every preview without examining trust: unreviewed branches must not receive shared privileged staging credentials. Never let a missing custom-environment mapping inherit production. A secret sync updates configuration; it does not prove the currently deployed app has reloaded it. Redeploy through the release process and verify the new deployment.

## Local and CI handling

The Owner-authorized public repository follows the [public CI/publication policy](../00-governance/public-repository-and-ci-policy.md). Public source does not expose GitHub environment-secret values by itself; outside PR code must never receive them. Restrict privileged backups to the trusted main environment, keep ordinary checks read-only and fixture-based, inspect logs/artifacts, and use private vulnerability reporting. The current monitor endpoint is configured with `BACKUP_MONITOR_URL`; historical public telemetry capabilities are retained exposure, not revoked credentials or evidence of genuine backups.

Prefer ephemeral injection into the intended process. If a local file is necessary, keep it ignored, access-restricted and nonproduction. Do not source untrusted `.env` text as shell code. Do not paste values into chat, README, screenshots, terminal command arguments or issue reports. Public-prefix variables must contain public configuration only.

CI should use no production secrets for ordinary PR checks. Production deployment/migration jobs receive only their required credentials after the enforced release gate. Inspect third-party action access and artifact contents. Redaction is defense in depth, not permission to log sensitive data.

## Rotation and offboarding

Rotation procedure: inventory consumers → issue new credential with least scope → update correct secret stores → deploy/restart consumers → verify positive and negative access → revoke old credential → check for failures → record receipt. Where providers support overlapping webhook signing keys, verify both only during the intended rotation window.

Offboarding removes provider memberships, repository access, vault access, active sessions and machine tokens the person controlled. Review emergency accounts and recovery custody. Rotate exposed/shared credentials, not every unrelated key without reason.

## Acceptance

Demonstrate a developer cannot retrieve production secrets, a preview cannot access production data, a revoked key fails, and recovery can be performed by the documented custodian. Run a secret scan that reports locations/types without printing suspected values. A false positive is documented with a narrow exception; broad secret-scan disabling is not acceptable.
