# API and integration contracts

This is a proposed contract catalog, not a deployed API or generated OpenAPI file. Foundation work produces the machine-readable specification and validates request/response schemas against it. Requirements: AO-149–160 plus each domain band.

## Common request and response rules

Use versioned public/native routes under `/api/v1`. Authenticated requests identify the target academy explicitly; the server derives identity and checks current membership. Cookie-authenticated mutations need same-origin/CSRF protection; bearer-token clients need issuer/audience checks and explicit CORS origin rules. CORS is not authorization. No mutation through GET.

Use JSON schema validation with unknown-field rejection for sensitive commands. Bound strings, arrays, dates, upload sizes and pagination. Accept `Idempotency-Key` for durable mutations and `expectedVersion` for edits. Scope the key to actor/academy/operation type and persist normalized payload hash. Keep correlation IDs independent of secrets.

Successful mutation example:

```json
{
  "operationId": "<uuid>",
  "status": "committed",
  "result": { "id": "<uuid>", "version": 4 },
  "requestId": "<safe-correlation-id>"
}
```

Failure example:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "messageKey": "session.changed",
    "retryable": false,
    "fieldErrors": {},
    "currentVersion": 5
  },
  "requestId": "<safe-correlation-id>"
}
```

Responses never include stack traces, SQL text, tokens or another tenant's existence. Use 400/422 for invalid input, 401 for absent/expired authentication, 403 for denied capability, safe 404 for inaccessible resources, 409 for conflicts, 429 with retry guidance, and 503 for temporary unavailable dependencies. A 202 response means accepted/pending, not committed. The operation-status endpoint resolves interrupted outcomes.

## Endpoint catalog

All academy routes below begin `/api/v1/academies/{academyId}` unless noted.

| Method and path | Capability / relationship | Transaction or result |
|---|---|---|
| `POST /api/v1/bootstrap` | Verified AcademyOS identity | Idempotent internal mapping; memberships |
| `GET /api/v1/memberships` | Self | Safe active choices and available roles |
| `POST /invitations` / `POST /api/v1/invitations/accept` | Invite authority / intended recipient | Invite or atomic redemption |
| `POST /memberships/{id}/role-changes` | Grant authority | Versioned role/scope change and audit |
| `GET /people` | Directory scope | Server-filtered cursor page and permitted fields |
| `POST /players` / `PATCH /players/{id}` | People manage | Validated profile and version |
| `POST /guardian-links` / `POST /guardian-links/{id}/end` | Link authority | Verified relationship lifecycle |
| `POST /staff/{id}/transfers` | Staff manage | Atomic effective assignment transfer |
| `POST /programs` / `POST /programs/{id}/schedule-changes` | Schedule manage | Preview/commit contract and affected sessions |
| `GET /sessions` | Scoped schedule read | Full dated assignment visibility |
| `POST /sessions/{id}/reschedule` | Schedule manage | Atomic transition, conflict check, outbox |
| `POST /sessions/{id}/roster-changes` | Roster manage | Capacity-safe enrollment and financial intent |
| `POST /sessions/{id}/attendance` | Assigned capture | Canonical record plus committed receipt |
| `POST /attendance/sync` | Current capture authority per item | Per-item result keyed by operation ID/hash |
| `POST /attendance/{id}/corrections` / `POST /corrections/{id}/approve` | Request / approve capability | Atomic corrected attendance and decision |
| `POST /family/bill-runs` | Finance prepare | Frozen generation intent/job |
| `POST /family/receipts` | Receipt record | Receipt, allocations and balance effects |
| `POST /family/refund-requests` | Refund request | Approval workflow, no implied refund |
| `POST /compensation/runs` / `POST /compensation/runs/{id}/approve` | Prepare / owner approve | Frozen calculation / approval |
| `POST /compensation/disbursements` | Payment record | Confirmed payment evidence and balance |
| `POST /evaluations` / `POST /evaluations/{id}/publish` | Assigned draft / publish | Versioned draft / immutable publication |
| `POST /uploads` / `POST /uploads/{id}/finalize` | Resource-specific upload | Constrained destination / verified object |
| `POST /media/{id}/download-link` | Current audience | Short-lived scoped link |
| `POST /support/cases` / `POST /support/cases/{id}/messages` | Participant/case scope | Message with verified attachment references |
| `POST /inventory/movements` | Inventory manage | Atomic stock/custody movement |
| `POST /exports` / `GET /exports/{id}` | Report-specific export | Frozen job / status and permitted artifact metadata |
| `POST /privacy/requests` | Verified subject authority | Privacy case with idempotent intent |
| `GET /operations/{id}` | Initiating actor or authorized reviewer | Committed/pending/failed outcome |
| `POST /api/v1/platform/invoices/{id}/claims` | Academy billing owner | Private proof claim |
| `POST /api/v1/platform/claims/{id}/approve` | Platform billing authority | Payment allocation and entitlement transition |

List endpoints return `items`, `nextCursor`, applied filters and safe count metadata where permitted. Cursor sorts include a unique tiebreaker. Clients cannot assume the first page is the whole dataset. Batch commands define maximum size, per-item keys and atomic versus partial semantics explicitly.

## Provider endpoints

Reserve separate endpoints for `/api/webhooks/clerk`, `/api/webhooks/payments/{provider}`, `/api/webhooks/email/{provider}` and `/api/jobs/{handler}`. Preserve raw bytes and use the provider's exact verification procedure with the endpoint's environment-specific secret before trusting event claims. Some providers sign raw bodies; others require documented canonical fields, so a generic HMAC implementation is insufficient. Validate expected event types, merchant/issuer, mode and replay constraints. Persist receipt and processing state separately so retries can resume unfinished work.

Provider events translate into internal typed events with schema version and original reference. Do not expose raw provider schemas throughout the app. External calls have timeouts, bounded retries, idempotency where supported and reconciliation for unknown results. The database is not held locked while waiting for a payment/email provider.

## Compatibility and acceptance

Publish generated types and an OpenAPI artifact from the same schemas used in handlers. Contract tests cover every status, field filtering and operation key mismatch. Native clients negotiate supported capabilities and version; additive changes are preferred. A breaking change needs a migration window and tests with the oldest supported client/queue payload. Keep webhook fixtures synthetic and secrets absent from fixtures.
