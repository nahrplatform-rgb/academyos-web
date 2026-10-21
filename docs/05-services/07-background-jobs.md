# Background transport and scheduler configuration

Proposed provider: Upstash QStash. PostgreSQL job/outbox state remains authoritative. Do not add QStash, Vercel Workflow and another scheduler for the same responsibility without a new architecture decision.

## Setup

Create or select separate nonproduction/production QStash resources or credentials with verifiable isolation. Record region, plan, request/payload limits, retention, retry behavior and cost. Configure `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` as server secrets; obtain endpoint/base URL configuration from the selected region/account. A publisher token is not a receiving signature key.

Reserve stable HTTPS handlers for outbox dispatch, notifications, exports, billing generation and reconciliation. Payloads carry internal event/job IDs, version and minimal routing context. Never send full sensitive records merely because the transport supports a larger body.

For protected staging, document the supported machine bypass path/header and protect it as a secret. Keep the QStash signature check even when a hosting protection bypass is used. Do not put bypass or signing secrets in publicly visible query strings.

## Verification and delivery settings

Use the official Receiver verifier with current and next keys. Verify the raw request body, expected destination URL and temporal/signature claims. Re-serializing parsed JSON can invalidate verification. [QStash signature verification](https://upstash.com/docs/qstash/howto/signature)

Set bounded retry/backoff appropriate to each job and align it with the database attempt budget. Handle duplicate delivery as normal. Long jobs split into resumable chunks; return success only after a durable accepted/committed transition that can be recovered. A response from a handler is not evidence that a downstream email or payment completed.

Proposed schedules to refine through load tests: outbox dispatch every minute, expired-lease reconciliation every five minutes, payment reconciliation at an approved frequent interval, daily billing eligibility review and daily orphan cleanup. All schedules use explicit timezone/UTC handling and durable deduplication. Do not depend on cron firing exactly once or at an exact second.

## Operations

Create a job dashboard showing oldest queued age, attempts, failed/expired leases, provider message reference and last safe error. Add alerts on stuck jobs, final failure and missed scheduled reconciliation. Replay a job only with the original intent or create a new explicit intent; operators cannot edit an opaque payload and retain the old receipt.

Verify normal delivery, invalid signature, rotated key, expired signature, duplicate request, handler crash, callback blocked by hosting protection, timeout after commit and exhausted retries. Demonstrate recovery while the transport is temporarily unavailable: outbox records remain durable and dispatch resumes. Record region and provider evidence separately from local handler tests.

Rollback pauses publishing/schedules while retaining the outbox, fixes the handler, and resumes with deduplication. Never delete the queue simply to remove an alarming failed count.
