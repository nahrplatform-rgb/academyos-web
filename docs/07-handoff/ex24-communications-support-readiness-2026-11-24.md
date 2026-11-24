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
- Exact deployed SHA: `b220646e4b4e0420e97242ce0e645b2fced26be1` (branch `codex/onboarding-decision-design-packet`). [Foundation CI](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/45461666199) passed on attempt 1.
- Owner promoted; Vercel readback confirmed `staging.academy.nahr.dev` points to READY deployment `dpl_FwJmxe71CnMqdPA6H8e71zUppMmB` for that exact SHA. This is hosted staging on Vercel's Production target, not a separate live production rollout.
- After explicit Owner approval, the exact candidate's `20261124125237_ex24_communications_support.sql` was applied only to `academyos-staging`, recorded as hosted migration `20261124220810`. [Pre-change encrypted backup](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/45497685361) passed upload/download digest verification; no restore of this copy was run.
- Readback confirmed RLS and denied direct SELECT for `anon` and `authenticated` on all four new tables, seven RPCs executable by `authenticated` but not `anon`, and the gateway allowlist updated. Two academies, eight memberships and 326 audit events were unchanged; zero tickets at readback. Anonymous same-origin Support API request returned HTTP 401.
- TypeScript: passes. Next.js build: passes (`/api/support` and `/workspace/[academy]/support` registered).
- Gateway allowlist: all 7 `support_*_v1` names added to `reads`/`writes` in `onboarding-gateway.ts`; dependency coherence receipts regenerated (register-download, workspace-transfer, offline-register-dispatch, register-key, owner-working-day-next).
- Experience-review captures: regenerated; build/test/freshness green.
- Signed-in staging workflow: VERIFIED. Using Nahr browser profile (Academy Owner, signed in as the synthetic staging account). Academy 1 = "AcademyOS M1 Synthetic Academy" (b2c7920d-d467-4e9f-9a68-809ac627399e), Academy 2 = "AcademyOS M1 Isolation Academy B" (c8a4045a-a636-4bad-86f3-68f2036666f6). Both academies have owner role for this identity.
  - Create ticket "EX24 staging verification ticket" → ticket persisted in Academy 1.
  - Reload → ticket still in list (persisted). Click to open thread → initial message displayed.
  - Reply "Staging reply message." → reply appeared in thread (message order correct).
  - Resolve → status changed to "Resolved" (button changed to "Reopen").
  - Reopen → status changed to "Reopened".
  - Return to list → ticket still in list with "Reopened" status.
  - Language switch EN→AR→EN → returned to correct academy and Support view; Arabic renders RTL (confirmed dir=rtl).
  - Two-academy isolation: Academy 1 shows only its ticket; Academy 2 shows only its ticket ("EX24 isolation academy B ticket"). No cross-contamination.
  - Keyboard activation and focus return: heading focused after create; ticket button keyboard-accessible.
  - Workspace picker: page loaded as "Checking access and saved progress" but never resolved to show academy list. Direct URL entry to `/workspace/[academy]/support` worked correctly — normal authorization checks passed. Picker hang is a separate pre-existing issue (not EX-24 specific).
  - NOT exercised on staging: same-academy visibility with a second signed-in account (needs Dokkanni or another account), non-member refusal (needs an account without membership), lost-response recovery (would require inducing a network failure — unsafe on staging), mobile layout (not explicitly tested).
- Owner acceptance: not yet recorded.
- Independent security: deferred by Owner for authorized synthetic staging; nonblocking, not performed.
