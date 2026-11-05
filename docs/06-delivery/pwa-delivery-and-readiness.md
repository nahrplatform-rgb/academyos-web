# Installable PWA delivery and readiness

6 November 2026. Canonical cross-cutting delivery contract for installing the **existing AcademyOS web app**. The Owner requested this documentation/planning integration; no PWA product code, manifest, installation, provider configuration, database change or new runtime pass is delivered here. [Planning receipt](../07-handoff/evidence/pwa-planning-2026-11-06.json) · [PWA traceability](pwa-delivery-traceability.csv) · [execution tracker](experience-execution.csv) · [living continuation](continue-academyos.md).

## Outcome, authority and separate readiness claims

Develop installation alongside the existing local-data/sync and Operations redesign work. Reuse its protected repositories, scoped public shell, bounded preparation, original sender and current server authority. An installed window is another client context for the same product, not a second application, database replica design or generic offline queue. The current primary remains **EX-07 normal Attendance integration**, after the retained EX-13 foundation checkpoint; EX-14/15/16 are supporting packages.

Track three independent statements: **installation ready** for a declared OS/browser/launch path; **offline coverage** for an exact role, dataset, route and command; **whole-app completion** against the master plan/redesign. None implies either other statement. Keep design, implementation, local checks, deployment, installed/hosted verification, Owner acceptance and independent review separate. Installation metadata can ship before future modules; publish its actual supported coverage honestly.

Existing ordinary email/password sign-in, no mandatory passkey or local secret, no inactivity lock, no rejected24hour read cutoff, logout/30day-without-online-verification replica cleanup and protected original/pending-work recovery remain canonical. Keep account/academy/role/field scope and current replay permission/version/deadline checks. Owner-only promotions and SDR-06/07 synthetic staging authority remain; independent external review stays deferred, nonblocking and not performed. This plan adds no production launch, real-data use, paid service, native rewrite, notification business policy or access grant.

## Current position — inspected6November

| Layer | Evidenced current state | Remaining boundary |
|---|---|---|
| Protected data and originals | Scoped encrypted IndexedDB repositories, coherent completed generations, bounded directory/month preparation and one-register original recovery have source-bound local evidence | Broader domains, devices, hostile lifecycle and provider/performance cases remain separately tracked; older inactive packets are historical, not the current whole-app status |
| Deployed Owner register | [EX-11 hosted pilot](../07-handoff/owner-register-window-and-hosted-checkpoint-2026-11-04.md) proves the declared one-register path, offline reopening and original sync | Ordinary Attendance still switches to a personal-device panel/separate startup; its integration is current EX-07 work |
| Deployed Owner Players/Calendar | [EX-13 continuity packet](../07-handoff/ex13b-workspace-continuity-2026-11-05.md): checked1347470 has49 local browser/transport cases,101 units and retained captures; both exact code CI runs passed. Owner-promoted staging independently resolves Ready `dpl_35UAsn5THBRHhtWLY6DuWBw3u7Br` at1347470. Scoped native EN/AR Players reopening/reconnect passed; prior86d Calendar grids/context proof is retained separately | Not a new installed-device test, whole WD-case pass or full-app no-refresh claim. Live denial/full-process restart/rollback/changed-transfer/device/percentile matrix stays open |
| Installation metadata | Current root layout has title/description/robots. Source inventory found no app manifest, install icon set, Apple touch icon, install guidance or display-mode handling | Purpose-built installation identity and launch are **planned/unbuilt**; a browser's ability to save any webpage is not AcademyOS installation readiness |
| Storage resilience | Strict local durability/error paths and synthetic quota/restart tests exist | No application `navigator.storage.persist/persisted/estimate` usage found; actual installed quota/eviction and cross-container behavior are unverified |
| Installed acceptance | None established by the current evidence | Actual install/OS-launch/authentication/offline/update/device review is **not executed**; working Owner acceptance remains pending |

The source and provider snapshot is dated, not a permanent live-status assertion. Update the tracker/receipts as delivery advances. The provider's production-target label currently serves the synthetic staging alias and does not authorize a production launch.

## Work packages and delivery lanes

| Package | Scope | Timing and evidence dependency |
|---|---|---|
| **EX-14 · PW-01/02** | Installation identity, manifest/icons, stable launch, platform installation guidance and authentication/deep-link return | Prepare alongside current EX-07. Reuse existing navigation/role contracts; do not wait for every future module. Install-only readiness can be verified before all offline domains exist |
| **EX-15 · PW-03/04/05/06/08** | Worker/cache ownership, safe installed startup/update, persistent storage diagnostics and shared local/save lifecycle | Coordinate with EX-07's normal Attendance integration and retained EX-13 repositories; no competing shared-file edits. Deliver compatible slices, not a replacement sync engine |
| **EX-16 · PW-07/09 and installed evidence** | Actual OS/browser installation, launch/auth, supported offline commands, updates, camera, accessibility and measured coverage | Begin each case after its relevant working slice. Install-only cases need EX-14; data/update cases additionally need the corresponding EX-15/domain slice. Do not make all future EX-07 work a prerequisite for the first installation test |

