# Setup history — chronological execution record

Dates/times below use Africa/Cairo where a Git commit supplies a timestamp. Provider receipts retain their own UTC timestamps. This consolidates the available workspace, conversation and recorded provider evidence; it does not invent proofs for unread screenshots or hidden account settings.

## 1. Establish the project location and planning baseline

The canonical root is `/Users/moamenghareeb/AcademyOS`. The planning pack was moved from the earlier Documents/ChatGPT location and integrity-checked at that time. The preserved handbook covers product scope, EN/AR design, workflow/security contracts, provider runbooks, decisions and delivery gates. PYSA remains read-only reference material, not a schema/code template. Original planning status statements are historical after implementation began.

## 2. Identify the existing accounts and target resources

Owner supplied `nahrplatform-rgb/academyos-web`, Vercel AcademyOS (`academy-os2`), Supabase staging `snpphkenmvmhpjstbeul`, Clerk AcademyOS Staging and Cloudflare `nahr.dev`. Existing accounts/resources were reused rather than duplicated. Several connector sessions could not see the correct account, so authorized CLI/native Chrome access was used. A wrong connector account was not treated as permission to alter another project.

## 3. Preserve company mail and verify the sending domain

Cloudflare remains DNS authority. Existing iCloud root MX/SPF/DKIM records were preserved. Resend uses the separate `notify.academy.nahr.dev` sending subdomain in Ireland; its DKIM/sending records reached Verified. Company correspondence, Clerk identity emails and application transactional email remain different services. No broad production email permission was enabled.

## 4. Build and push the bilingual application foundation

Commit `f60a01c`, 21 October 18:17 Cairo: npm workspace, Next.js/React/TypeScript app under `apps/web`, English/Arabic and RTL, responsive light Workspace shell, initial Clerk sign-in wiring, protected workspace, staging assertions and process-only health endpoint. UI truthfully marked unimplemented modules unavailable; no invented operational statistics. Build/lint/type and browser/configuration checks passed for that slice. [Historical foundation receipt](foundation-implementation.md)

## 5. Import the repository into Vercel and deploy staging

Owner imported main using root `apps/web`, Next.js preset, Node 24 and default output settings. `APP_ENV=staging` identifies this as AcademyOS staging even though Vercel labels its deployment environment Production. Initial deployment reached Ready at `academyos-web.vercel.app`. Hobby was retained at the owner's instruction. Commercial/production eligibility and provider plan decisions remain launch review items; deployment alone does not close them.

## 6. Configure Clerk and verify a real sign-in

Owner saved matching Clerk Development publishable/secret keys in Vercel/vault. The initial email had no app account; owner registered, received verification and signed in. Existing Clerk secret values could not be recovered from a masked display, so the owner handled credential creation/custody. Public keys were saved as Config; private keys as Secret. No key value was committed. Login succeeded while academy access remained denied pending membership.

## 7. Connect Clerk identity to the private Supabase boundary

Commit `0a82b7d`, 21 October 19:08: server-only publishable-key client forwards the current Clerk token. Bootstrap derives the caller from verified issuer/subject/role and creates only an identity. Active membership lookup accepts no caller-supplied identity/academy parameter. Private `academy` tables have RLS and no client table grants. Local SQL tests covered idempotence, two synthetic tenants, direct-access denial, revocation, wrong issuer and anonymous denial. This local harness was never applied to hosted data.

## 8. Apply and verify the hosted staging migrations

Correct project and PostgreSQL 17 were verified; three migrations were applied and source filenames aligned to provider versions: `20261021165259_identity_baseline`, `20261021165332_membership_reads`, `20261021165645_restrict_auto_rls_trigger`. The provider's auto-RLS event trigger retained automatic protection while unnecessary direct invocation grants were removed. Hosted role tests used a rollback transaction. Three informational no-policy notices and two warnings about deliberately narrow SECURITY DEFINER RPCs were recorded with rationale, not described as a clean full security audit. Commit `1a2b073`, 19:59. [Detailed receipt](membership-connection.md)

## 9. Correct deployment author identity

Vercel blocked later deployments because commits used the separate `moamenghareeb` author. Owner authenticated GitHub CLI as `nahrplatform-rgb`; repository ADMIN access and verified account ID were checked. Only this repository's author identity changed to the matching GitHub noreply address. Existing commits were not rewritten and global Git settings were unchanged. Commit `fc8f45b`, 20:33. Subsequent owner-authored deployments succeeded.

## 10. Verify deployed database membership behavior

Owner saved the staging Supabase public URL/publishable key and redeployed. Actual signed-in workspace reached “No active academy membership,” replacing the earlier unimplemented-membership message. The deployed Clerk-to-Supabase identity connection worked. Later restoration confirmed one identity, zero academies and zero memberships. No owner role, academy or business records were granted automatically.

## 11. Connect the stable staging domain and protect deployments

Cloudflare DNS-only CNAME for `staging.academy.nahr.dev` points to the exact Vercel-issued target. Vercel showed Valid Configuration. Nameservers and root company mail records were retained. Vercel Authentication was enabled for All Deployments; owner Incognito checks showed both staging and the original Vercel domain require Vercel login. Protected source maps stayed enabled. Existing `APP_ENV` was edited/used rather than duplicated.

## 12. Implement the service adapters and temporary verification tools

