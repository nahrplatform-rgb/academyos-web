# Dedicated staging accounts and clear Owner journeys

4 November 2026. Work item EX-12, supporting the current EX-07 Operations adoption. The Owner selected this direction after finding the combined Platform Owner/Academy Owner experience confusing, then explicitly asked to update all affected documents. Policy/sequence is recorded; account/permission/data changes remain **unexecuted and not authorized by this documentation-only task**.

Read [the staging delivery/review policy](../00-governance/staging-delivery-and-review-policy.md), [Operations reference](../03-design/operations-design-reference.md), [master plan](app-implementation-plan.md) and [tracker](experience-execution.csv).

## Target personas

| Sign-in email | Intended active staging role | Journey to demonstrate |
|---|---|---|
| `nahr.platform@gmail.com` | Platform Owner only | Platform landing/context → academy admission directory → exact academy/invitation details → owner appointment review → delivery/acceptance/setup status → return. Platform authority does not imply private tenant-content access. |
| `moamen_ghareeb@icloud.com` | Academy Owner only, for the explicitly selected synthetic academy | Academy Today → Calendar/program/session → planning/publication/attendance and return; Players/duplicate registration/appointments; corrections, QR and development review/history, within the existing implemented scope. |

These are dedicated test personas, not a new one-role-per-user product restriction. Identity and role assignment remain separate. A verified email identifies the account; the database's explicit current grant/membership determines authority. Do not put these emails into application authorization conditionals or automatically grant access based on mailbox matching.

Both mailboxes appear in historical staging test records. Their current provider identities, active grants, memberships and sessions have **not** been re-inspected for this planning update. Reuse verified existing logins where possible; do not promise recreation is necessary or current cleanup is already done.

Use two browser profiles, or two different browsers, with a distinct signed-in session in each. Ordinary windows in one profile can share authentication. A window title/profile colour is a testing aid, not authority. Do not extract or copy cookies/session tokens to create separation. Normal email/password sign-in remains sufficient under the accepted product direction.

## Controlled cleanup rather than blanket purge

Login accounts are represented by Clerk subjects and the private `academy.identities` mapping; academy memberships, platform grants, staff/Guardian relationships, operations and audit/history records are separate. Existing source evidence starts with [identity baseline](../../supabase/migrations/20261021165259_identity_baseline.sql), [controlled onboarding](../../supabase/migrations/20261022130955_controlled_onboarding_m1.sql) and the actual current role checks. A database identity-row deletion is not a complete login/session reset.

The prior [two-account isolation record](../07-handoff/onboarding-m1-two-account-isolation.md) preserves two distinct Owner contexts. The iCloud identity also participated in now-ended Trainer/Guardian tests, including [development feedback](../07-handoff/i5a-hosted-development-test.md). These records are evidence, not live authorization. Do not restore ended roles to populate a redesigned screen, or erase their history to make the account appear new.

Preferred preparation:

1. **Read-only preflight.** Verify each exact current subject through supported identity/account references; list active/ended platform and academy roles, owned academies, invitations and active sessions. Check for any protected pending operations before changing identity or scope. Keep credentials/tokens/private payloads out of logs and committed artifacts.
2. **Choose the intended academy and fixtures.** Prefer existing permitted fictional records when suitable. Specify whether the Academy Owner uses its existing synthetic academy or another explicitly authorized fixture. Moving ownership is not assumed. Do not invent a transfer mechanism or reset business policy from a UI request.
3. **Prepare an exact mutation list and restoration plan.** For each proposed change identify the subject, role/academy/link, current state, desired state, supported audited operation, effect on sessions/local stores, and verification. Identify what stays unchanged. Do not use a broad account delete or table truncation.
4. **Prevent an ownerless active academy.** If the Platform account is the only Owner of an old synthetic academy, do not simply end that membership. Record the concrete ownership/fixture disposition needed under accepted rules. Preserve its current access until an authorized supported transition is prepared. Do not fabricate an archive/transfer capability that the app lacks.
5. **Obtain only the required operational authorization.** The chosen emails and this plan settle direction; they do not authorize granting/restoring Academy Owner, deleting a login, sending invitations, transferring ownership or purging records. Present the concrete bounded changes when ready. This is separate from the deferred external security/design review, and does not stop independent UI implementation/testing.
6. **Execute only the authorized list.** Reuse verified login identities, end unwanted active relationships through audited operations where supported, preserve historical actor IDs/receipts/audit, and explicitly invalidate affected live context. Do not rewrite old corrections/reviewer identities or move pending saves to another account.
7. **Verify fresh sessions and recovery.** Open the separate browser profiles through normal sign-in, confirm exact role/academy navigation, denial of the other persona's powers, current authority on direct URLs/requests, and masking of late/stale responses after logout/scope change. Prove existing records/history remain intact.

