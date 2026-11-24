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
  - **Duplicate prevention**: NOT PROVEN. UUID primary key prevents duplicate rows, but no test was run to verify that a retry after a lost response creates exactly one ticket. The idempotency claim is structural (UUID PK), not tested.
  - **RLS**: tables have RLS enabled, direct access revoked from anon/authenticated. Only signed RPCs (security definer) provide access.
  - **Limitation**: Auth.uid() was simulated via SET request.jwt.claims in the database harness. This does NOT prove the real signed-in gateway path (Clerk to Supabase JWT to RPC). The RPCs accept p_academy_id and verify active membership in that academy. The API forwards academy_id from the workspace route. This is more secure than the first-active-membership pattern used by trainer-compensation and billing. Multi-academy verification with one identity in two academies was not performed in the isolated harness (only cross-academy isolation with two separate identities).
- Browser: not exercised (no signed-in staging for EX-24 yet). Component builds and route registers.
- Real API path: /api/support uses onboardingSession() for Clerk identity, then accepts academy_id from the request body (forwarded from the workspace route by support-workspace.tsx). Each RPC verifies active membership in the provided academy before any read or write. The academy in the URL IS validated against the user's membership. This differs from trainer-compensation and billing, which resolve academy from first active membership without URL validation. The support route follows the more secure academy-scoped pattern.
- Repeatable test: scripts/working-day/test_support_lifecycle.mjs — creates synthetic users, academy, membership; tests create → reply → resolve → reopen → cross-academy refusal → persisted state. Requires Supabase baseline (harness.sql + all migrations).
- Local dev server: configured (npm run dev → localhost:3000). Signed-in journey not exercised (Clerk auth required, not automatable in this harness). Component and route verified via build.

### Open items
- D-014 approval needed for external email sends.
- D-015 approval needed for retention/deletion policies.
- D-021 approval needed for impersonation (proposed: none initially).
- D-022 approval needed for provider budget.
- Attachments require storage (deferred).
- SMS/WhatsApp/push remain specific decisions.
- Quiet hours/emergency notices remain specific decisions.
- Disposable PostgreSQL test passed (isolated cluster, PG 17). Migration applied, lifecycle and cross-academy refusal verified. Auth path simulated, not proven.