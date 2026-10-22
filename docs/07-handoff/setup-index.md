# AcademyOS setup record — start here

Updated 22 October 2026. Owner: Moamen Ghareeb / NAHR. This index describes the actual **staging** system and the evidence available. It supersedes older planning/onboarding status statements; it does not turn unimplemented business features or production launch into completed work.

## Read in this order

1. [Steps completed, in execution order](setup-history.md): what was done, why, outcome, problems corrected and proof.
2. [Current resource and configuration register](configuration-status.md): actual service bindings, private/public boundaries, credential names and status.
3. [Remaining configuration, in execution order](remaining-configuration.md): next actions, dependencies, acceptance evidence and owner decisions.
4. [Detailed service receipts](service-setup.md): deployment, callback, monitoring, email and backup identifiers.
5. [Membership/security receipts](membership-connection.md): database migrations, caller scope and test limitations.
6. [Backup operation and recovery procedure](../../scripts/backups/README.md): coverage, encryption, schedule, credentials and exact recovery commands.
7. [Product and policy decisions](../00-governance/decisions-and-open-questions.md): requirements that must be settled before dependent app features.

## Current outcome

The private EN/AR staging application is deployed. Authentication and the initial database boundary work. Redis, a signed QStash test callback, controlled Resend delivery, Sentry errors/source maps and encrypted independent backup/database restoration have runtime proof. The uptime monitor's manual test passed. The first daily scheduled backup also succeeded: [39712985982](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39712985982).

The application currently has one verified identity and no academy/membership records in the last restored snapshot. Signing up grants no academy authority. No operational module, tenant upload/download permission, live payment integration or production launch is accepted as complete.

## Evidence rules

- Source/configured means the code or setting exists; verified means the named check actually passed.
- A local synthetic test, hosted SQL test, actual provider delivery, browser result and owner acceptance are separate facts.
- A delivered email means the recipient server accepted it; it does not prove inbox placement/read status.
- Backup publication, database restoration and hosted file/service restoration are separate checks.
- Keep credentials and private payloads in the vault/provider secret stores. This record contains names and non-secret resource metadata only.
- Existing history is retained below current-status notices. Never execute an older pending checklist without checking this index first.