Commit `33ad085`, 22 October 00:42: explicit canonical origin/Clerk authorized parties; legacy page redirect; Redis rate limits with hashed subjects, short timeouts and fail-closed behavior; QStash raw-body/signature/issuer/expiry/canonical-URL checks with key rotation and idempotent receipts; fixed-recipient Resend setup adapter; Sentry browser/server/edge initialization and privacy filtering. Temporary setup routes required staging, an explicit flag, Clerk and Origin validation. Fifteen app unit tests and three browser tests passed, alongside lint/build/type checks.

## 13. Save the service credentials in the correct stores

Owner created/saved Upstash token and signing-key pair, Sentry build token, Resend domain-scoped sending key and Vercel automation bypass. The assistant verified names and deployed use without recording values. The first Upstash confirmation did not match the Vercel list, so missing entries were added and rechecked. Backup credentials were later isolated in GitHub, rather than added to the application runtime.

## 14. Verify Redis, QStash, email and Sentry in the deployed app

Authenticated synthetic checks passed Redis PING and actual allow/allow/deny throttling. QStash delivered the signed callback and Redis receipt `0c0f4dc7-41b8-46db-a3b4-c9357df44b28` was read successfully. Browser/server Sentry events appeared in the correct project with mapped application source. One owner-authorized setup email to `nahr.platform@gmail.com` was independently marked Delivered by Resend. This was setup proof, not an implemented invitation/outbox workflow. [Exact event/deployment/email receipts](service-setup.md)

## 15. Create private staging Storage buckets

Applied `20261021212039_private_staging_buckets.sql`: `academy-media`, `payment-proofs`, `support-attachments`, `exports`, each private with explicit MIME/size restrictions. Existing `storage.objects` RLS and absence of client policies were verified. No file was uploaded and tenant download permissions were not fabricated before their role/ownership model exists.

## 16. Tighten monitoring privacy and verify fresh data

Sentry source filtering removes user/request/free-text/cookie/header/query/breadcrumb data; replay, tracing, logs and metrics collection were disabled. Provider-side automatic geolocation was observed despite SDK filtering, so IP prevention, additional sensitive fields and an advanced `$user.geo.**` removal rule were saved. Fresh browser event `3c8b72df783c4091b4b91b03000593af` retained mapped source without user/location/request context. Older events were not claimed to be retroactively changed.

## 17. Activate and create the independent backup destination

After receiving cost/terms information, the owner activated R2 personally. A private Standard EU bucket `academyos-staging-backups` was created; no public development URL or custom domain was enabled. An age recovery key was created locally with restricted permissions; Finder was opened so the owner could find the hidden folder and save the key in their vault. Only the public encryption recipient is committed. The owner created bucket-scoped R2 credentials and a dedicated Supabase backup key and saved four secrets in GitHub environment `staging-backups`, restricted to main.

## 18. Build the encrypted backup/recovery workflow and correct failures

Commit `ecec2f5`, 02:00: daily/manual application-schema and Storage inventory/object export, age encryption before upload, read-back checksum verification, safe receipts, recovery tools and adversarial tests. A real local PostgreSQL/age synthetic one-file roundtrip passed. First CI attempt could not install PG17, corrected using the official PostgreSQL apt source (`4fa4698`). Safe error classification was added (`ece3886`). Database TLS verification then correctly rejected an untrusted chain; the dashboard-issued Supabase CA was pinned while keeping verify-full (`b0f7e75`). No password reset or TLS weakening was used. A later check validates Storage API credentials even with empty buckets (`6ca2b25`); seven backup tests passed.

## 19. Publish and restore the actual staging backup

[Run 39692011735](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39692011735) published and read back the encrypted R2 object. Its trusted GitHub receipt and downloaded encrypted rehearsal package matched. Decryption/all payload hashes passed; the actual application dump restored into a new local socket-only PostgreSQL 17 cluster and passed the membership boundary suite. Counts: one identity, no academies/memberships, three private RLS tables, no Storage objects. Temporary decrypted files/cluster were removed after saving a non-sensitive receipt. Hosted object restoration remains a separate unproven layer. Follow-up [39693001462](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39693001462) also verified the Storage API key.

## 20. Close setup tools and save the uptime monitor

`SERVICE_SETUP_ENABLED=false` was saved after owner completed Vercel passkey verification. Deployed authenticated page returned Page not found; process health returned `ok`. Owner saved Sentry uptime monitor `2491612`, staging, GET canonical health URL every minute. A Vercel automation bypass header passes the hosting gate without granting app membership. JSON-path comparison was corrected to literal `ok`; manual test passed. Sentry warns uptime-check data may be stored outside the selected EU region. Existing project alert `1400964` targets high-priority issues; actual delivery/first scheduled check-in still required follow-up at the stop point.

## 21. Record the stop/resume boundary and first scheduled backup

Owner requested a stop after the uptime save; no further manual work was started in that session. Local evidence/checkpoint files were preserved. Owner has now authorized this documentation consolidation and remaining staging configuration. Read-only refresh on 22 October found the first **scheduled** backup [39712985982](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39712985982) succeeded on `6ca2b25`. GitHub dispatched it at 02:43 UTC rather than precisely 02:17; this is evidence of schedule delay, not a one-hour recovery guarantee.

## What this history does not establish

No platform administrator provisioning, academy onboarding, branch role scopes, real tenant file access, business jobs/email dispatch, financial module, native/offline app, separate production infrastructure or production acceptance is complete. Product decisions remain explicit. Current work is listed in [remaining configuration](remaining-configuration.md).
