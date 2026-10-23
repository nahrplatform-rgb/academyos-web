# AcademyOS setup record — start here

Updated 22 October 2026. Owner: Moamen Ghareeb / NAHR. This index describes the actual **staging** system and the evidence available. It supersedes older planning/onboarding status statements; it does not turn unimplemented business features or production launch into completed work.

## Read in this order

1. [Steps completed, in execution order](setup-history.md): what was done, why, outcome, problems corrected and proof.
2. [Current resource and configuration register](configuration-status.md): actual service bindings, private/public boundaries, credential names and status.
3. [Remaining configuration, in execution order](remaining-configuration.md): next actions, dependencies, acceptance evidence and owner decisions.
4. [Detailed service receipts](service-setup.md): deployment, callback, monitoring, email and backup identifiers.
5. [Membership/security receipts](membership-connection.md): database migrations, caller scope and test limitations.
6. [Backup operation and recovery procedure](../../scripts/backups/README.md): coverage, encryption, schedule, credentials and exact recovery commands.
7. [Operator actions, custody and cost boundaries](operations-and-custody.md): failures, recovery, rotation and provider-plan limits.
8. [Product and policy decisions](../00-governance/decisions-and-open-questions.md): requirements that must be settled before dependent app features.

## Current outcome

The private EN/AR staging application is deployed. Authentication and the initial database boundary work. Redis, a signed QStash test callback, controlled Resend delivery, Sentry errors/source maps and encrypted independent backup/database restoration have runtime proof. Scheduled uptime checks, an explicit operator alert and a controlled backup failure/recovery notification now have proof. Database SSL is enforced. Actual nonempty file transport/recovery/re-upload passed within the staging service. The private R2 bucket has a seven-day lock and owner-approved 30-day expiry. The first daily scheduled backup also succeeded: [39712985982](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39712985982).

The application currently has one verified identity and no academy/membership records in the last restored snapshot. Signing up grants no academy authority. No operational module, tenant upload/download permission, live payment integration or production launch is accepted as complete.

## Evidence rules

- Source/configured means the code or setting exists; verified means the named check actually passed.
- A local synthetic test, hosted SQL test, actual provider delivery, browser result and owner acceptance are separate facts.
- A delivered email means the recipient server accepted it; it does not prove inbox placement/read status.
- Backup publication, database restoration and hosted file/service restoration are separate checks.
- Keep credentials and private payloads in the vault/provider secret stores. This record contains names and non-secret resource metadata only.
- Existing history is retained below current-status notices. Never execute an older pending checklist without checking this index first.

## Platform administration planning extension

[Platform Owner — Services & Operations](../03-design/platform-owner-services-and-operations.md) records the accepted owner-facing direction and proposed detailed design. This is planned application work, separate from completed provider configuration.

## M1 controlled onboarding continuation

See [M1 staging execution](onboarding-m1-staging.md) for the restore-tested backup, six applied migrations, private proof-key configuration, separately authorized platform grant and synthetic owner invitation, deployed setup journey, timezone selector and conflict-recovery results. Owner wording/usability acceptance, remaining independent security/performance checks and full milestone acceptance are recorded separately. No real academy admission or production launch follows from this receipt.


For scoped M1 measurements and the authorized owner-access revocation/restoration check, read [M1 verification results](onboarding-m1-verification.md). Full security/performance and owner milestone acceptance remain separate from these passing subcases.


[Authenticated HTTP boundary checks](onboarding-m1-http-boundary.md) record seven staged denial/recovery cases and four separately authorized lower-role read/save denials. Owner was restored after each role; eight audited transitions and unchanged setup were confirmed. These same-account role-state checks do not establish two-populated-tenant isolation or independent security approval.


[Write/revocation ordering](onboarding-m1-write-revocation.md) records deterministic local lock-order tests and revoked replay denial. [Two-account isolation preparation](onboarding-m1-two-account-isolation.md) records the separately authorized B admission/provider acceptance, restored email configuration/deployment, and pending distinct-account acceptance/isolation checks. Neither packet implies full security approval.


Current staging entry policy (23 October): [direct AcademyOS access](staging-direct-access.md), explicitly approved and applied as Vercel Standard Protection. The canonical staging domain reaches AcademyOS directly; preview/generated deployments remain Vercel-protected. Earlier all-URLs-protected receipts describe historical settings. Clerk and tenant/role checks remain enforced.


[Clerk verification-email repair](clerk-verification-delivery.md) records the owner-authorized self-delivery integration after iCloud rejected the development sender. Fresh email delivery and owner receipt were observed; the distinct B account subsequently accepted and completed setup, as recorded in the [two-account checks](onboarding-m1-two-account-isolation.md). Preview protection and direct staging access remain under ADR-016.

[Invitation account-entry follow-up](onboarding-m1-auth-entry.md) records explicit EN/AR Create account/Sign in guidance, return-to-invitation handling and delayed-identity UI checks. Local results, staging rollout and actual provider completion are separate.
