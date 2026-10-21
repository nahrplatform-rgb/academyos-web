# Start here for builders

AcademyOS is a fresh NAHR product. This folder currently contains documentation and an archived design reference, not an implemented application. Read the [main index](../../README.md), [decision register](../00-governance/decisions-and-open-questions.md) and [pre-development gates](../06-delivery/pre-development-checklist.md) first.

## Authority and scope

Follow explicit user decisions first, then the selected AcademyOS blueprint and accepted decisions. PYSA descriptions/source/audit are read-only reference evidence. Do not copy its schema, navigation or security assumptions. The shared ChatGPT link remained unread; do not claim it supplied requirements beyond the material actually available.

Selected: Next.js/React/TypeScript, Vercel, Clerk identity, Supabase business data/private storage, Upstash initial rate limits, EN/AR/RTL, six roles, three separate financial domains, web first and later native. Selected design preferences: Workspace, Light, 18 px card corners. Proposed details and unresolved policies remain labeled in the decision register.

## Start with one complete foundation slice

After Gate A decisions and authorized setup, create the reproducible repository/environment foundation. Implement identity bootstrap, academy membership selection, two-tenant permission checks, Workspace shell and one audited idempotent operation. Verify real staging Clerk-to-Supabase integration before building many feature pages. Then follow the roadmap dependency order.

Do not fabricate account IDs, DNS targets, API keys, provider approvals, fee formulas, age thresholds, retention periods or financial thresholds. Obtain account-specific values during setup; resolve policy choices before their dependent module. Configuration templates are examples inside documents, not preinstalled application files.

## Definition of done for a slice

- Requirement IDs and approved business examples are named.
- UI has EN/AR, phone/desktop and truthful loading/error/unknown/partial states.
- Server/API/database/storage enforce equivalent authority and tenant scope.
- Transactions, idempotency and recovery cover interruption and concurrency.
- Audit and monitoring use safe correlation IDs and protect private fields.
- Meaningful tests pass at the required evidence layers.
- Documentation and status are updated with exact evidence and limitations.
- The appropriate role/product owner accepts the outcome.

No source implementation, local test, deployment or Git push alone establishes full acceptance. Keep pending physical-device, provider and hosted-policy checks explicit.

## Keep the pack current

Update the relevant workflow and requirement row with implementation changes. Add decisions rather than silently overriding selected behavior. Record provider settings in the registers without secrets. Archive evidence by commit/environment/date. Re-run documentation validation after link/ID changes and recheck official provider guidance before executing old setup instructions.
