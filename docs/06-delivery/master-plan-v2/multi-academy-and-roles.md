# Multi-academy and role experience

Follow [roles and permissions](../../01-product/roles-and-permissions.md), [identity/tenancy workflow](../../02-workflows/identity-and-tenancy.md), the accepted domain packets and current [staging policy](../../00-governance/staging-delivery-and-review-policy.md). Multi-academy is a product-wide property, not a selected academy ID in a sidebar. No new account grant or tenant-wide support access is authorized by this package.

## Identity and ownership

- Global authenticated subject identifies a person. Memberships grant specific academy roles/capabilities/branch scope and active intervals. Player/staff operating records may exist without a login.
- One account may have different legitimate contexts; dedicated synthetic Platform/Owner email profiles are test separation, not a general one-email/one-role restriction.
- Academy Owner and Platform Owner are separate authorities. Platform admission/catalog/diagnostics do not automatically expose child profiles, rosters, medical fields, Guardian contacts or tenant financial details.
- Preserve sole-owner protection, exact audited membership changes and historical actors. Cross-academy record transfer/ownership recovery needs its specific reviewed operation; it is not an ordinary edit.
- Commercial entitlement, current user authorization and implemented feature readiness are three different checks. A paid academy plan cannot grant a user a role.

## Academy-specific state

Each academy owns its branches, enabled sports/resources, people/relationships, program/session/enrollment, attendance, feedback, relevant operating financial records and communications/media. Settings include their declared language/timezone/currency/branding rules; do not infer them from the browser or another academy. A shared platform template must distinguish template provenance from tenant configuration.

Separate the three financial boundaries: platform invoices/payment to the platform; family fees/receipts allocated within an academy; Trainer earnings/payout. No universal balance, implicit cross-academy credit transfer or merged merchant credentials. Shared login contact identity does not imply permission to share operating records across tenants.

## Role/context UX

Header and navigation must clearly explain the active academy, role and relevant branch/filter. Present a chooser only for contexts the current person can use. Direct links and role landing pages resolve current authority. A permission refusal explains a safe next action without disclosing the existence of foreign records. The Platform workspace has distinct navigation from academy operations.

On a context change, guard dirty/unknown operations before leaving. Reset incompatible visible private state, cancel/ignore obsolete reads and select a permitted destination. Preserve safe per-context route/filter/period/identifier preferences, not a mixed profile payload. Returning to a context revalidates current rights and restores compatible navigation. No late response from A may overwrite B.

Guardian selection binds an actual active approved child link; multiple children/academies must retain their distinct relationship scope. Trainer selection binds current published assignment and active appointment. Future Manager/Player portals need their own projections and accepted capabilities, not renamed Owner screens or email matching.

## Server, storage and synchronization boundaries

Every request targets an academy/resource while the server derives the authenticated principal and verifies current membership/capability/branch/relationship/resource/entitlement state. Hidden controls, role props, client cache or local key possession cannot authorize writes. Preserve same-academy foreign-key/operation joins and minimal projection outputs.

Use environment+subject+academy+capability/branch-or-link+field-policy/schema scope for local repositories and compatible transient working sets. Every staged transfer, cursor, snapshot revision, index and command original retains that scope. A key release is not proof the data is current. Tombstones, withdrawals and role/link changes require appropriate invalidation.

An offline edit captured for A must stay bound to A after the user opens B, reconnects or signs in again. Dispatch requires the original account and current authorization for that operation; use the original operation ID and revision. No queue may retarget work to the active sidebar academy. Known denial/account change fences affected private data; missing authentication does not retire a slot as if ownership ended. Logout/30-day read cleanup preserves separately protected originals under the accepted recovery contract.

Do not download all tenants merely to make switching fast. Prepare finite permitted active datasets, prioritize the chosen task/academy and account for storage/network budgets. Deliberate future multi-academy preparation requires exact scope/capacity policy and completion evidence; no unbounded whole-platform preload. Shared device behavior remains distinct from accepted personal-device paths.

## Required acceptance scenarios

| Scenario | Expected evidence |
|---|---|
| Two academies with similarly named players/programs | Directory, detail, export, aggregates and local indexes retain exact tenant ownership |
| One user with different roles across academies | Correct permitted navigation/projection; no authority from the previous context |
| Platform Owner opens tenant record directly | Denied unless a separately accepted scoped capability exists; diagnostics remain redacted |
| Delayed A read completes after switching to B | No A content, stale selection, count or write context appears in B |
| Dirty form or unknown original during switch | Clear safe decision/guard; original retained and no replacement send |
| Offline A save, then B selected and reconnect | Original A outcome reconciled under A/current authority; no B mutation |
|401 versus403/known revocation | Authentication restoration protects work; actual denial keeps its field/slot fences |
| Logout/account change/reopen/cross-profile | Current container/key boundary and protected original recovery verified separately |
| Different currencies/timezones/sports per academy | Exact effective calculations/formatting/configuration; no browser/global defaults leak |
| Scope/branch/configuration changes during transfer | Revision-bound generation/count/completion rejected or safely replaced; no mixed-scope activation |

Local fixtures, actual signed DB/API checks, dedicated hosted sessions and installed-device containers provide different evidence. Retain existing two-academy receipts but do not claim all of these cases passed. Full administration, field policies, scaling, support access and cross-device revocation remain explicitly scoped work.
