# I2a hosted continuation — 25 October 2026

J06-A01; AO-013/016 and scoped actual-state/recovery requirements. Owner accepted working EN/AR wording/usability on 25 October. This continuation tests existing authorized synthetic staging, not new people authority. [Original implementation and acceptance](i2a-registration-implementation.md), [security review](../04-engineering/i2a-registration-security-review.md), [structured evidence](evidence/i2a-hosted-2026-10-25/hosted-checks.json).

## Observed hosted outcomes

Canonical staging still reported source `e84d51bb96b44964033bc493b65bcb8862f18752`, READY `dpl_G9dwFFNUejopeCMBnaAWTaWxWFq4`. Baseline read found **two** existing player registrations; the prior dated receipt had one. Existing player records were preserved. No inference about who created the second record is needed.

- **Two reviewed forms, one same-name commit:** both real forms reached confirmation for a new fictional name before either save. Both save controls were clicked in the same automation batch. One saved, the other returned “A matching record changed” with a new candidate and unchecked different-person confirmation. Database confirmed exactly one matching player, name revision, registration receipt and audit. This proves hosted conflicting intents; it does not claim exact overlap of database statements. [Saved](evidence/i2a-hosted-2026-10-25/race-saved.png), [review required](evidence/i2a-hosted-2026-10-25/race-review-required.png).
- **Request interrupted before send:** temporary per-tab offline emulation caused the actual form to show uncertain outcome. Connectivity was restored in `finally`. Checking the original operation returned an audited cancellation fence; zero players exist under that test name. [Uncertain](evidence/i2a-hosted-2026-10-25/interrupted-unknown.png), [reconciled](evidence/i2a-hosted-2026-10-25/interrupted-reconciled.png).
- **Commit followed by lost response:** intercepted only the save Fetch response at response stage after HTTP200, then failed that response with `ConnectionReset`. Raw interception was cleared using the supported empty pattern list. The form showed uncertain outcome; original-operation reconciliation returned the committed profile. Database confirmed one matching player, registration receipt and audit. No bearer/cookie/request headers were exported. The browser tool initially rejected an unspecific interception pattern and its generic disable method; the explicit non-Document Fetch pattern and supported clearing method were used. Nothing remains offline or intercepted.

Tests created two additional fictional records; final count was four players, with existing two memberships and two invitations unchanged. No new account, relationship, grant, invitation or outbound message was requested by these tests. Preserve the synthetic records and audit history; no cleanup deletion was performed.

## Defect found and bounded repair

The response-loss sequence exposed a truthful-state defect: the old notice “The original save did not commit and is now cancelled” survived from an earlier cancelled attempt into a later save whose response was uncertain, including its recovered profile. [Before-fix capture](evidence/i2a-hosted-2026-10-25/response-drop-stale-notice-before-fix.png). The persisted result and idempotency were correct; that UI message could mislead a user into replacing an already committed operation.

Repair: clear earlier operation notices at new candidate review, save, reconciliation and profile loading; retain any newly detected candidate-page conflict message after refreshing that page. Reuses the existing state and controls; changes no permission, operation identity, schema, data or delivery behavior.

Added a real-component regression: interrupted/cancelled attempt → edit into a new intent → review → another committed response loss → reconcile. It failed before repair (`1 !== 0`: old notice still present), then passed with unchanged assertions in production and development React modes. [Production receipt](evidence/i2a-hosted-2026-10-25/ui-notice-regression-production.json), [development receipt](evidence/i2a-hosted-2026-10-25/ui-notice-regression-development.json). Build/typecheck/lint and relevant existing unit/E2E checks are recorded with the repair rollout below. Physical-device and independent human review are not supplied by these checks.

## Remaining gates and next business decision

Still open: independent human security approval, reverse-account direct HTTP cases, I2a hosted membership suspension/reinstatement, full hosted latency/provider-meter workload, physical devices and screen readers. Prior local SQL coverage remains evidence, not a claim these hosted cases ran.

The [I2b guardian-access proposal](../06-delivery/i2b-guardian-access-decisions.md) is ready for owner policy decision. It would add an explicitly approved fictional guardian–player link and narrow name/branch projection; existing contact data does not authorize access. No policy acceptance, guardian invite or new grant is inferred from “proceed”.

## Repair rollout and post-repair evidence

Repair source **`623d415d3d58478909cd6422b2c82c1e0d269235`** reached READY as **`dpl_ZQuAi2sCpr1yNtRQKdPEaobGmzAr`** at canonical synthetic staging. Exact-source CI [40185570597](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40185570597) and [40185567326](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40185567326) passed. Locally: both React-mode regressions, build, typecheck, lint,33 unit tests and5 foundation E2E passed. No database/schema/provider/auth permission change was needed.

On this deployed source, repeated an interrupted-before-send operation and reconciled its cancellation, then edited into a new fictional intent. Both the pending candidate lookup and the final confirmation cleared the old cancellation notice; exact DOM matching found zero old notices. [New review after cancellation](evidence/i2a-hosted-2026-10-25/notice-repair-new-review.png). That new reviewed draft was not submitted; it created no player. Network emulation and request interception were cleared/restored.

Owner accepted the narrow [guardian policy](../06-delivery/i2b-guardian-access-decisions.md) for design preparation during this continuation. Its [connected design contract](../06-delivery/i2b-guardian-design-contract.md) and simulation remain separate from guardian implementation, actual invitations/grants and design approval.
