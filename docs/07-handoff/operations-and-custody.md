# Staging operator guide and credential custody

Updated 22 October 2026. Accountable operator: Moamen Ghareeb. This guide covers the current private staging foundation. It is not a production service agreement or authority to reset credentials, change plans, grant academy roles or import customer data.

## 1. Where to start

- [Current setup index](setup-index.md), [configuration register](configuration-status.md) and [remaining gates](remaining-configuration.md).
- [Staging application](https://staging.academy.nahr.dev/en); Vercel login gate plus Clerk application login. A signed-in identity without a membership correctly receives no academy access.
- [Uptime monitor](https://academyos.sentry.io/monitors/2491612/?project=4512294699728976): process liveness only, every minute, three failed checks to open an issue, one success to recover.
- [Backup monitor](https://academyos.sentry.io/monitors/2492943/?project=4512294699728976): daily 02:17 UTC, 90-minute dispatch grace, 30-minute runtime, one failure/recovery threshold. GitHub can delay scheduled starts. Cairo local time changes with daylight saving; use the UTC schedule as authority.
- [Operator alert](https://academyos.sentry.io/monitors/alerts/1403422/): staging only, both monitors, explicitly Moamen's registered account. General high-priority errors also retain the original project alert.
- [Backup workflow](https://github.com/nahrplatform-rgb/academyos-web/actions/workflows/staging-backup.yml) and [recovery instructions](../../scripts/backups/README.md).

## 2. If a health or backup alert arrives

1. Open the named monitor and exact workflow/deployment; distinguish a failed export, monitor transport failure, failed synthetic protection check and a missed dispatch. A red workflow can occur after a valid independent backup was published: check its encrypted-copy receipt before deciding data was not copied.
2. Confirm source commit, staging target and provider status. Do not disable SSL, the Vercel gate, private buckets or signature checks to make an alert green.
3. For a missing/failed backup, check the latest successful workflow receipt and matching R2 ciphertext. If safe, manually run the normal backup on main with rehearsal/probe options false. A manual retry does not resolve an unexplained original failure; record the cause and recovery evidence.
4. If a receipt fails a hash, schema/inventory or trust check, stop using that copy and preserve the failure evidence. Do not force a partial-success label or execute restored SQL from an unauthenticated archive.
5. To restore, use a new private destination and the vault key, verify the trusted workflow receipt first, and follow the isolated recovery procedure. Keep email/jobs/payments disconnected from any broader restore until reconciled.
6. Record actual failure/recovery times and notify the responsible owner through an approved channel. This guide does not authorize customer broadcasts.

## 3. What is saved securely

The [names-only register](configuration-status.md) identifies each provider store. Application secrets are Vercel Production (AcademyOS staging); backup secrets are GitHub environment `staging-backups`, main only. They are not interchangeable.

The age private recovery key has an owner-confirmed vault copy and a restricted local copy at `/Users/moamenghareeb/.config/academyos-backup/recovery-key.txt`. Never put it in GitHub, Vercel, chat, screenshots, logs or a backup beside the ciphertext. Losing all copies makes existing backups unreadable. Changing the public recipient alone does not re-encrypt historical copies.

Provider logins/passkeys/MFA recovery belong in the owner's vault. This session did not establish a second accountable operator or verify recovery of every provider account; those remain owner/governance acceptance items before real academies. Never infer vault contents from a masked field.

## 4. Rotation and revocation order

1. Identify the exact resource, consumer and affected environment. Prepare the replacement before revoking a working credential. The owner performs new credential creation/secure entry when required.
2. Update the correct secret store; deploy/re-run the narrow consumer; verify actual use and then revoke the superseded key. Do not reset the database password just because a value is hidden.
3. QStash supports current/next signing keys: stage the pair and prove signature rotation before retiring the old key. Redis keys can invalidate rate-limit state; plan that effect.
4. A Vercel bypass rotation also affects QStash callbacks and the saved Sentry uptime header. Coordinate all consumers without making the app public.
5. Resend sending keys remain domain scoped; Sentry build tokens remain limited to source-map/release needs. Neither belongs in frontend variables.
6. Recheck backup DB/Storage/R2 access and perform a recovery rehearsal after changes to encryption, storage coverage or credentials. Retain the old age key while any backup encrypted to it remains retained.

## 5. Active retention and recovery limits

Only R2 prefix `staging/` is covered by the seven-day overwrite/deletion lock and owner-approved 30-day expiry. The lock can be removed by a bucket administrator; it is not an irreversible legal hold. Expiry is asynchronous. No production/customer retention policy is accepted by this staging choice.

Actual database restoration and a nonempty hosted file recovery/re-upload passed. The hosted file restore used a separate path in the same staging project. Recovery to an independent hosted Supabase project, complete provider configuration/identity recovery and commercial recovery objectives remain future launch acceptance.

Synthetic lock probes contain no personal data, remain protected for seven days and expire under the same approved 30-day lifecycle. Do not weaken the lock solely to tidy up these tiny test objects.

## 6. Plans, spending and ongoing review

No paid subscription was purchased or plan upgraded by the assistant. The owner personally activated the R2 usage-based subscription earlier; Cloudflare calls it **R2 Paid**, despite its included free allowance. The account's billable-usage dashboard showed **$0.00** and usage within included limits when reviewed on 22 October. This is an observed current value, not a future zero-cost guarantee.

Cloudflare already has an automatically created **$10 account-wide budget alert** to the account's existing billing recipient. It was inspected, not created/changed by the assistant. This is an email warning, **not a hard spending cap**. The R2 2 GiB export ceiling and 30-day retention bound technical behavior; they do not cap total account billing or operations.

Sentry was observed on an existing Business trial, with no billing details on file; no paid conversion was performed. Recheck its post-trial plan/quotas before expiry. The setup uses one uptime and one Cron monitor, avoiding additional monitors; free-plan availability is a provider policy, not an accepted paid purchase. No reminder/paid renewal automation was created.

Vercel remains Hobby; Supabase/Upstash's selected staging tiers are retained. Resend's sending key and recipient restrictions are unchanged. Provider commercial eligibility, team access, paid capacity and budget approval remain launch decisions. When a free quota is exhausted, investigate visibility/availability rather than silently upgrading.

Fresh production-dependency audit: zero known advisories on 22 October. Five high development-tool dependency entries trace to the existing braces advisory through ESLint/Next tooling; no patched braces version is available in the recorded range. Do not force an incompatible framework downgrade or call this a complete security audit. Track the [advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and review before release.

References: [Cloudflare budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Sentry Cron free-plan limit](https://www.sentry.help/en/articles/13963931-how-do-i-can-i-get-more-crons-on-a-developer-plan).

## Sentry free-tier request — 22 October 2026

Owner requested the free Developer tier. The live subscription still shows Business Trial, 13 days left, with no billing details/payment method on file. The documented cancellation route returns “Your plan is not eligible to be cancelled.” No plan change or payment was submitted. Immediate downgrade is provider-blocked; the requested target is free Developer, and the exact post-trial effective plan/monitor behavior must be verified rather than assumed. Support contact has not been authorized/sent. Existing monitoring remains active.
