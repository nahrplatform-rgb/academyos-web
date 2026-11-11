# Notifications, privacy requests, reporting and exports

## Persistent local data and synchronization — LF-v2,2November2026

Local replica deletion/retention/key/index/backup and disconnected devices must join privacy workflows. A signed download URL does not grant indefinite local access. Exports/frozen reports remain scoped, explicit and coverage-aware; no private database backup disguised as cache. See [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md). Existing implemented and future boundaries are unchanged.

Requirements: AO-105–116. Retention and legal policy remain D-015; channels and quiet hours remain D-014. Country-specific legal review follows D-001/D-019 and is not replaced by this engineering plan.

## Notification intent and delivery

Business transactions create durable outbox intents for invitations, schedule changes, attendance exceptions, published evaluations, bills, receipts and support updates. Each intent names event type, academy, entity/version, audience rule and template version. Resolve recipients using current active relationships and permissions. A soft-unlinked guardian must not remain a recipient.

Create one logical notification per event/recipient/channel, with attempt records beneath it. States: queued, sending, provider accepted, delivered where confirmed, failed, suppressed and outcome unknown. A log-only push adapter is “disabled,” never “sent.” Provider acceptance is not proof of inbox delivery or user reading. Aggregate broadcast status reports delivered/accepted/failed/suppressed counts and partial success truthfully.

Templates are English/Arabic, concise and privacy-aware. Sensitive content stays behind authenticated links. User preferences, channel consent, quiet hours and legally necessary operational notices require explicit policy. Deduplicate repeated scheduler runs and respect per-recipient rate limits. Expired reminders should be suppressed rather than delivered after they are no longer useful.

## Reports and metric definitions

Every report declares audience, scope, timezone, date basis, filters, source records, currency behavior, freshness and calculation version. “Attendance rate,” “active players,” “revenue” and “outstanding” need explicit numerator/denominator definitions. Missing data is distinct from zero. Do not sum unlike currencies without an approved conversion methodology and recorded rate source.

Directory search runs against the full authorized dataset with indexed filters and stable sort. Pagination applies after filtering. Visible page size never limits the exported set unless the user explicitly chooses selected rows. Display the scope and expected count before an export begins.

## Export lifecycle

An authorized user submits filters, columns, format, locale and a stable operation ID. The server normalizes and freezes the intent, checks export capability and entitlements, and creates a job. Bind retries to the same payload hash; a modified filter requires a new request.

For consistent large exports, choose an as-of snapshot strategy appropriate to scale: a bounded database snapshot or a materialized authorized row-ID/version set. A timestamp filter alone does not guarantee consistency when existing rows are edited. Record strategy, row count, schema/calculation version and snapshot time in the artifact manifest.

The worker pages until completion using stable cursors, verifies expected coverage, writes a private artifact and marks the job ready only after object verification. States: queued → processing → ready → expired; exceptions: retrying, failed, cancelled or access revoked. An expired final-attempt lease must enter a recoverable terminal state, not remain “processing” forever.

Download rechecks current access and the artifact's audience. Use short-lived links; record download issuance without storing the bearer URL. Escape spreadsheet formula-leading text in CSV/XLSX exports and validate filename/content type. An expired artifact can be regenerated through a new authorized request. Failed artifact cleanup is visible in operations.

## Privacy request lifecycle

Requests include access/export, correction, guardian/consent change and deletion/anonymization. Verify requester identity and authority for each affected person. Record request type, academy scope, policy basis, due date determined by the selected jurisdiction, handler, decisions and completion evidence. Do not invent statutory deadlines before the operating-country decision.

Prepare a data inventory covering database records, private objects, identity provider, email/push providers, logs, analytics and backups. A privacy export must use actual current columns and include the appropriate relationships, not a stale report query. Limit disclosure of other people in shared records.

Deletion is a staged operation: approve scope and retention exceptions → capture external cleanup targets in a restricted job record → revoke access → erase/anonymize eligible active data → process provider/object cleanup → verify → close. Preserve the provider subject needed for cleanup until that step succeeds; erasing it first can leave an unrecoverable account. The job's idempotency key includes payload hash, and audit records identify the actual requested person and result.

Backups may retain encrypted historical data until their approved retention expires. Record that boundary, restrict access and require deletion replay if a backup is restored. Legal holds and financial retention exceptions are explicit restricted states, not silent indefinite retention.

## Acceptance

Exercise a broadcast containing a now-unlinked guardian, provider timeout, permanent bounce, disabled push and partial failure. Test export datasets larger than multiple pages, concurrent source edits, changed retry payload, wrong-role direct export route, revoked access before download and worker final-attempt expiry. Privacy tests cover current schema, repeated request, external deletion failure and restored data requiring deletion replay. Closure requires evidence per subsystem; a button click is not proof of deletion.
