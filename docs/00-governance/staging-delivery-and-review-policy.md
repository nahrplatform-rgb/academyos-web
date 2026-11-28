# Staging delivery, deferred review and role-first execution

Current Owner direction, recorded 4 November 2026. This policy reconciles the discussion following the Operations design handoff. The Owner explicitly requested updating the documents after discussing review deferral, dedicated test accounts and controlled role cleanup. It supersedes conflicting staging review-dependency text in earlier plans and handoffs. It changes no runtime, account, permission, provider setting, database record or deployment.

## Decision and authority ledger

| Decision | Owner direction | Recorded scope |
|---|---|---|
| SDR-01 — independent review | “i dont want the security review to stop anything” | Independent human/external security review is **deferred and nonblocking for all currently authorized synthetic staging work**, including otherwise-authorized private offline activation. Do not move the same reviewer prerequisite to another staging checkpoint. |
| SDR-02 — accepted design and working feedback | Continue the selected Operations system and demonstrate the connected working app | Do not re-ask approval of settled design choices. Retain the existing consolidated working-review/acceptance sequence. The Owner clarified that the review to remove as a blocker is independent security review; do not infer a waiver of all future business/design decisions or working acceptance. |
| SDR-03 — clean role accounts | Platform Owner and Academy Owner should have distinct emails/windows so their journeys are clear | The two named targets and the separation plan are in [the role plan](../06-delivery/staging-role-separation-plan.md). These are dedicated staging personas, not a new global one-role-per-email rule. |
| SDR-04 — cleanup | Owner agreed with controlled role cleanup that preserves history instead of a blanket account purge | Prefer existing verified logins, end unwanted active relationships through supported audited operations, preserve identity/history/pending work, and prevent an ownerless active academy. Exact account/grant/cleanup execution is not authorized by this documentation request. |
| SDR-05 — build order | Complete Platform Owner and Academy Owner journeys first, then extend shared patterns to other roles | Preserve already implemented work for every role. Two Owner personas lead the next working review; Trainer/Guardian follow with their own permissions and tasks. Finance/communications/media/Manager/Player future scope remains visible. |

## SDR-06 — standing synthetic-trial account and test authority

Later4November the Owner explicitly replied **“Authorize this staging offline activation”** and **“all accounts are trials, you can do everything without my approval, include this in your decisions.”** This supersedes repeated per-test account/grant/restore requests for the existing synthetic staging accounts and fixtures within the authorized AcademyOS work. Agents may perform necessary trial membership/role setup, temporary restoration, ending and bounded fixture/test operations under this standing authorization. Record the concrete before/after scope, audit, restoration/ending and results; preserve intended final Gmail Platform-only and iCloud Academy-Owner-only personas. Do not ask again for Casey's temporary Trainer setup/ending for the prepared offline test or equivalent covered synthetic tests.

This is operational authority for the existing synthetic staging environment, not a new business-role policy or email-based grant. Preserve historical actors, operating/audit/receipt records and original pending work; avoid unnecessary purge/recreation. Real academies/child/customer data, paid commitments and production release remain outside scope. **Owner-only deployment promotions remain unchanged**: the new statement concerns trial accounts/testing and does not explicitly revoke that separate promotion instruction. Genuinely new business rules still need their scoped decisions. Independent review remains deferred/nonblocking, not passed.

The concrete offline activation authorizes the reviewed four-source schema release, separately backed-up server-only wrapping root, staging-only flags and the existing one-register personal-device runtime. No password/passkey enrollment is added. Actual rollout and hosted working-day proof remain separately evidenced in the [activation packet](../07-handoff/owner-register-activation-2026-11-04.md).

## SDR-07 — authorized workspace expansion, 5 November

After the checked Players/Calendar build passed both CI runs, the Owner explicitly answered **“Authorize this workspace staging activation.”** This authorizes the exact x21 migration, separately prepared workspace wrapping root and three synthetic-staging settings in the [workspace activation packet](../07-handoff/owner-workspace-staging-activation-2026-11-05.md). The [live setup receipt](../07-handoff/evidence/ex13b-workspace-transfer/activation.json) records the actual application and verification; do not re-ask this authorization. It adds no account, role or new business/privacy decision. Existing register custody, originals and canonical operating rules remain protected. The Owner alone promotes; a configured database/key is separate from deployed source, signed-in runtime proof and working acceptance.

## Independent review is deferred, not passed

