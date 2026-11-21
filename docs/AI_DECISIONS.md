# AcademyOS — AI Decisions Log

Significant technical/product-delivery decisions and rationale for future sessions. **Source of truth:** `docs/00-governance/decisions-and-open-questions.md`, ADR/decision records, delivery contracts, and handoff receipts. Do not treat this summary as authorization for new scope, promotions, or policy closure.

## Product & platform direction

- **13 November development/verification method:** live saved edits locally, focused meaningful checks, appropriate production-mode proof, one coherent candidate and targeted staging review; Owner-only promotion. Compact artifact-based results and bounded economical delegation reduce avoidable review work, without weakening acceptance or promising perfect results. [Operating contract](06-delivery/local-development-and-verification.md) · [Actual execution](07-handoff/local-first-workflow-2026-11-13.md). Repository records, not this summary or chat memory, own current status.
- **NAHR / AcademyOS split & domain:** AcademyOS is NAHR's first independent SaaS (`academy.nahr.dev` planned). Separate identity/infrastructure/billing from other NAHR products; tenant data/users not inherited across products. (ADR-001/002/049 context in governance docs)
- **Outcome focus:** make academy operations understandable, time-saving, delegable and controlled; separate complete Platform Owner business workspace. Simplify/replace unnecessary legacy machinery (notably finance) while preserving canonical useful scope and accepted controls. (Master plan v2 outcome/finance contracts)
- **Multi-tenancy & memberships:** one identity may hold memberships/roles across academies (product direction); PostgreSQL owns business membership/roles/permissions, Clerk owns identity/sessions. (ADR-003/004)

## Architecture & stack
- **Stack:** Next.js + React + TypeScript modular monolith on Vercel; Supabase PostgreSQL as business authority; Supabase private storage; Clerk auth integration; Upstash for rate limiting (selected initial) and related async components as configured. (ADR-005/008, `apps/web/package.json`)
- **Foundations:** EN/AR + RTL, accessibility, responsive web foundational. Web first; native later as approved. (ADR-006/009)
- **Boundaries:** server/data authority for permissions and critical writes; transactional/idempotent operations, auditability, original-operation recovery; no privileged-key-as-auth shortcut. (Engineering charter/architecture)
- **Local data/sync & offline:** evolved from proposals to LF-v2/LF-v3 direction — durable scoped local repository + sync coordinator, retained/prepared data, offline edits/reconnect targets with explicit policy gates (e.g. first Owner-register policy/design approvals), no inactivity lock / no 24h cutoff / 30-day-or-logout replica cleanup decisions as recorded; exact per-command/device/key/field rules remain gated. (Decisions/open questions, local-data/offline contracts, handoffs)
- **PWA/installable:** reuse existing protected data/sync/workers model; no competing root worker or second offline engine; installation ≠ offline coverage/whole-app completion; actual installed-device evidence required. (PWA delivery contract)

## Delivery, process & operations
- **Staging/review/promotion:** synthetic staging work allowed under recorded policies; independent external security review deferred/nonblocking in stated scope (not passed); **Owner-controlled promotions** only — agents prepare/verify but do not promote. (SDR decisions, AGENTS.md, handoffs)
- **Role/account separation:** dedicated Platform Owner vs Academy Owner personas/journeys targeted with controlled cleanup preserving history (direction/plan; execution states tracked separately). (Staging role plan)
- **AI delivery method:** Sol/Terra bounded delegation policy (scripts first, limited concurrent helpers, coordinator owns decisions/integration/evidence), without changing product/access authority. (AI delegation policy/decisions)
- **Public repo/CI:** standard hosted validation; preserve security/secret/publication controls per policy. (Governance)

## UX/design direction
- **Visual evolution:** Apple-inspired restraint early; later compact blue M1 direction accepted for its scope; **Operations reference + Charcoal spectrum** selected as current redesign direction (light default with Charcoal alternative in current Operations guidance) — superseding earlier palette defaults for new work while preserving historical approvals/receipts. (ADR-010, visual decisions, Operations reference)

## Key accepted/scoped implementation policies (examples)
- **M1 onboarding:** invite-led synthetic admission, fixed roles/explicit branch scope, 72h verified-recipient invitations, initial setup completion conditions; bounded acceptance as recorded. (M1 packet/decisions)
- **I2a player registration:** synthetic policy (duplicate review, explicit confirmation, optional unverified contact with no access/invite) for that slice.
- **I3a draft programs / scheduling slices:** draft-only constraints, preview/bounds, no premature visibility/effects (slice-scoped).
- **I5a development feedback:** scoped review/publish/amendment visibility rules as accepted for design/implementation slices.
- **Attendance redesign (design-scoped):** all-or-nothing register save behavior for selected marks under stated checks (implementation/acceptance tracked separately).
- **Owner register/offline slice:** approved private policy/scope and connected design elements recorded with separate activation/security/evidence gates.

## Open / dependent decisions (do not assume resolved)
- Launch geography/entity/currency/tax, acquisition model beyond pilot, detailed authority/delegation, minors/guardian/player access policies, billing/pricing/refunds/credits/compensation, payment providers/eligibility, broader offline per-command rules and device/key readiness, attendance/evaluation/communications/retention specifics, recovery targets, inventory scope, native priorities, support preview, budgets/team access — tracked in `docs/00-governance/decisions-and-open-questions.md` and related packets.

## Source references

Canonical decisions, contracts and checkpoint evidence remain in the repository paths linked above. Local conversation archives are not portable delivery evidence.

*Orientation drafted on 2026-11-12; publication review on 2026-11-16 removed an unverified local archive inventory. Confirm the current tracker and handoff before acting.*
