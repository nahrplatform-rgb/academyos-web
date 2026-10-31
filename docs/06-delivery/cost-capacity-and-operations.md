# Cost, capacity and routine operations

This is a planning cost model, not a live billing statement. Selected staging billing observations are recorded separately in the configuration register; no fixed current-price quote is made here. Record current provider prices/limits at purchase and review after pilot load measurements. D-022 sets the actual budget; D-016 sets affordable recovery targets.

## Cost model

Monthly cost = fixed organization/seats/plans + database compute/disk/recovery + object storage/egress + hosting compute/build/bandwidth + identity usage/features + Redis commands + job deliveries/retries + email/messages + monitoring/log retention + backup copies + payment fees + applicable taxes. Distinguish customer charges from provider operating cost.

| Service | Main cost driver | Control / decision |
|---|---|---|
| GitHub | Plan/seats/security/Actions artifacts | Private repo protection eligibility, CI/artifact retention |
| Vercel | Commercial plan, seats, compute, bandwidth, builds | Budget alerts, measured region/runtime, controlled previews |
| Clerk | Active users and selected security/features | Required auth methods/MFA, separate environments |
| Supabase | Project count, compute, disk, egress, PITR | Real RPO cost, indexes, private object lifecycle |
| Upstash | Commands/storage and selected availability | Route-specific limits, measured command multiplication |
| QStash | Delivery volume/retries | Bounded retries, outbox dedupe, expired intent suppression |
| Transactional email | Sends, retention/features | Recipient eligibility, duplicate suppression, templates |
| Sentry/uptime | Events, traces, checks and retention | Sampling, scrubbed data, useful alert thresholds |
| Backup destination | Copies, retention, operations and transfer | Verified manifests, approved retirement, restore budget |
| Payments | Percentage/fixed fees, refunds/disputes/settlement | Actual merchant contract and reconciliation |
| Future native | Developer accounts, build minutes, signing/operations | Budget only when native phase begins |

## Workload worksheet

Fill expected pilot and six/twelve-month values: academies; branches/academy; active players/academy; guardian accounts/player; trainers; sessions/day; attendance marks/session; concurrent session starts; media uploads/day and mean/p95 size; reports/day and row count; messages/recipient/event; retention periods; backup copy lag; and support requests/week.

Calculate burst attendance demand from simultaneous sessions × roster size ÷ capture interval. Estimate media growth from uploads × bytes × retention plus derivative/backup copies. Estimate notifications from business events × eligible recipients × channels × retry factor. Model two environments and staging artifacts explicitly. A free allowance is not a capacity plan.

## Proposed controls

Set budget warnings at 50%, 80% and 100% of the approved monthly budget where supported. Define what happens at the cap: reduce optional analytics/video or pause expensive exports, while preserving critical data integrity and access recovery. Do not assume every provider's spend alert is a hard cap.

Review cost per active academy and per active player, but avoid collecting unnecessary personal analytics. Keep commercial pricing separate from internal provider usage. A manual override that creates an unlimited tenant must have an owner and expiry.

## Routine operations

Daily: inspect critical alerts, oldest jobs, payment reconciliation, delivery failures, backup/object-copy freshness and urgent support. Weekly: review permission/admin changes, dependency updates, storage/orphan trends, failed exports and spend. Monthly: review access, renewals, capacity, privacy requests, retained artifacts and SLO/error budget. Quarterly or after material recovery changes: restore drill, incident rehearsal and provider configuration comparison.

Every task has a named primary and backup operator; a checklist without ownership is not an operational system. Customer support needs response targets, a monitored mailbox, escalation and a safe way to collect redacted diagnostics.

## Exit/portability

Maintain versioned migrations, domain/API contracts, exportable business data, private object manifests and provider ID mappings. An exit plan identifies data export formats, auth migration constraints, secret rotation, DNS cutover and deletion confirmation. Do not assume passwords or provider-managed credentials can be exported. Rehearse portability for critical data before it becomes an emergency.

## Owner-facing control plane

The [Services & Operations vision](../03-design/platform-owner-services-and-operations.md) is the planned Platform Owner interface for this contract: actual versus estimated cost, shared-account allocation, multiple meters, versioned quota consequences, capability impact and freshness. Provider invoices remain authoritative; budget warnings are not spending caps. All current operational proof remains in the [configuration register](../07-handoff/configuration-status.md).

## Journey-level retrieval and cost measurement

The [experience/performance plan](../03-design/experience-performance-and-data-loading.md) and [screen/data matrix](../03-design/screen-data-loading-matrix.csv) connect task demand to query work, requests, bytes, cache commands, job/retry amplification and provider meters. Model pilot, expected scale and busy-day scenarios using declared inputs; include abandoned visits, synchronized session starts, tenant size skew and both staging/production overhead. Keep dated rate assumptions, actual charges, allocated costs and marginal task estimates separate. A lower request count or higher cache hit rate alone is not proof of lower cost.

## Measured inventory and scenario continuation — 31 October2026

[Whole-app service impact](../04-engineering/request-service-impact.md) separates confirmed Supabase Free/Vercel Hobby plans, aggregate provider observations, official dated allowances and modeled demand. Regional double sliding-window checks can consume8–10 Redis commands per successful single-RPC read; effective Redis plan/replication is still unknown. Do not use one HTTP evaluation as one billed command, multiply Clerk/Supabase third-party monthly users by refreshes, or charge normal navigation for daily R2 backups. The linked scenario is adjustable, not a forecast. [Build standard](request-hygiene-and-offline-standard.md) requires per-task budgets and privacy-safe measurements; no monitoring/service changes are enabled.
