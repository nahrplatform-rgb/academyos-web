# Identity, sessions, memberships and academy switching

## Installed-container entry and account scope — 6 November 2026

The [PWA delivery contract](../06-delivery/pwa-delivery-and-readiness.md#pw-02--launch-normal-sign-in-and-workspace-return) applies the existing identity/tenancy rules to OS launch. Do not assume a browser session or local key/store is shared with the installed context. Use normal email/password sign-in and verified workspace/role selection, safe locale/task return and the existing private-data cleanup/original recovery. No mandatory new passkey/local secret, idle lock or24hour cutoff. An install ID, shortcut, cached membership or deep link grants no authority; preserve dedicated synthetic personas without making one-role-per-email a product rule. Actual installed authentication/account-change cases are planned WD-73/74/80,not passed by existing browser proof.

## Persistent local data and synchronization — LF-v2,2November2026

Review device-local unlock/access separately from server membership. Known denial/scope changes purge or lock incompatible namespaces/indexes; disconnected clients cannot learn instant revocation. Invitations, role grants and account changes stay online. See [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md). Existing implemented and future boundaries are unchanged.

Requirements: AO-001–010. Depends on [permissions](../01-product/roles-and-permissions.md), [Clerk](../05-services/04-clerk.md) and [Supabase](../05-services/05-supabase.md). Initial signup model remains D-002; player accounts remain D-004.

## Records and states

`app_users` maps a Clerk text subject to an internal UUID and a lifecycle state. `academy_memberships` records academy, person, status and version. `membership_roles`, `branch_scopes` and optional `capability_delegations` express authority. `invitations` records intended academy, role, normalized destination, token hash, expiry, inviter and redemption state. The identity provider owns authentication; AcademyOS owns membership, business profile and permissions.

Account states: pending bootstrap → active → suspended → deletion pending → deleted/tombstoned. Membership states: invited → active → suspended or ended. Ending one membership does not delete the person's other academy relationships. Provider event IDs are stored for webhook deduplication; webhook receipt alone does not authorize business access.

## First sign-in

The person chooses language, signs in through Clerk, and returns to a permitted application origin. The server verifies the session, upserts the internal identity by the unique Clerk subject and finds active memberships. A repeated callback or webhook must return the same identity. A missing webhook must not produce an irreparable blank account: an authenticated bootstrap can repair the minimal mapping, while a reconciliation job reports mismatches.

If there is one active membership, route to its permitted home. With several, show an academy and role chooser with recognizable academy names. With none, show the actual next action: accept a valid invitation, request access or create an academy if self-service creation has been approved. Do not fall back to an owner dashboard or fabricate a default membership.

Account enumeration is limited: invitation and recovery screens use safe responses, rate limits and verified identity checks. The server never changes another account's email or credentials merely to make an invitation succeed.

## Invitation and role change

1. An authorized owner or delegated manager chooses academy, branch scope, role and destination.
2. Validate authority, entitlement, role constraints and existing relationships before invoking identity-provider mutations.
3. Create an invitation operation with a stable idempotency key. Queue delivery after the database commit.
4. The recipient authenticates and proves control of the destination; the server validates expiry, revocation, recipient and intended academy.
5. Atomically redeem the invitation and create or extend the intended membership without overwriting unrelated roles.
6. Return an authoritative membership receipt. A duplicate redemption by the same person returns the committed result; a different person is denied.

Expired, revoked, already accepted and wrong-account states have distinct recovery instructions without revealing private recipient details. Invitations can be resent through a new delivery attempt without creating another membership. A role downgrade increments the membership authorization version and invalidates relevant caches. An owner transfer must prevent an academy from losing its required accountable owner; exact owner-count and approval policy is D-003.

## Session interruption and account switching

An expired session prompts reauthentication while preserving a safe, scoped draft. A completed mutation with a lost HTTP response is resolved by operation lookup using its idempotency key; the client does not repeat an uncorrelated write. A forbidden response after revocation explains that access changed and offers the membership chooser.

Switching academy cancels in-flight UI reads, namespaces caches and local drafts, and rechecks the destination membership. The next request explicitly identifies the selected academy, but the server validates that selection. Multiple tabs must not silently change a draft's target academy. A draft displays its academy and stays bound to it.

Sign-out clears memory caches and the approved on-device data classes. If unsynced attendance exists, show its count and the documented discard/export/recovery policy before destructive local clearing. Never transfer that queue to the next signed-in user. D-011 must settle retention on shared devices before offline attendance is enabled.

## Support preview and exceptional access

Initial default is no impersonation. A later academy preview is a separate, visibly labeled read-only context with a support actor, target, reason, expiry and revocation. Do not reuse a hardcoded key, put identity-changing authority in a URL, or let a preview context reach writes. Every audit record distinguishes the human support actor from the viewed academy. D-021 must be resolved and tested before this feature exists.

## Acceptance and recovery

Test duplicate provider events, callback-before-webhook, deleted identity, suspended membership, wrong issuer, wrong academy, invitation races, email conflict, expired invitation, logout in another tab and two simultaneous roles. Inject a database failure after provider success and demonstrate reconciliation without creating a second account. A role-change audit identifies who changed what, the old and new scope, reason, operation ID and timestamp. No auth tokens, invitation secrets or recovery codes appear in logs.