For current authorized synthetic staging development, no task waits merely for reviewer appointment, reviewer availability, an independent signature or a completed external audit. Do not repeatedly ask the Owner to find a reviewer or present that wait as the next implementation action. Keep a review-ready evidence packet and backlog for later consolidated independent review.

Use **Deferred by Owner for synthetic staging — not performed; nonblocking** as the independent-review status. This describes scheduling/acceptance of the deferral, not a security result. AI self-review, dependency scans, tests and a passing build remain their actual evidence layers; none becomes an independent audit. Existing historical review receipts remain unchanged and retain their original scope.

This changes the independent-person approval dependency, including the former EX-09/EX-11 independent-disposition prerequisite. It does not remove engineering work on real identity, key custody, scope binding, encrypted storage, cleanup, current authorization or original-operation recovery. Missing required keys, incompatible migrations or a demonstrated isolation/integrity defect are concrete engineering issues to resolve, not reasons to wait for an external reviewer. Continue other ready work while fixing the affected portion.

Do not label a review deferred to conceal an actual failed test or known vulnerability. Record the defect, affected scope, remediation and retest. Keep useful progress moving without declaring unverified behavior passed.

## Working design and usability review

Continue against the [Operations reference](../03-design/operations-design-reference.md), accepted business rules and current contracts. Perform design/interaction checks, equivalent-state visual comparisons and meaningful tests while editing. Maintain a difference ledger and the actual-component factual review. The full connected working app remains the review deliverable; a token pass or static replay does not complete it.

Do not re-ask the already accepted Operations choices or turn an independent-audit wait into a new design-review wait. Demonstrate ready work and collect feedback at the existing consolidated working checkpoint or when the Owner chooses to review. Record **Implemented/tested/deployed as evidenced; Owner working acceptance pending** where applicable. Prior explicit functional/design approvals remain intact. The security-review deferral is not Owner acceptance by silence, and does not turn a missing business rule into an engineering assumption. Genuinely new design/business decisions keep their scoped handling under the charter.

New fees, role powers, ownership-transfer rules, child/privacy/retention policy or other unresolved business decisions still need the appropriate explicit decision before their dependent behavior. Continue independent authorized work instead of stopping the entire project.

## Permissions and environment boundaries retained

- This direction covers the existing synthetic staging project and authorized work. No production launch, real academy/child/customer data, paid service commitment or broader environment is authorized.
- Account creation/deletion, role grants/restorations, owner transfers, invitations and destructive cleanup retain their explicit operational authorization requirements. The target account plan is not an executed or approved mutation list.
- Private offline activation no longer requires an independent reviewer. It still needs the applicable explicit staging activation authority, prepared configuration/schema/custody and concrete verification. The current closed endpoints/migration observations remain facts until actually changed and verified.
- The Owner alone performs deployment promotions. An agent may prepare/test/commit/push authorized work and verify the Owner-reported result; ordinary continuation does not authorize a promotion.
- Preserve meaningful tests and current server/data authority. No hidden UI control, client-supplied role, fixed email comparison or cached role grants permission.
- Logout/30-day read-copy cleanup, protected same-account pending recovery, no mandatory local passphrase/passkey and no inactivity lock remain the accepted device direction. Role cleanup cannot silently transfer pending operations between identities.

Future production/real-data release keeps its own explicit authority and release decisions. Do not infer a production review waiver or a new release approval from this staging deferral.

## Execution and evidence

The [single tracker](../06-delivery/experience-execution.csv) records the latest Owner sequence: EX12 dedicated-role checkpoint → EX11 real private register pilot with EX09 custody/configuration → EX13 persistent Players/month datasets → remaining EX07 Operations adoption. The [4November execution receipt](../07-handoff/role-first-offline-sequence-2026-11-04.md) records actual authorization, mutation and bounded proof. EX05/08 cost, device, hosted and request evidence continue alongside each affected batch. Earlier EX07-first routing is superseded.

For every checkpoint record source, design reference, implementation, local results, exact deployed source, hosted proof, Owner acceptance and deferred independent review separately. Do not erase earlier failures or reset delivered functionality. A missing human review is no longer a staging dependency; actual unfinished work and unmeasured evidence stay visible.

Read [the execution guide](../06-delivery/experience-execution.md), [engineering charter](engineering-charter.md), [journey security framework](../04-engineering/journey-security-review.md), [test strategy](../06-delivery/test-strategy-and-acceptance.md) and [current update receipt](../07-handoff/staging-role-and-review-update-2026-11-04.md). Regenerate the living continuation after every checkpoint. This policy belongs in repository documents; it is not a second runtime authorization system.
