# Private media, internal support and inventory

Requirements: AO-093–104. Notification delivery is defined further in [privacy and reporting](privacy-reporting-and-exports.md). Public sharing, consent and retention depend on D-004/D-015; inventory depth is D-017.

## Private media lifecycle

An authorized staff member selects academy/session/player scope and files. The server validates the intended audience, consent and limits, then creates a staged-upload record and random object key under the academy namespace. The browser uploads only to that constrained destination. Finalization checks actual object existence, size, media type and ownership; higher-risk attachments need the selected malware/quarantine process before download.

States: reserved → uploaded → verifying/quarantined → available → deletion pending → deleted, with explicit failed/expired states. A media row becomes visible only after verification. Batch uploads report each file independently; partial success does not remove successful files or mislabel failures. Retry uses the same upload intent, not a fresh uncontrolled object path.

Tags refer to players from the same academy and allowed audience. A foreign player tag cannot grant another academy's guardian access. Gallery queries apply authorization and filters before pagination so families do not receive incomplete pages or leak total counts. Download links are issued after a fresh access check and have a short approved lifetime.

Deletion removes availability first and queues object deletion with a durable receipt. Only report fully deleted when both application state and object outcome are confirmed, or clearly label cleanup pending. Failed deletions are retried and reconciled. Record minimal tombstones consistent with retention policy; do not retain private thumbnails in a public cache.

## Public media tokens, if approved later

A public token is an intentionally granted capability. Store its hash, exact scope, expiry, creator, consent basis and revocation. Do not expose predictable IDs, directory listings or unrelated images. A token page must avoid indexing and unnecessary third-party tracking. Revocation prevents new authorized responses; a previously downloaded file cannot be recalled. If immediate revocation is required, serve through a checked proxy instead of long-lived object URLs. Public sharing remains disabled until the policy and tests pass.

## Support cases and messages

An authenticated user opens a case with category, academy context, subject, description and permitted attachments. Case participants and visibility are explicit. A recipient can read or mark a message read where authorized; they cannot rewrite its author, academy, contents or attachments. Use dedicated read-state operations rather than broad message-update permission.

Message and attachment submission is one recoverable operation: stage files, verify them, commit the message and attachment references, then queue delivery. Partial upload failures display per-file status and offer safe retry/remove. Orphan files have expiry and cleanup receipts. Sensitive diagnostics are redacted and never include session cookies, API keys or real child records in a public issue.

Case states: open → assigned → waiting for customer/internal action → resolved → closed/reopened. Priority, owner and response targets are visible. An internal note is distinct from a customer-visible reply. A reply is not sent merely because a local message record exists; channel delivery states remain separate.

## Inventory baseline

Track item catalog, branch/location, quantity unit, serial number if applicable, stock movements, assignment/custody, return, damage/loss and physical-count adjustment. D-017 proposes basic quantity/custody before procurement, depreciation or valuation.

Inventory changes are movements, not arbitrary edits to a displayed total. Each movement records actor, source/destination, quantity, time, reason and operation ID. Compute stock consistently and prevent invalid negative stock under concurrency when the item policy disallows it. A transfer commits both locations together. Serialized assets can have one current custody assignment.

The screen distinguishes loading, query failure, empty catalog and zero stock. Never fall back to stale or empty arrays and show “saved” after an unsuccessful backend operation. A repeated issue/return uses the same key and returns the previous receipt.

## Acceptance

Test foreign media tags, consent changes during upload, partial batch failure, object missing at finalization, failed deletion, expired/revoked public token, support recipient forgery, orphan attachment cleanup, inventory read failure, concurrent last-item issue and repeated transfer. Verify full pagination and field restrictions in both UI and direct API tests.
