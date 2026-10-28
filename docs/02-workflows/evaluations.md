# Player evaluations and development history

Requirements: AO-085–092. Review authority, metrics, publication and age-appropriate visibility remain D-013/D-004.

## Model and authoring

An evaluation belongs to academy, player, sport, assessment period and schema version. The schema defines metric names in English/Arabic, scale, optional units, allowed values and explanatory guidance. Retire schema versions instead of changing the meaning of historical scores. A new sport cannot inherit an unrelated sport's metrics without an explicit template choice.

An assigned trainer creates a draft using permitted player scope. Validate current assignment, membership and entitlement on every write, including direct database/API routes. Separate private staff notes from publishable feedback fields and never place both in a broad guardian response.

Drafts have versions and visible save state. Autosave must provide an acknowledged record version; a conflict offers reload/compare/reapply instead of overwriting another trainer's work. A network timeout triggers operation reconciliation. Incomplete required metrics prevent submission with field-level errors.

## Review and publication

Proposed lifecycle: draft → submitted → changes requested or approved → published → superseded/withdrawn. A small academy may choose trainer-direct publication, but D-013 must explicitly approve that policy. Review and publish are separate capabilities even if initially assigned to the same owner.

Publishing creates an immutable visible snapshot with publisher, schema version, date and audience. Guardians see only currently linked children's published content; players see only the content allowed by account/minor policy. Drafts, private comments and rejected versions remain internal. Notification selection rechecks current relationships immediately before sending.

An amendment creates a successor version with reason and a link to the prior publication. Withdrawal records why and changes future access. Previously downloaded copies cannot be recalled; the UI and retention policy must account for that limitation. Do not silently overwrite a published score that families may have acted on.

## Progress view

Show a readable narrative of strengths, improvement focus and next steps before dense charts. Charts compare only compatible metric definitions and show assessment dates, scale and missing values. Missing assessment is not zero performance. A change of schema or sport breaks the comparison or requires a documented mapping.

On mobile, use concise cards and expandable detail. In Arabic, metric labels and explanatory copy are translated, while numerical direction and chart order are tested deliberately. Export includes academy/player scope, report period, schema version and publication state; it excludes private notes.

## Acceptance and recovery

Test revoked trainer access with a stale page, foreign player IDs, entitlement denial through alternate write paths, concurrent drafts, partial save failure, missing metrics, unpublished guardian access, changed guardian link and amendment history. Verify one publication generates one logical notification per eligible recipient, despite job retries. An export must agree with the published snapshot even if a draft is edited while it runs.

I5a scoped continuation29October2026: [accepted narrative policy](../06-delivery/i5a-development-feedback-decisions.md), [approved connected design](../06-delivery/i5a-development-feedback-design-contract.md) and [implementation checkpoint](../07-handoff/i5a-development-feedback-implementation.md). This adds reviewed session-bound narrative feedback only. Scored metrics/period assessments, Player access, notification/export and broader correction rationale remain pending. Existing Guardian links gain no automatic development fields; hosted verification and working acceptance are separate.
