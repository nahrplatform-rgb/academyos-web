# Delivery roadmap and dependency-ordered backlog

The objective is a fully working, accepted web application against an agreed release scope, followed by the retained expansion/native vision. “100% working” means every in-scope workflow has accepted behavior, evidence and recovery; it cannot honestly mean a guarantee of zero future defects.

## Delivery approach

Build vertical slices that include screen, permission, database operation, audit, recovery and tests. Do not finish a large collection of disconnected screens and then add the business rules. Resolve the policy for the next slice before its implementation; unrelated unresolved future choices do not stop safe foundation work.

| Stage / work package | Deliverable | Dependencies | Exit evidence |
|---|---|---|---|
| 0. Documentation and setup decisions | This handbook, provider configuration records, prioritized open decisions | Owner review | Required pre-development decisions recorded |
| 1. Repository and environments | Reproducible app, CI, protected staging, secret boundaries | Stage 0A/B | Fresh developer/CI setup without production secrets |
| 2. Identity and tenant foundation | Clerk bootstrap, memberships, six roles, permission catalog, RLS | 1 | Two-tenant direct/API/browser isolation and revocation |
| 3. Design and localization foundation | Workspace shell, tokens, components, EN/AR/RTL, loading/error states | 1; roles from 2 | Keyboard/phone/RTL representative flow |
| 4. Academy and people | Branch/sport setup, players, guardians, staff, invitations, onboarding | 2/3; D-002/003/004 | Owner setup through guardian/trainer access |
| 5. Training operations | Programs, dated sessions, capacity, rosters, assignments, changes | 4; schedule policies | Concurrent enrollment, overnight conflict and history preservation |
| 6. Online attendance pilot | Capture, scan/manual parity, corrections, trainer Today | 5; D-012 | Real staging session completed by each permitted role |
| 7. Pilot family experience and basic progress | Guardian/player schedule, published evaluation basics | 4/6; D-013 | Correct linked-child visibility and publication |
| 8. Family finance | Approved fee policies, bills, receipts, allocations, reversals/refunds | 4/5; D-001/005/006/007 | Reconciled reference cases and failure/retry evidence |
| 9. Trainer compensation | Effective contracts, calculation, approval, statements/disbursements | 6; D-008/007 | Reference earnings and owner-only approval |
| 10. Platform commerce | Catalog, entitlements, invoices, manual proof, selected gateway | 2; D-009/010 | Test-mode settlement/reconciliation and restrictions |
| 11. Media, support, inventory, communications | Private objects, messages, movements, recipient-safe delivery | 4/5; privacy/channel policy | Object/record recovery and truthful delivery |
| 12. Reports and privacy | Complete search/export, definitions, retention/deletion workflows | Domain sources stable | Multi-page/snapshot export and deletion recovery |
| 13. Offline attendance | Durable queue, schema upgrades, reconnect and conflicts | 6; D-011 | Physical offline tests and no silent lost marks |
| 14. Commercial hardening | Load, security review, backup restore, observability, live configuration | 8–13 required scope | R1 release gates and owner acceptance |
| 15. Required expansion | Advanced channels, approved public media, deeper inventory/reporting | R1 stable; D-018 | Separate feature acceptance, no silent scope retirement |
| 16. Native platforms | iOS/Android priority journeys; optional desktop | Stable API; D-020 | Device/offline/store/signing evidence per platform |

## Sprint-level working pattern

For each two-week planning cycle, select a small number of end-to-end outcomes and list requirement IDs, open decisions, acceptance cases and demo accounts. First agree the business examples and API/data transitions; then build the narrowest complete path; then inject failures and test role boundaries; finally demonstrate with synthetic users. Update requirement status with evidence and preserve incomplete work explicitly.

Every story includes actor, active academy/role, starting state, input, permission, database transition, side effects, UI success/error/unknown/partial states, audit and recovery. A story without an acceptance case is not ready. “Create attendance page” is insufficient; “Assigned trainer records a mark once despite a lost response and sees its committed status” is a buildable outcome.

## Initial ready backlog

1. Establish versions, repository layout and blank environment contract; verify no production values enter PR builds.
2. Replay minimal identity/academy/membership migrations with two tenants and all role fixtures.
3. Implement native Clerk-to-Supabase staging integration and prove text-subject identity resolution.
4. Implement one permission-checked read and one idempotent mutation, with audit and operation lookup.
5. Build Workspace shell and role chooser in EN/AR with selected theme tokens.
6. Create academy + default branch + configured sport atomically and prove failure recovery.
7. Invite trainer and link guardian without mutating unauthorized identities.
8. Create one dated session, roster and assignment; prove concurrent capacity and trainer visibility.
9. Record attendance online, reconcile a lost response and approve a correction atomically.
10. Complete a real staging owner→trainer→guardian journey before expanding financial scope.

## Estimates and staffing assumptions

Planning estimate, not a commitment: with two experienced full-stack engineers plus part-time product/design and QA, allow roughly 4–6 weeks for foundation, 6–10 additional weeks for an operational pilot, 12–20 additional weeks for full commercial workflows/hardening, and a separately estimated native phase. Several modules can overlap after stable contracts; provider onboarding, unresolved policy or privacy review can extend the calendar. A solo developer should re-estimate based on actual first-slice throughput rather than dividing this plan mechanically.

Re-estimate after stages 2 and 6 using observed delivery and defect/recovery work. Do not trade away permission, financial integrity, backup or privacy gates to preserve an arbitrary date. Optional expansion is staged openly with owner agreement.

## Dependencies and change management

The critical path is identity/tenant authority → people/relationships → dated schedule → attendance → finance/evaluation/reporting → recovery and acceptance. Cross-cutting design, CI, observability and privacy start in foundation. Native work depends on stable API/versioning and offline contracts, not merely a finished website screenshot.

If scope changes, update the release map, requirement row, affected tests, provider needs and estimates together. A requirement is complete only when its declared evidence passes and the appropriate owner accepts it. “Source implemented,” “deployed,” and “accepted” remain separate milestones.