A fresh synthetic dataset is optional and separately scoped. If requested, inventory exact fictional rows, establish a verified backup/restore or non-destructive replacement strategy, explain relationships/retained history, and obtain explicit cleanup authority before any deletion. The current direction rejects a blanket account/database purge as the default approach.

## Role-specific UX and build order

Complete the two existing Owner experiences first under one Operations system:

1. **Platform Owner:** clear Platform heading, platform-only navigation, admission/appointment/status task continuity and an appropriate landing page. Preserve only implemented capabilities; service dashboards and other unbuilt operations stay labelled future. A test account with no tenant membership should not be steered into an academy workspace.
2. **Academy Owner:** clear academy name and Academy Owner context, academy-only navigation, useful Today/Calendar/People and direct operational task return. The dedicated Academy account should not see a Platform workspace option.
3. **Connected role-boundary checks:** signing in, direct links, navigation/Back, refresh/revalidation, loading/failure/denial, dirty input and unknown-operation recovery across the two isolated profiles. Preserve the selected period/record and current authority; don't confuse role selection with sign-in state.
4. **Trainer and Guardian adoption:** extend shared patterns while preserving their own assigned-session/linked-player priorities and existing implemented functionality. Manager/Player operations remain future unless separately settled. Completing two Owner shells does not complete every later role journey.

Current shared seams to inspect: [workspace shell](../../apps/web/src/components/workspace-shell.tsx), [Owner navigation](../../apps/web/src/components/owner-navigation.ts), [workspace navigation](../../apps/web/src/components/workspace-navigation.ts) and the existing domain workspaces. Reuse working code and established read/operation contracts; do not rebuild the app or add a parallel role system. Consult the relevant PYSA workflow/source/audit reference before substantial journey changes, using the [existing comparison](../03-design/pysa-comparison-completed-journeys.md) and scheduling review for training. PYSA is reference only.

## Traceability, readiness and evidence

All cases below are planned, not executed by this documentation update:

| Case | Acceptance check | Evidence to record |
|---|---|---|
| RS-01 | Platform profile signs in through its normal account and shows only current Platform authority/navigation; academy-private direct access is denied without membership | Exact subject/account match checked privately; role/route/response outcomes without cookies, tokens or private payloads |
| RS-02 | Academy profile opens only its intended academy/Owner tasks and cannot use Platform admission | Real session, current membership, useful landing and direct-request denial; empty/unavailable remain distinct |
| RS-03 | Two isolated profiles remain independently signed in; refreshing/navigating one does not switch the other; old late responses cannot expose another account's context | Profile/browser identity, EN/AR, task state, denial/fencing and preserved input/return observations |
| RS-04 | The exact authorized cleanup preserves invitations, operating records, immutable actor/audit/receipt references and protected originals; no active academy loses its only Owner | Before/after scoped inventory and audit/relationship integrity; record any unresolved ownership disposition instead of mutating it |
| RS-05 | Platform admission/appointment/status and Academy Today→Calendar→session/register→Back plus Players use the same Operations design with distinct role priorities | Matching reference/runtime captures, actual control targets, context/focus retention and before/after request budgets |
| RS-06 | Removing an unwanted active role is reflected on the next authoritative request and old private state is masked, while permitted historical/recovery behavior follows its original account | Current role/tenant API/data checks, fresh-session outcomes and cleanup/recovery results; no new access silently restored |

EX-12 links J01 identity/context, J02 admission, J03 appointment/acceptance and J04 restricted academy setup; IMP-J01-A01/A02, IMP-J02-A01, IMP-J03-A01, IMP-J04-A01/A02/A03; SEC-J01–J04 and existing loading/action/requirement joins. The Academy operational continuation reuses EX-07's existing domain IDs. No canonical journey or accepted requirement is renumbered or closed by this plan.

| Layer | Status at this documentation checkpoint |
|---|---|
| Owner direction | Two named role targets, controlled cleanup/history preservation and Owner-first sequence agreed |
| Current inventory | Historical records inspected; live identities/roles/sessions/pending work not rechecked |
| Exact mutation packet | Not prepared/executed; requires read-only preflight and intended-academy disposition |
| Privileged/destructive authority | No new grant, restoration, transfer, invitation or purge authorized by this documentation task |
| UX implementation | Existing delivered Operations source retained; role separation/adoption and exact working parity remain partial |
| Independent review | Deferred by Owner for synthetic staging; nonblocking, not performed |
| Owner working feedback | Later consolidated review; no new working acceptance inferred |

Record the final authorized account changes, audit references, before/after active-role counts, both actual-session results, retained-history checks and limitations in a dated implementation receipt. Keep mailbox/role targets intentional, but exclude passwords, codes, bearer values, raw identity-provider responses and private child/customer data. Do not claim the role targets are active from a plan, commit or deployment.
