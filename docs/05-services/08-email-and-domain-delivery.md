# Company email, development SMTP and transactional delivery

Three separate purposes: iCloud for human company correspondence; a controlled development sender/sink for testing; a production transactional provider for application messages. Clerk's identity email configuration is separate from AcademyOS operational email.

## iCloud company mail

The blueprint reports `admin@nahr.dev`, `support@nahr.dev` and `hello@nahr.dev` configured through iCloud custom-domain mail, with MX/SPF/DKIM/basic DMARC. Verify ownership, actual addresses, send/receive, recovery and domain records before changing anything. iCloud custom-domain mail requires iCloud+ and an Apple Account with two-factor authentication. [Apple custom-domain mail](https://support.apple.com/en-us/102540)

Keep company mailbox credentials out of application runtime. Define who monitors support and security reports, who has access, and how staff departures/recovery are handled. Do not turn a personal/shared mailbox into an untracked application delivery service.

## Development email

Preferred local default: capture email in a development sink and display its delivery record. Staging uses a strict recipient allowlist and obvious `[AcademyOS TEST]` subject prefix. Never send synthetic bills or invites to real guardians.

If using the selected temporary Gmail SMTP route, verify the dedicated account and app-password eligibility. Use `smtp.gmail.com` with either 587/STARTTLS or 465/implicit TLS consistently with the mail client; require certificate validation. Store complete sender account as `SMTP_USER` and the approved credential as `SMTP_PASSWORD`, server-only. Use the authenticated address as From unless a verified alias is explicitly configured. [Google SMTP guidance](https://support.google.com/a/answer/176600?hl=en)

Google app passwords require two-step verification and may be unavailable under certain account/security policies; account password changes revoke them. Do not weaken account protection to force this development option. Use an approved alternative/sink if unavailable. [Google app passwords](https://support.google.com/accounts/answer/185833)

## Proposed production sender: Resend

Create a NAHR-owned account/project and separate keys for nonproduction/production. Review the native Vercel integration's actual environment mapping or configure directly. Proposed sending domain: `notify.academy.nahr.dev`; proposed From: `AcademyOS <notifications@notify.academy.nahr.dev>`; Reply-To: monitored `support@nahr.dev`. Verify these choices and provider records before activation.

Add the exact domain in the provider, select an approved region, copy required DKIM/SPF/return-path records into Cloudflare at the specified hosts, then wait for verified status. Preserve root iCloud MX. Resend supports verified sending domains/subdomains and optional tracking; use a separate transactional subdomain and disable open/click tracking initially for sensitive operational messages. [Resend domains](https://resend.com/docs/dashboard/domains/introduction)

Set `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `RESEND_API_KEY` and endpoint-specific `EMAIL_WEBHOOK_SIGNING_SECRET`. The key needs only the selected sending/domain scope where supported. Record daily/monthly volume, per-recipient rate policy, provider limit behavior and bounce/complaint suppression. No application message is marked delivered just because the send API accepted it.

## Templates and callbacks

Version EN/AR templates for invitations, schedule changes, attendance exceptions, published evaluations, bills/receipts, subscription events and support. Test mobile layout, RTL, plain-text fallback, correct links, missing optional fields and long names. Keep confidential details behind authentication and avoid attaching private exports by default.

Subscribe only to necessary delivery, bounce and complaint events. Verify provider signatures, deduplicate events and update delivery attempts. Separate queued, accepted, delivered, bounced, suppressed and unknown states. A bounce removes/reviews that address for future sends under policy; it does not silently change the user's identity.

## Acceptance and recovery

Verify DNS authentication/alignment from an actual test message, reply routing, allowlist enforcement, invalid signature, duplicate send/event, provider timeout, suppression and Arabic rendering. Record provider message IDs without full private message bodies. Test a burst around a session cancellation and confirm recipient selection excludes unlinked guardians.

If delivery is degraded, preserve queued messages, suppress stale reminders and show partial status. Rotate credentials and redeploy when needed. DNS rollback restores prior records; do not overwrite iCloud mail while repairing transactional delivery.
