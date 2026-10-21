# Safe configuration and evidence templates

These are copyable preparation templates. They are not active app configuration, executable workflows or verified provider values. Leave secrets blank until the correct nonproduction consumer is configured through its approved secret store.

## Example local environment skeleton

```dotenv
# Example only. Implement a validated environment schema before use.
APP_ENV=local
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_LOCALE=en
SUPPORTED_LOCALES=en,ar
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_ISSUER_URL=
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
CLERK_WEBHOOK_SIGNING_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=
DATABASE_MIGRATION_URL=
SUPABASE_PROJECT_REF=
STORAGE_MEDIA_BUCKET=academy-media
STORAGE_PROOF_BUCKET=payment-proofs
STORAGE_SUPPORT_BUCKET=support-attachments
STORAGE_EXPORT_BUCKET=exports
SIGNED_DOWNLOAD_TTL_SECONDS=120
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_NAMESPACE=academyos:local:v1
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
JOB_CALLBACK_BASE_URL=
JOB_PROTECTION_BYPASS_SECRET=
EMAIL_PROVIDER=sink
EMAIL_FROM=
EMAIL_REPLY_TO=
EMAIL_ALLOWED_RECIPIENTS=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS_MODE=starttls
SMTP_USER=
SMTP_PASSWORD=
RESEND_API_KEY=
EMAIL_WEBHOOK_SIGNING_SECRET=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_ENVIRONMENT=local
SENTRY_RELEASE=
PAYMENTS_PROVIDER=disabled
PAYMENTS_MODE=test
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Only include credentials needed by enabled adapters. Build/release-only tokens, production database access and backup credentials do not belong in this routine developer template. Never replace blanks with real values in a committed example. Local development can use sink/disabled adapters; required production adapters must fail safely when missing configuration.

## Service setup receipt

```text
Service / purpose:
Account owner and backup:
Environment / project / region:
Plan and approved budget:
Configuration decision IDs:
Public/config values recorded in register:
Secret names and vault references only:
Allowed origins / callbacks:
Access roles and MFA verification:
Positive verification:
Negative/isolation verification:
Failure/recovery verification:
Evidence location and date:
Known limitations:
Status: prepared / configured / verified / accepted
```

## DNS change receipt

```text
Change ID / owner / purpose:
Zone and hostname:
Type / previous value / previous TTL / previous proxy state:
Proposed value from actual provider:
New TTL / proxy state:
Dependencies and existing email records preserved:
Validation before and after:
Rollback value and condition:
Execution timestamp / evidence:
```

## Requirement evidence receipt

```text
Requirement / acceptance test ID:
Commit / migration fingerprint / deployment:
Environment and provider mode:
Actor / academy / fixture:
Preconditions and steps:
Expected result:
Actual persisted state and visible result:
Negative / retry / concurrency cases:
Evidence layers and artifact locations:
Result: pass / fail / blocked / not executed
Limitations and unresolved checks:
Reviewer / owner acceptance / date:
```

## PR description template

```text
Problem and resulting behavior:
Requirements and affected workflows:
Permission/data/provider changes:
Failure recovery and migration compatibility:
Validation with evidence and environment:
Known limitations or gated checks:
Release/rollback considerations:
```

## Policy example worksheet

```text
Decision ID / accountable owner:
Rule in plain language:
Effective date and applicable academy scope:
Example input:
Expected outcome / amount / state:
Rounding and boundary cases:
Cancellation / correction / retry behavior:
Who may approve an exception:
Acceptance owner and date:
```
