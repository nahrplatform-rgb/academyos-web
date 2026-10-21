# Cloudflare, domains and DNS configuration

Selected root: `nahr.dev`; selected product host: `academy.nahr.dev`. Cloudflare registration, 2FA, DNSSEC and auto-renew were reported complete in the blueprint, not verified live here. Preserve existing iCloud company email records.

## Inspect before changes

Record Cloudflare account/zone IDs, registrar, nameservers, renewal owner, renewal date, payment method, MFA/recovery custody and DNSSEC state at both zone and registrar. Export a non-secret DNS inventory with TTL and proxy state. Identify existing web, MX, SPF, DKIM, DMARC and verification records before proposing edits.

Proposed hosts: production `academy.nahr.dev`; stable staging `staging.academy.nahr.dev`; application email subdomain `notify.academy.nahr.dev`; provider-generated Clerk hosts as issued by Clerk. These staging/email names are proposals and must be checked for conflicts before creation. Avoid wildcard application routing until tenant-domain requirements justify it.

## Web records

Add the intended hostname to the correct Vercel project/environment first. Copy the exact CNAME or other record Vercel issues for that project; do not paste a universal target from an old tutorial. Preserve Cloudflare nameservers and add only the necessary records. Ownership TXT records use the exact returned value. [Vercel domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

Initial proposed proxy mode is **DNS only** for AcademyOS and Clerk verification/application CNAMEs. This simplifies the selected Vercel/Clerk setup. Cloudflare does not apply HTTP proxy/WAF/cache protection to DNS-only traffic; application protection must come from the hosting/application controls. MX/TXT are not HTTP-proxied. [Cloudflare proxy status](https://developers.cloudflare.com/dns/proxy-status/)

If proxying is later selected, test TLS, cookies, Clerk origins, callback signatures, client IP handling, uploads, cache behavior and deployment protection. Use end-to-end validated TLS; never weaken to Flexible as a troubleshooting shortcut. Do not cache authenticated pages, API mutations, webhooks, private links or personalized responses. Document which provider owns each security/cache rule to avoid conflicting layers.

## Mail records

Keep root iCloud MX and its existing verification/DKIM records. A transactional sender uses its own approved subdomain and provider-issued records. Maintain a single SPF policy at each hostname; do not add a second competing SPF TXT record. Merge authorized senders only when actually needed and validate lookup limits. DMARC reporting and enforcement changes follow deliverability review, not an immediate switch that could block legitimate mail.

Never replace root MX with transactional-provider MX merely to enable sending on a subdomain. Where the provider requests a return-path MX, create it at the exact specified subdomain. See [email runbook](08-email-and-domain-delivery.md).

## Access and tokens

Human changes use named accounts with MFA. If automation needs DNS access, issue a zone-scoped token with only required permissions, store it in the vault, name its consumer and expiry, and avoid a global API key. Domain-transfer and registrar access remain restricted. Record approved change, previous values and rollback instructions.

## Verification

For each record inspect authoritative and recursive resolution, expected target, TTL and proxy state. Verify Vercel domain ownership/TLS, HTTPS redirect behavior, correct environment, Clerk sign-in and email send/receive. Check DNSSEC validity after any registrar/nameserver change. Validate external access from another network; a browser with cached DNS is insufficient.

Rollback restores the captured prior record, waits for its recorded TTL and checks service behavior. Do not delete working email records during web troubleshooting. Record remaining cache/propagation uncertainty. Turnstile, if selected, is configured separately and does not require claiming Cloudflare proxies the application.
