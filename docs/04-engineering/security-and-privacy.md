# Security and privacy design

Requirements: AO-149–160. This is a threat-driven engineering plan, not a completed penetration test or legal compliance opinion. Country, age, retention and residency decisions remain open.

## Trust boundaries and threats

| Threat | Boundary / mitigation | Required evidence |
|---|---|---|
| Tenant ID substitution | Current membership + composite FKs + RLS + scoped storage | Two-tenant direct API/SQL/storage denials |
| Stale role or guardian relationship | Database authorization on use; short-lived caches with invalidation | Revoke while session remains open |
| Privileged server bypass | Isolated privileged adapters; constrained functions; actor/tenant verification | Forged context and direct function tests |
| Replayed financial command | Scoped idempotency key, payload hash, atomic ledger effect | Concurrent duplicate and lost-response tests |
| Forged webhook/job | Raw-body signature, issuer/destination/time checks, event dedupe | Invalid signature, altered body, replay |
| Uploaded malware/private leak | Private staging, verified ownership/type/size, quarantine policy | Malformed upload, foreign object, unauthorized download |
| XSS / unsafe content | Escaping, restricted rich text, CSP, no arbitrary HTML | Stored payload rendering and CSP validation |
| CSRF / cross-origin session misuse | Origin checks, CSRF protection, explicit allowed origins | External-origin mutation denied |
| Secret exposure | Environment separation, secret scan, redaction, no public-prefix secrets | Built assets/logs scan; rotation rehearsal |
| Export over-disclosure | Field/row policy and access recheck; private artifacts | Revoked user and multi-page export tests |
| Child data over-collection | Minimal fields, purpose-specific consent, retention controls | Data inventory and guardian authority review |
| Cross-account offline leakage | Identity/academy partition, retention/logout policy, reauth replay | Shared-device account switch tests |

## Identity and administrative access

Require MFA for provider owners and sensitive AcademyOS administrative roles under the approved policy. Use named accounts; keep recovery codes in a controlled vault with an accountable backup custodian. Avoid shared root credentials in CI. Record emergency access use and revoke it after the incident.

Clerk session validity does not establish academy permission. Verify the expected application issuer and allowed origins. Do not share AcademyOS production identity secrets with future NAHR products. Provider webhooks repair profile consistency; they cannot grant arbitrary owner authority from untrusted metadata.

Support preview remains disabled initially. If introduced, use explicit duration, reason, target, read-only enforcement, prominent banner and actor-preserving audit. No fixed shared impersonation key or unrestricted “login as user” endpoint.

## Data and application controls

Use least-privilege grants, RLS and transactionally enforced domain invariants. Protect storage with current relationships and private buckets. Signed URLs are bearer capabilities; redact them from logs and limit lifetime. If policy requires immediate revocation, route downloads through an authorization check rather than promising that every issued URL can be recalled.

Apply CSP after testing Clerk, required fonts/assets, upload and payment flows; start in report-only in staging and enforce after reviewing violations. Set appropriate content-type, referrer and framing policies. Keep auth/API/private response caching disabled or strictly user-scoped. Review service-worker caching explicitly so it never caches authenticated HTML or arbitrary API responses by accident.

Validate file content instead of trusting filename/MIME alone. Sanitize rich text through an approved allowlist. Neutralize spreadsheet formula injection on exports. Bound expensive searches, reports, uploads and batch sizes. Rate limiting complements authorization; it never supplies authority.

## Privacy inventory and retention matrix

Before real data, complete one row per data class: purpose, subject, controller/processor responsibilities to confirm, collection source, fields, recipients, storage regions, retention trigger/period, deletion method, legal hold, backup behavior and access roles. Include birth dates, safety notes, attendance, evaluations, photos, payment proofs, contact details, support attachments, device tokens, IP/security logs and provider event payloads.

Keep health/safety notes minimal and operationally necessary. Avoid analytics or replay on sensitive child/finance screens by default. Do not send names, emails, free-text messages, tokens or proof images to telemetry. Consent records name purpose and policy version and retain a revocation history where permitted.

## Security review and release evidence

Review dependencies, secret exposure, application authorization, database policies/grants, private storage, provider signatures, offline leakage and recovery. Automated dependency scanning is one layer; a zero-finding scan is not a full security review. Run a focused independent review before commercial launch if staffing/budget permits, and track findings with owner, severity, reproduction, fix and retest evidence.

Record accepted residual risks explicitly with owner and expiry. Do not mark a concern accepted merely because it was hard to reproduce locally. Keep production exploitability, source concerns and synthetic reproductions separate. An unresolved tenant-isolation, payment-integrity or child-privacy defect blocks the relevant launch scope.
