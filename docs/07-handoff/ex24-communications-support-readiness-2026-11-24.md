# EX-24 Communications and support with delivery recovery

24 November 2026 · MP-B09 · In-app only (external sends gated on D-014)

## Scope implemented (in-app, no external sends)

### Implemented (in-app, no external sends)
- **Support tickets**: create, reply, resolve, reopen. Owner and Trainer can create tickets within their academy. Messages are scoped to academy membership. No impersonation (D-021 proposed, no impersonation initially). API route: /api/support. Component: support-workspace.tsx.
- **Inbox/outbox**: SCHEMA ONLY. inbox_messages table exists with queued/delivered/failed status, but no RPCs, API actions, or UI for inbox/outbox/delivery status. Not a user workflow yet.
- **Recipient selection**: SCHEMA ONLY. No recipient selection UI or API. Academy membership is the implicit audience. No guardian recipients or quiet hours (D-014 open).
- **Delivery status**: SCHEMA ONLY. in-app delivery status enum exists but is not exercised by any user flow.

### Gated / not ready (recorded as open)
- **External email**: D-014 proposed (in-app + transactional email), not approved. Staging email config exists (stagingEmailConfig) but is setup-verification only. No academy invitations or notifications sent via email.
- **Attachments**: No file storage available in staging. Attachment references deferred.
- **SMS/WhatsApp/push**: Remain specific decisions (D-014). Not implemented.
- **Quiet hours / emergency notices**: D-014 open. Not implemented.
- **Retention/deletion**: D-015 open. Not implemented.
- **Impersonation**: D-021 proposes no impersonation initially. Not implemented.
- **Provider budget**: D-022 open. Not implemented.

### Implementation
- Migration: 20261124125237_ex24_communications_support.sql — tables: support_tickets, support_messages, inbox_messages. RLS enabled, direct access revoked. Signed gateway RPCs: support_create_ticket, support_reply, support_resolve, support_reopen, support_list_tickets, support_list_messages.
- API route: /api/support — POST with actions: create_ticket, reply, resolve, reopen, list_tickets, list_messages.
- Component: support-workspace.tsx — ticket list, create, reply, resolve, reopen.
- Page: /workspace/[academy]/support
- Navigation: added "Support" entry to owner navigation (Finance/Development group).

### Verification
- TypeScript: passes.
- Next.js build: passes (route registered as /api/support and /workspace/[academy]/support).
- Isolated PostgreSQL: verified. Used disposable cluster (PG 17, port 55443) with Supabase baseline (harness.sql + all migrations). Fixed migration: table references corrected from academy.academy_memberships to academy.memberships, column from user_id to identity_id. Auth.uid() simulated via request.jwt.claims.
  - **Ticket lifecycle**: create → reply → resolve → reopen verified. Final status "reopened". Messages persisted and returned in order.
  - **Cross-academy refusal**: second user (different academy) cannot list first user's tickets (empty), cannot reply (denied), cannot see messages (empty). Verified.
  - **Same-academy scope**: tickets are academy-scoped; any active member can see tickets in their academy. Cross-academy isolation confirmed.
  - **Duplicate prevention / idempotent recovery**: PROVEN. scripts/working-day/test_support_lifecycle.mjs — a committed create whose response was lost recovers the ORIGINAL ticket (same ticket id, no duplicate row) when the caller reuses the original operation id; a distinct operation id creates a second ticket (negative control proving the operation id, not payload text, is the retry key); a changed payload under the same operation id returns conflict without inserting.
  - **RLS**: tables have RLS enabled, direct access revoked from anon/authenticated. Only signed RPCs (security definer) provide access. Direct table reads/writes denied with SQLSTATE 42501; schema USAGE revoked; anon cannot execute support functions; authenticated can.
  - **Gateway path**: RPCs require a signed gateway proof (x-academyos-gateway) over HMAC of `gateway\nPOST:/rpc/<name>\n<subject>\n<issued>\n`; JWT claims alone are refused (42501 "Gateway required").
  - **Same-academy scope**: any active member of the selected academy can see and reply to that academy's tickets; cross-academy members and non-members are denied (42501); ended membership loses read/write; one identity with tickets in two academies keeps each selected academy isolated (PROVEN by test_support_connected.mjs).
  - **Browser / signed-in journey**: PROVEN at the fixture level. scripts/working-day/test_support_connected.mjs runs a real Playwright journey against the real Next route handlers, the real signed-gateway RPCs, and a disposable PostgreSQL 17 fixture: create → reload → reply → resolve → reopen → return, in EN and AR/RTL, with language-control return, two-academy switching isolation, transport-failure recovery (lost response reconciled via original operation, no duplicate), and provider-failure handling (recoverable error, no false success). A non-member (user_platform) is refused 403 and cannot persist. NOTE: this is fixture-authenticated (synthetic Clerk subject), not a real hosted Clerk session; it proves the API/data path, not real hosted sign-in.
  - Repeatable tests: scripts/working-day/test_support_lifecycle.mjs (18 DB authority/idempotency/conflict cases, disposable PG17 + all migrations) and scripts/working-day/test_support_connected.mjs (full connected EN/AR journey). Both pass.
  - TypeScript: passes. Next.js build: passes (/api/support and /workspace/[academy]/support registered).

### Open items
- D-014 approval needed for external email sends.
- D-015 approval needed for retention/deletion policies.
- D-021 approval needed for impersonation (proposed: none initially).
- D-022 approval needed for provider budget.
- Attachments require storage (deferred).
- SMS/WhatsApp/push remain specific decisions.
- Quiet hours/emergency notices remain specific decisions.
- Disposable PostgreSQL test passed (isolated cluster, PG 17). Migration applied, lifecycle and cross-academy refusal verified.

### Candidate & promotion readiness
- Exact candidate SHA: `672e9c3a65add0f97e6ec8c1c325717559eb08b5` (branch `codex/onboarding-decision-design-packet`).
- Foundation CI: PASSED — run 45453774108, attempt 1, all 59 steps green.
  - Link: https://github.com/nahrplatform-rgb/academyos-web/actions/runs/45453774108
- Migration `20261124125237_ex24_communications_support.sql`: committed with candidate; NOT yet applied to shared staging (Owner-only migration authority). No migration authority check performed; do not apply before Owner confirmation.
- Vercel preview: none found for this SHA (no GitHub deployment record; Vercel CLI only sees personal deployments 17–23 days old, unrelated to this repo). Preview verification could not be completed — report as a gap, not a pass.
- TypeScript: passes. Next.js build: passes (`/api/support` and `/workspace/[academy]/support` registered).
- Gateway allowlist: all 7 `support_*_v1` names added to `reads`/`writes` in `onboarding-gateway.ts`; dependency coherence receipts regenerated (register-download, workspace-transfer, offline-register-dispatch, register-key, owner-working-day-next).
- Experience-review captures: regenerated; build/test/freshness green.
- Signed-in staging workflow: NOT exercised (fixture-authenticated Playwright only, not real Clerk/hosted sign-in). Required per exit criteria; to be run after Owner promotion.
- Owner acceptance: not yet recorded.
- Independent security: deferred by Owner for authorized synthetic staging; nonblocking, not performed.