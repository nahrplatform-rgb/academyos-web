# Current state and change control

Version 1.0 · 21 October 2026

## Current implementation update — 22 October 2026

The private staging app, hosted identity boundary, service adapters, private buckets and encrypted independent backups now exist. Current truth is consolidated in [the setup index](../07-handoff/setup-index.md), [actual configuration register](../07-handoff/configuration-status.md) and [remaining-work board](../07-handoff/remaining-configuration.md). These supersede the pre-implementation status table below. Original observations are retained for traceability; they are not commands to recreate resources.

Production and operational feature acceptance are still open. No actual academy is provisioned by signup. Refer to the current receipts before changing provider state.

## Historical planning baseline — what existed before implementation

The AcademyOS workspace was empty before this task. It now contains the documentation package and a preserved visual-reference fragment. The local UI concept uses invented academy, player and financial data. It provides no real authentication, database, payment, email or offline delivery capability.

The blueprint reports that `nahr.dev` was purchased through Cloudflare; account two-factor authentication, DNSSEC and auto-renewal were enabled; iCloud custom email was connected; `admin@nahr.dev`, `support@nahr.dev` and `hello@nahr.dev` were created; a dedicated Gmail account was established; and an AcademyOS GitHub repository was created. Treat these as **reported complete**. Exact repository identity, provider ownership, active protections and service settings were not inspected in this task.

| Capability | Evidence state | Next verification |
|---|---|---|
| Product blueprint | Local file inspected | Resolve listed decisions |
| UI direction | Concept created and explored | Complete screen and usability acceptance |
| GitHub repository | Reported existing | Verify exact owner/name, privacy and protections |
| Cloudflare domain/email | Reported configured | Inspect DNS and recovery without replacing records |
| Next.js application | Not created by this task | Begin only under an implementation request |
| Vercel, Clerk, Supabase, Upstash | Setup described, account state unverified | Follow the service inventory and staged setup runbooks |
| Schema, permissions and business functions | Specified, not implemented | Build and test the isolated foundation |
| Commercial provider integrations | Undecided or unverified | Resolve eligibility, sandbox proof and commercial terms |
| Production readiness | Not established | Complete release gates and owner acceptance |

## Change categories

Documentation corrections can be made locally and recorded in the changelog. Product decisions require a decision ID and explicit acceptance when they affect money, permissions, minors, retention or commercial commitments. Infrastructure execution requires a specific target and authorized change scope. A setup plan is not authority to create paid resources or change live DNS.

Do not copy old credentials, database contents, child records, financial evidence or service-role configuration into AcademyOS. Reuse learning and business meaning; establish independent environment ownership and integrations.

## Baseline and revision rules

Version 1.0 is the initial organized planning baseline. Future revisions should record changed documents, affected requirement IDs, the reason, decision status and acceptance impact. Do not rewrite a historical accepted financial calculation policy in place: create a new effective-dated policy version and preserve its predecessor.

Record a documentation freeze per delivery slice, not an irreversible freeze of the entire product. Engineers can improve technical choices within accepted boundaries, but must surface changes to role authority, business outcomes, data retention, provider cost or release scope.

## Definition of documentation completeness

Every required domain has a workflow, role boundary, data contract, failure/recovery behavior and acceptance case. Every service has a purpose, setup stage, configuration register, secret handling, verification and recovery path. Every unresolved policy has an owner, alternatives and an implementation deadline. All links and identifiers resolve. This is separate from configuration execution or application acceptance.
