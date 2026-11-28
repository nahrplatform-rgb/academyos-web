## Outcome and scope

Describe the concrete problem and resulting behavior. Name journey/action and requirement IDs, accepted policy, and unresolved decisions. For documentation-only work, state that boundary.

## Design and reuse

Existing components/contracts reused; affected UI/API/data/cache/jobs/providers; relevant loading, EN/AR and recovery behavior. Explain material dependency or architecture changes.

For experience/request work, link the EX batch and NR/G findings in docs/06-delivery/experience-execution.csv. State projection ownership, initial/resume request budgets, invalidation and any unaccepted private-cache/offline decisions. Update the tracker and affected plan/handoff links without closing broader occurrences from a scoped fix.

## Security and privacy

Link the journey security packet or explain why existing coverage suffices. State trust boundaries, permission/tenant/field checks, misuse cases, prevention/detection/containment/recovery, and findings. Use N/A with a reason for irrelevant checks; never include secrets or private customer data.

For currently authorized synthetic staging, record independent human/external security review as deferred by Owner, nonblocking and not performed under docs/00-governance/staging-delivery-and-review-policy.md. Preserve actual security checks/findings; do not require a reviewer signature or label this deferral an audit pass. State any actual access/configuration/destructive authority needed separately.

## Validation and evidence

For delegated work, follow docs/00-governance/ai-delegation-and-cost-policy.md. State configured coordinator/worker models and effort if known, active peak (normally zero/one, maximum two), scope/resource ownership, validation and repairs; distinguish measured usage/savings from unavailable or modeled values. Explain serial/script execution briefly when no helper was appropriate. No new benchmark or human-audit gate is created.

Record meaningful checks with actual results, build/environment and limitations. Separate local, hosted, provider and physical-device evidence. List failed, skipped or unavailable checks explicitly. Include applicable usability, speed, correctness, cost and recovery results.

## Release and recovery

Migrations/configuration/side effects, rollout scope and authority, rollback or forward repair, and residual risks. Mark owner acceptance separately from implemented/deployed/verified status. Update affected contracts, traceability and handoff.

This template is a review aid; completed boxes or passing CI alone do not prove full security or owner acceptance. Follow docs/00-governance/engineering-charter.md.
