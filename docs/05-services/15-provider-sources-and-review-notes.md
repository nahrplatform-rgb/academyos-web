# Official provider sources and review notes

Public guidance reviewed 21 October 2026. These sources support provider-specific facts, not a claim that any AcademyOS account is configured. Recheck at execution because interfaces, versions, prices, limits and plan eligibility change. Product defaults, architecture, thresholds and workflow rules in the handbook are AcademyOS proposals unless selected in the decision register.

| Topic | Official source | Setup implication to recheck |
|---|---|---|
| GitHub rulesets | [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) | Private-repository plan eligibility and enforcement |
| GitHub Actions security | [Secure use](https://docs.github.com/en/actions/reference/security/secure-use) | Token scope, untrusted code and pinned actions |
| GitHub deployment environments | [Environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) | Required-reviewer availability and branch controls |
| Cloudflare DNS | [Proxy status](https://developers.cloudflare.com/dns/proxy-status/) | DNS-only is not HTTP proxy protection |
| Vercel commercial plan | [Hobby plan](https://vercel.com/docs/plans/hobby) | Commercial eligibility |
| Vercel environment model | [Environments](https://vercel.com/docs/deployments/environments) | First deployment, custom environment and plan behavior |
| Vercel variables | [Environment variables](https://vercel.com/docs/environment-variables) | Config/Secret, mapping and new-deployment behavior |
| Vercel DNS | [Add a domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) | Actual project-specific record values |
| Clerk production | [Production deployment](https://clerk.com/docs/guides/development/deployment/production) | Separate keys, DNS, paths, integrations and origin restrictions |
| Clerk/Supabase | [Clerk integration](https://clerk.com/docs/guides/development/integrations/databases/supabase) | Native integration, text subject and profile synchronization boundary |
| Supabase/Clerk | [Third-party Clerk authentication](https://supabase.com/docs/guides/auth/third-party/clerk) | Current supported integration, not deprecated JWT templates |
| Supabase policies | [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Policies, grants, views and function review |
| Supabase recovery | [Backups](https://supabase.com/docs/guides/platform/backups) | Object bytes excluded; actual recovery plan |
| Supabase changes | [Changelog](https://supabase.com/changelog) | Scoped tokens and current compatibility changes |
| Upstash Redis | [Getting started](https://upstash.com/docs/redis/overall/getstarted) | Resource region and connection credentials |
| Rate limiting | [SDK features](https://upstash.com/docs/redis/sdks/ratelimit-ts/features) | Timeout/cache semantics and explicit failure policy |
| QStash | [Signature verification](https://upstash.com/docs/qstash/howto/signature) | Raw body, destination and current/next signing keys |
| Company mail | [Apple custom-domain mail](https://support.apple.com/en-us/102540) | Existing company mailbox prerequisites |
| Development mail | [Google app passwords](https://support.google.com/accounts/answer/185833) | Eligibility and revocation behavior |
| SMTP | [Google SMTP](https://support.google.com/a/answer/176600?hl=en) | Correct host and TLS/port pairing |
| Transactional mail | [Resend domains](https://resend.com/docs/dashboard/domains/introduction) | Verified subdomain and optional tracking |
| Error monitoring | [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) | Current SDK setup, environment instrumentation and source maps |
| External checks | [Checkly browser checks](https://www.checklyhq.com/docs/detect/synthetic-monitoring/browser-checks/overview/) | Synthetic browser journeys |
| Secrets | [Infisical Vercel sync](https://infisical.com/docs/integrations/secret-syncs/vercel) | Explicit source/destination environment mappings |
| Payment eligibility | [Stripe availability](https://stripe.com/global) | Actual entity/country/product eligibility |
| Stripe callbacks | [Webhooks](https://docs.stripe.com/webhooks) | Signature/event/retry behavior |
| Paymob callbacks | [Transaction callbacks](https://developers.paymob.com/paymob-docs/developers/transaction-callbacks) | Chosen API generation and canonical verification |
| Kashier credentials | [API keys](https://developers.kashier.io/docs/get-started/api-keys) | Payment signing versus server secret roles |
| Kashier callbacks | [Webhooks](https://developers.kashier.io/docs/webhooks) | Mode and event-specific verification |
| Independent object backup | [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/) | Bucket-scoped credential design |
| Abuse control | [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | Server validation and token lifecycle |
| Native builds | [Expo EAS Build](https://docs.expo.dev/build/introduction/) | Platform/build profile preparation |
| Desktop packaging | [Tauri distribution](https://v2.tauri.app/distribute/) | Platform-specific signing and packaging |
| Web environment behavior | [Next.js variables](https://nextjs.org/docs/app/guides/environment-variables) | Public build-time values and test loading |
| Accessibility | [W3C WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) | Applicable design/test criteria |

## Review evidence limits

The review used public official pages and read-only Vercel CLI marketplace discovery (CLI 62.4.0). Some documentation pages returned unsupported Markdown through the browser retrieval tool; Supabase changelog and Sentry setup content were read through a normal verified-TLS HTTP client instead. No provider login, billing inspection, account mutation or credential retrieval was performed for this pack.

The shared ChatGPT link was unavailable in the prior review and remains unread. PYSA audit findings retain their original evidence limits in the mapping CSV. Neither public documentation nor marketplace availability proves the user's account has the required feature, region or approval.
