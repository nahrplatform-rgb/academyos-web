# Optional services and future operating-system platforms

## Persistent local data and synchronization — LF-v2,2November2026

Durable web/PWA local read/sync is core experience work now, independent of optional native/desktop apps. Service-worker offline shell/unlock and per-domain offline writes still need explicit design/security review; native packaging alone does not solve them. Follow [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md).

These services are intentionally deferred until a defined product requirement and budget justify them. Record a decision before activation; “many services” should mean complete preparation, not unnecessary subscriptions.

## Optional web capabilities

| Capability | Proposed approach | Configuration and activation gate |
|---|---|---|
| Bot challenge | Cloudflare Turnstile if needed | Separate test/live widget; exact allowed hosts; public site key, server secret; server verification; accessible fallback |
| Product analytics | Minimal event measurement; PostHog or equivalent only after selection | Region, retention, event allowlist, pseudonymous IDs, consent policy; no child/finance replay by default |
| SMS/WhatsApp | Provider selected for country, cost and consent | Verified sender/business, template approval, sandbox, opt-in/out, quiet hours, delivery callbacks, spend cap |
| Push | Web push first only if justified; native APNs/FCM later | Device/account binding, consent, token expiry/revocation, payload privacy, receipts |
| Full-text search | PostgreSQL first | Authorized indexed queries; dedicated search provider only after measured need and deletion-sync design |
| Video processing | Deferred from basic images | Upload cap, transcoding/scanning, private playback, egress budget, consent and retention |
| Malware scanning | Required decision for admitted attachment types | Quarantine state, chosen scanner, retry/failure behavior, private download blocked until cleared |
| Feature flags | Server-controlled release flags | Named owner, expiry, environment, kill switch; never substitute flags for authorization |
| AI assistance | No dependency for core launch | Purpose, data minimization, provider retention, cost, human review and accuracy evaluation before any use |
| Customer helpdesk | In-app support first | External vendor only when needed; access, retention, redaction and synchronization defined |

Turnstile tokens require server validation, expire after five minutes and are single-use; check expected hostname/action and handle expired/replayed tokens. A client widget alone is not protection. [Cloudflare validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## iOS and Android: proposed Expo/React Native phase

The web API, permissions, idempotency, localization and design tokens must exist before native development. Share types/schemas and server business rules, while using native navigation, accessibility, camera/QR and secure storage. Prioritize trainer attendance and guardian schedule/progress according to D-020 rather than porting every administration table first.

Before native work, establish:

1. NAHR-owned Expo organization/project, named administrators, billing and recovery.
2. Stable production and development application identifiers; proposed namespace `dev.nahr.academyos`, subject to availability and store configuration. Separate test builds avoid overwriting a real app or sharing production state accidentally.
3. Apple Developer/App Store Connect and Google Play Console organization ownership, agreements, store contacts, app records and signing custody.
4. EAS build profiles for development, preview and production, explicit runtime/API environment and protected signing credentials. EAS can produce and manage application builds; actual profiles and SDK compatibility are verified at native kickoff. [Expo EAS Build](https://docs.expo.dev/build/introduction/)
5. Clerk native application registration and exact redirect/deep-link configuration; universal/app links with ownership verification. No production secret key inside the app bundle.
6. APNs and FCM credentials with environment-specific tokens and device/account binding; push opt-in after explaining value, plus safe handling of revoked devices.
7. Native offline database, migrations, encrypted sensitive storage and secure-key strategy; bounded offline authority and conflict policy shared with the server.
8. Store privacy/data disclosures, account-deletion flow, permission purpose strings, screenshots, support URL and current payment policy review for the actual product.

Native acceptance covers physical devices, interrupted launches, airplane-mode queue capture/reopen/reconnect, low storage, background suspension, push opt-out, deep-link wrong account, token revocation and older supported app versions. Store submission/approval and distribution are separate from a successful build.

## Desktop: optional macOS, Windows and Linux

Start with browser/PWA usability. If desktop installation provides clear operational value, evaluate Tauri with a thin client over the same API. A Next.js server application cannot simply be embedded as static files without deciding which routes remain remotely hosted. Define local/native command permissions narrowly.

Record bundle IDs, signing certificates, macOS notarization, Windows signing/distribution, Linux packaging targets, update signing, update channels and rollback. Protect updater keys and test signature rejection. Tauri distribution has platform-specific packaging/signing steps that must be selected for the actual targets. [Tauri distribution](https://v2.tauri.app/distribute/)

Desktop acceptance includes installation/uninstallation, safe updates with pending local work, offline account switching, camera/QR if used, keyboard access and screen readers. Do not claim all operating systems supported after testing one development machine.

## Revisit instead of freezing future rules

At each platform kickoff, refresh official SDK versions, store requirements, payment rules, signing procedures and supported OS versions. Keep this document as the architecture and ownership checklist; record the then-current implementation settings in a platform-specific addendum with evidence.
