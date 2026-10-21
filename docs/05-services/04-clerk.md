# Clerk identity configuration runbook

Selected identity provider. PostgreSQL remains the authority for academy roles and relationships. Status: setup not executed. Dependencies: approved domain/environment topology, D-002 signup and D-004 player-account policy.

## Applications and authentication policy

Proposed isolation: a nonproduction AcademyOS Clerk application for local/preview/staging, and a separate production AcademyOS application/instance. Record app ID, instance type, issuer/FAPI domain, allowed origins and key references for each. Do not share this issuer or secrets with future NAHR products merely because their hostnames share `nahr.dev`.

Configure approved sign-in methods, verified email requirements, session lifetime, MFA/step-up policy, passwordless/password choice, signup restrictions and account recovery. Begin with invited pilot access if D-002 accepts that proposal. Social OAuth is optional; enable only selected providers with correct app ownership and environment-specific redirect URIs. Do not enable every method by default.

Custom AcademyOS membership/roles stay in PostgreSQL. Clerk Organizations are optional identity-provider features, not an automatic substitute for the multi-academy business model. Do not put sensitive authoritative role grants into client-editable metadata.

## Production configuration

Set the primary application domain to the approved AcademyOS domain and copy actual DNS values from the production dashboard. Keep relevant Cloudflare CNAMEs DNS-only. Configure exact sign-in/up and post-auth application paths, logout returns, permitted origins and `authorizedParties`/equivalent request validation supported by the installed SDK. Reject unrelated NAHR sibling application origins.

Production setup requires its own live keys, OAuth credentials and webhook endpoints/secrets. Clerk documents that integrations, paths and SSO connections are not all copied from development. Recheck each setting explicitly. [Clerk production deployment](https://clerk.com/docs/guides/development/deployment/production)

## Supabase native third-party authentication

Use the **native Clerk–Supabase integration**, not the deprecated Supabase JWT-template/shared-secret approach. Activate Supabase compatibility in the Clerk instance, obtain its domain, then add Clerk under the intended Supabase project's third-party authentication providers. Configure staging and production independently. [Supabase Clerk integration](https://supabase.com/docs/guides/auth/third-party/clerk)

Use Clerk session tokens through the supported client access-token callback. RLS resolves the text `sub` claim to AcademyOS's internal identity; the authenticated role claim must match the integration's requirements. The integration authenticates requests but does not synchronize application profile tables. Bootstrap and signed user lifecycle webhooks perform that separate job. [Clerk integration guide](https://clerk.com/docs/guides/development/integrations/databases/supabase)

## Values and endpoints

| Name / setting | Visibility | Source and consumer |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public Config | Correct Clerk instance → browser/server SDK |
| `CLERK_SECRET_KEY` | Server Secret | Correct instance → approved server identity operations |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server Secret | Exact endpoint → signature verifier |
| `CLERK_ISSUER_URL` | Server Config | Exact instance issuer → verification/config assertions |
| `CLERK_AUTHORIZED_PARTIES` | Server Config | Explicit approved origins; parse as validated list |
| Sign-in/sign-up paths | Public routing configuration | Match real implemented routes and locale behavior |
| `/api/webhooks/clerk` | HTTPS endpoint | Subscribe only to required user lifecycle events |

Webhook verification uses the current official SDK and raw request body, with replay protection and unique event ID. Do not grant business roles from arbitrary webhook profile fields. Process create/update/delete idempotently and reconcile callback-before-webhook or webhook failures.

## Verification and recovery

Test first login, duplicate callback, email verification, invite acceptance, wrong account, expired session, logout, role switch, removed membership and deleted identity. Prove a token from nonproduction or another application cannot access production. With a real staging token, test allowed/denied Supabase reads and direct mutations using the actual native integration.

Rotate secrets through a staged deployment, verify new tokens and disable old credentials when safe. If webhooks fail, pause dependent profile cleanup and replay/reconcile recorded events. Do not delete the local provider subject until external account cleanup is acknowledged. Record actual dashboard settings and evidence without storing keys or authenticated cookies.