The tracker retains exactly one `current` primary row. All three PWA rows use `supporting` lane/state and unique supporting orders. They accompany the affected implementation checkpoints; they neither replace Attendance nor wait until all modules are built. Future finance/settings/reporting/communications inherit the [domain adoption map](local-data-and-sync-plan.md#full-app-adoption--5-november-2026), with real typed field and command contracts when built.

## PW-01 — installation identity and presentation

Proposed engineering defaults for the first bounded implementation: stable staging identity such as `/app/staging-v1`, visible **AcademyOS Staging** name/icon distinction, HTTPS on the existing staging origin, `standalone` presentation and an explicit same-origin launch/scope. A future production origin/identity remains a separate release. Do not include a subject, academy UUID, email, bearer token or tracking identifier in the manifest. One installed AcademyOS resolves the current user's permitted workspace/role; test personas remain isolated, not hard-coded into app identity.

Provide actual loadable192px/512px PNG icons plus suitable maskable variants, Apple touch presentation and existing brand-derived assets. Check mask safe areas and light/Charcoal window/status surfaces. Use the selected Operations light default/Charcoal alternative, not a new palette. Prefer the framework's existing manifest metadata convention rather than an installation framework or caching plugin. An explicit manifest `id` keeps identity stable when a launch address changes. [Google manifest guidance](https://web.dev/articles/add-manifest) · [Next.js manifest convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest).

Google documents manifest/name/icons/start/display/HTTPS criteria and additional engagement rules for its promoted install UI. A missing `beforeinstallprompt` event alone does not establish that installation is impossible. Safari26 permits users to add any site as a web app; that does not prove prepared data or a usable offline launch. Feature-detect an offered install event; otherwise provide accurate platform/menu guidance, without repeated prompts or blocking daily work. [Chrome install criteria](https://web.dev/articles/install-criteria) · [WebKit Safari26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).

## PW-02 — launch, normal sign-in and workspace return

First installed launch resolves identity and workspace through existing authority; it may require normal sign-in and local preparation even if the browser tab was ready. Repeat launch reopens compatible permitted local coverage and the safe task context when available; background checks must not reset it. Preserve locale, permitted route/filter/selection and safe auth return; never restore another account's private view from a raw URL or cached membership. An expired/revoked/wrong-recipient invitation explains its existing safe action.

Choose and implement one stable public launch bootstrap in the EX-14 packet before publishing `start_url`. A proposed `/app` bootstrap is **not an existing route**. It must resolve the locale and safe current/last workspace, then enter the same normal components. Current public fallback covers Players/Calendar only: pointing a manifest at `/en/workspace`, `/` or a new `/app` does **not** make that address work offline. Implement and test the launch-to-covered-route chain rather than using a private task UUID in the manifest or silently claiming universal offline startup.

Do not assume installed and browser contexts share cookies, IndexedDB, keys or workers. Apple documents independent Safari web-app storage; its Safari17 release notes describe initial cookie copying on Mac but no copying of other local storage. Treat any inherited session as a convenience to verify, not a product dependency. An installed context with an empty store must sign in and prepare normally. Do not export credentials/key material between containers or create a new unlock requirement. [Apple web-app behavior](https://support.apple.com/en-us/104996) · [WebKit cookie/storage boundary](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/).

## PW-03/04 — data and daily commands

Use the normal Players/Calendar/Attendance and later domain screens online and offline for compatible permitted data. Useful task first, then bounded current-month/directory preparation and adjacent months, with coherent completion and honest uncovered states. Preserve search, selection, scroll, focus, open tasks and unfinished input; distinguish cold authentication from background revalidation. Use the existing compact connection/preparation/pending-save indicator, not a routine manual reopen/Sync process. Partial counts and missing data must never become checked empty/zero.

The [Owner dataset contract](../04-engineering/owner-workspace-dataset-contract.md), [offline-edit contract](../04-engineering/offline-edit-and-conflict-contract.md) and original sender remain authoritative. A supported local save commits its data and original operation atomically before **Saved on this device**. **Synced** requires the canonical receipt. Retry/reconcile the same immutable ID and payload after lost replies. Server access, versions, deadlines and atomicity remain; conflicting/refused work stays protected for its scoped review. Capture UTC time, trusted-time evidence and server receipt time separately. No universal queue or automatic device-timestamp winner. Unimplemented finance/other writes are not made safe merely by installing the app.

## PW-05 — service-worker and update ownership

Source inspected at1347470/current docs HEAD546efe4:

| Current registration | Public cache ownership | Navigation coverage and limits |
|---|---|---|
| `workspace-public-shell.ts` registers `/prepared-workspace-worker.js` with scope `/` | `academyos-workspace-public-v1:` and its index/revision pointer | Validated EN/AR Players/Calendar UUID routes and optional valid Calendar anchor; public `/prepared-workspace` and checked Next JS/CSS; network-first route fallback |
| `register-public-shell.ts` registers `/prepared-register-worker.js` with scope `/prepared-register` | `academyos-prepared-public-v1:` and its separate index/revision pointer | Public `/prepared-register` startup; not ordinary Attendance offline navigation |

Both current workers bound preparation to48 assets/8MiB, omit credentials for public-shell fetches, validate content and retain a previous cache revision. Both currently call `skipWaiting` and `clients.claim`. Their presence is not installed-update/migration evidence. A root scope is not blanket route support or permission to cache private data; the narrower registration has separate ownership. Extend/reconcile these exact registrations under EX-15. Never introduce a second competing root worker, automatic `cacheEverything` plugin, opaque private-response fallback, or broad cache deletion that removes another prefix or pending IndexedDB records.

Define worker/code/protocol/repository schema compatibility before changing activation. Stage verified public assets, keep a known compatible generation available, and test open older clients alongside the new version. Retain dirty input and all originals through key/schema migration, interruption and rollback. Do not trigger an unconditional reload on focus, `controllerchange`, new deployment or an update check. If activation/navigation is required, show a small update-ready state and use a safe point after drafts are retained and unknown operations are fenced/reconciled; no destructive forced refresh. Existing immediate activation needs compatibility proof for the changed slice, not a blind global ban or untested copy. Browser worker waiting/activation can mix old clients and new code. [Chrome lifecycle guidance](https://developer.chrome.com/docs/workbox/service-worker-lifecycle).

## PW-06 — device storage and honest recovery

Feature-detect `navigator.storage.estimate`, `persisted` and `persist`; request persistence at a suitable personal-device preparation point and record whether it was granted. These are hints/permissions, not reserved capacity or guaranteed backup. Handle absent APIs, refusal, quota errors, strict-durability failure, corrupt/missing keys, interrupted upgrades and eviction without false Saved. Stop/resume preparation honestly under bounds; a failed write preserves current input and does not acknowledge a local commit.

Track public cache, encrypted read replicas, indexes, key custody and protected pending operations separately. App-managed cleanup removes rebuildable replicas on logout/30day policy while keeping protected originals recoverable only by the same currently authorized account. Do not clear pending work to make room, on uninstall guidance, to resolve a migration, or as a side effect of changing worker prefixes. Account/access loss must not expose retained encrypted work to another user.

OS/browser data deletion, origin eviction, uninstall behavior or device loss can destroy the only local copy and key. **Unsynchronized work cannot be promised recoverable once its only durable copy is destroyed.** Explain that boundary where relevant without claiming a server backup of unsent work. Installed/browser stores may be separate and may each require download; measure and do not double-count storage or savings. WebKit documents variable quota, origin eviction and persistence heuristics, including Home Screen use; no fixed per-device capacity is assumed. [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/).

## PW-07 — installed target matrix and proof

These are **candidate target families**, not a passed support claim or minimum-version promise. For each implementation checkpoint, pin the actual OS/browser version, device, profile/container, source/build, manifest identity, worker controllers and dataset/key/schema generation. Publish a supported combination only after its declared cases pass; retain exact untested/unsupported rows. Browser-tab emulation and source/local desktop restart tests do not prove installation.

| Target family | Installation surface to verify | Current status |
|---|---|---|
| Windows + Chrome/Edge | Browser install flow, Start/app launch, supported standalone/deep-link and multiple windows | Not executed |
| macOS + Chrome/Edge | Browser install flow and OS launch; separate test profile/persona | Not executed |
| macOS Safari web app | Add to Dock on macOS14+; independent storage/auth/permissions; exact available OS version | Not executed |
| iPhone/iPad + Safari Home Screen | Platform Add to Home Screen/Open as Web App; viewport/keyboard/safe area, auth return, actual camera | Not executed |
| Android + Chrome | Offered/menu installation, actual OS launch, icons/maskable rendering, lifecycle/storage/camera | Not executed |

Apple documents Add to Dock from macOS Sonoma14; newer platform behavior must be rechecked when declaring support. Browser choice, user settings and install menu vary. Firefox/other browsers remain normal-web fallback unless installed support is specifically evidenced; do not claim a native download exists. Physical access to each target and minimum supported versions remain measurement/product-release decisions, not a blocker to metadata planning. [Apple installation guidance](https://support.apple.com/en-us/104996).

Installed cases include fresh and repeat launch, separate-container sign-in/preparation, safe deep links, covered/uncovered offline entry, local commands/reconnect, update with dirty/unknown work, quota/eviction, account/role change and cleanup, rollback, QR/camera permission denial/retry, EN/AR,320/360/390px/tablet/desktop,200% zoom, keyboard/screen reader, safe areas and open software keyboard. Reuse existing QR/server rules; a prior Mac browser scan is not an installed iPhone scan. [WD-72–WD-86](academy-working-day-cases.csv) remain planned until separately evidenced.

## PW-08/09 — foreground sync and optional device features

Active launch/resume/reconnect drives the shared bounded sync owner and durable original retry. If the window is suspended/closed, execution may stop; retained work resumes when allowed or next opened. Background Sync is not consistently available, and a worker may be stopped/retried. Feature-detect any later best-effort scheduling through the same original protocol; do not persist a bearer token, extend deadlines or bypass sign-in to keep a closed app sending. **No guaranteed continuous synchronization while closed.** [MDN Background Synchronization](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) · [offline/background limitations](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).

Push, badging, shortcuts, sharing, file integrations and store distribution are optional future capabilities. Assess provider/permission, audience/privacy/consent, actual device support, retries, deep-link authority and cost separately. They are not installed/offline prerequisites or implemented features. No notification permission request at first sign-in; denial/absence keeps ordinary work usable. A shortcut is a permitted destination, never a write or bypass. No new push subscription, sender, service, store account or paid commitment is authorized here.

## Measurement, acceptance and unresolved decisions

Measure first install/container preparation versus repeat launch, unchanged manifest, changed/replacement sync, local action, original send/reconcile and update. Separate public asset bytes/CDN and browser cache from app API, Clerk, Supabase RPC/query, Redis limiter and other provider work. Reuse existing declared performance targets/profiles; no new p75/p95 or quota savings claim. An independent container may incur another bootstrap; multiple windows must not duplicate one scoped sync owner where shared. Do not add app-wide polling, Realtime or a paid cache merely for installation.

PWA readiness requires the recorded metadata/launch and applicable installed-device cases; a manifest, Lighthouse/DevTools result, browser menu option or source-controlled worker is supporting evidence only. Installation-ready can name a narrow online/coverage subset; it does not close normal-route Attendance, broader finance/offline domains, security, physical devices or Owner acceptance. Unknown failure never becomes a zero/empty/saved claim.

| Open choice | Recommendation and when it matters |
|---|---|
| Exact supported OS/browser minimums and available physical devices | Start with the candidate families above, pin actual available builds and capability requirements, then publish only the tested subset. Record missing devices; do not hold unrelated metadata or Attendance work |
| Stable launch address/identity and worker compatibility implementation | Use an environment-distinct stable ID and safe same-origin public bootstrap, with explicit online/offline coverage. Confirm in the bounded engineering packet before metadata shipping; routine engineering choices do not require another whole-product approval |
| Persistence response and storage ceilings on actual targets | Measure estimates/grant/denial/full-disk behavior; keep bounded existing budgets until evidence supports changes. Do not turn an estimate into reserved capacity or a new retention timer |
| Optional push/shortcuts and closed-app scheduling | Keep deferred until a concrete user workflow, permission/privacy and supported platform contract is ready. They do not block core installation |

There is no unresolved decision to re-ask about normal sign-in, idle lock,24hour cutoff,30day/logout replicas, original recovery, synthetic trial authority or promotion ownership.

## Documentation ownership and exact next action

This document owns cross-platform installation/update requirements; the tracker owns current priority/status; existing local-data/domain contracts own fields and commands; WD/PW registers own planned cases/joins; receipts own observations. Governance/AGENTS, master plan/roadmap, redesign, request/performance/cost plans, acceptance/test strategy, loading/security/action/requirement joins and builder/index documents link here rather than copy a second PWA implementation plan. The structural validator checks these pointers, unique supporting packages and joins; it does not establish runtime proof.

**Next implementation:** continue [EX-07 normal Attendance](../07-handoff/ex07-normal-attendance-integration-2026-11-05.md), reusing the existing Owner panel/slot/account/original sender and proving stable task/local-save/offline-reopen/automatic-same-original sync. Alongside it, scope EX-14's manifest/icons/stable-launch and EX-15's shared worker/storage compatibility packet from the inventory above. Do not edit shared startup/worker files concurrently or implement another offline engine. EX-16 records actual installed results per delivered slice. This documentation request itself authorizes no new PWA code.
