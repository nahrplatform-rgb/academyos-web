## Outcome and scope

Describe the concrete problem and resulting behavior. Name journey/action and requirement IDs, accepted policy, and unresolved decisions. For documentation-only work, state that boundary.

## Design and reuse

Existing components/contracts reused; affected UI/API/data/cache/jobs/providers; relevant loading, EN/AR and recovery behavior. Explain material dependency or architecture changes.

## Security and privacy

Link the journey security packet or explain why existing coverage suffices. State trust boundaries, permission/tenant/field checks, misuse cases, prevention/detection/containment/recovery, and findings. Use N/A with a reason for irrelevant checks; never include secrets or private customer data.

## Validation and evidence

Record meaningful checks with actual results, build/environment and limitations. Separate local, hosted, provider and physical-device evidence. List failed, skipped or unavailable checks explicitly. Include applicable usability, speed, correctness, cost and recovery results.

## Release and recovery

Migrations/configuration/side effects, rollout scope and authority, rollback or forward repair, and residual risks. Mark owner acceptance separately from implemented/deployed/verified status. Update affected contracts, traceability and handoff.

This template is a review aid; completed boxes or passing CI alone do not prove full security or owner acceptance. Follow docs/00-governance/engineering-charter.md.
