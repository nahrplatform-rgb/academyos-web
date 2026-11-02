# Persistent local-data connected review

This is the proposed EX-10 changed-state review for the Owner-directed [LF-v2 model](../../docs/06-delivery/local-data-and-sync-plan.md). **Not the working app, a deployment, policy acceptance or a private-storage/security implementation.** It extends the accepted Charcoal design rather than replacing it. Exact choices are in the [plain-language packet](../../docs/06-delivery/local-data-read-pilot-decision-design.md).

Open `http://127.0.0.1:3235/design/local-data-preview/index.html` when the repository-local server is running. Use HTTP on this fixed local origin: browser storage is origin-specific, so a different port/profile is a different store. Opening the downloaded HTML through `file://` does not establish reliable cross-browser persistence. The generated `index.html` contains its styles and script, with no CDN/assets/API dependency.

Owner response2November2026: the connected design is explicitly approved for implementation. The exact device/privacy bundle remains unaccepted: the Owner asked what the proposed15minute idle lock means. See the [approval record](evidence/owner-design-approval.json). This is not working-feature or security acceptance.

## Review sequence

1. Choose **Prepare this personal device**. November has 64 fictional sessions across three programs; the directory has 128 fictional players. Pages are 50 sessions / 25 players. Pause midway, reopen, then unlock. Already committed pages are not fetched again.
2. After completion, **Reopen this preview** again. Unlock. Open Players, search **Morgan Demo 128**, open details, then Calendar. Local indexed reads serve covered views; the optional Review diagnostics distinguish fixture manifest/page/change exchanges from local queries. No provider is being contacted.
3. Type an unsaved Overview working note. Open **Review scenarios → Changes… → Run scenario**, then Read failure. The note and its cursor remain. Updated names, moved dates and removals are applied; no automatic conversion of stale data to current or fake success.
4. **Storage abort → Run**, then Changes or preparation: a real IndexedDB transaction aborts without advancing the checkpoint/revision. Retry with Check for changes or Resume. This injects an abort; it is not a physical full-disk test.
5. Calendar: an unprepared month explains the missing data. February is checked-empty once prepared. Preparation of October/December is optional. Try offline mode in an already-open page, another empty academy scope, expiry/clock/denial, original-save recovery, and Remove prepared records.
6. Try EN/AR, dark/light, phone/tablet/desktop, keyboard and native dialogs. Review controls above the app are simulation controls, not proposed product controls.

**Actual:** IndexedDB rows/indexes, atomic record+checkpoint/change+revision, pause/resume, process restart persistence, real transaction abort, bounded visible queries, Web Locks coordination, metadata-only BroadcastChannel and local rendering. **Simulated:** source transport, sign-in/unlock, lease/time/denial, server writes/receipts. Unlock asks for no real password. Rows are unencrypted fiction. The artificial page delay demonstrates progress, not app speed or a benchmark. Offline cold launch/PWA/service worker, private encryption and real command queues are absent.

The 18-player register / 40-date program remain required existing real-app acceptance fixtures and in the accepted full-experience reference. This targeted lifecycle prototype does not pretend to implement those journeys again. Finances, real families, Manager/Player operations and new grants are excluded.

## Maintenance and evidence

```sh
node scripts/design/build_local_data_preview.mjs
node scripts/design/serve_local_data_preview.mjs
# Run verification in a separate terminal.
node scripts/design/test_local_data_preview.mjs
node scripts/design/build_local_data_preview.mjs --check
python3 scripts/design/build_continuation_prompt.py
python3 scripts/design/validate_experience_execution.py
python3 scripts/design/validate_implementation_register.py
```

Run from the repository root with the declared Node runtime. The test serves only this HTML at an ephemeral loopback port and uses an isolated persistent Chromium profile, then deletes that profile. No real app API, credentials, account data, provider or reference-repository mutation. [Checks](evidence/checks.json) record the exact generated HTML hash, synthetic tests, responsive matrix and limitations. Screenshots are temporary files outside the repository; durable review claims live in the [handoff](../../docs/07-handoff/local-data-read-pilot-review.md).

Source is in `src/`; build into `index.html` deterministically. [Manifest](manifest.json) proves generated freshness; [coverage](coverage.csv) joins the design states to canonical actions/WB/WD without changing acceptance status. The [factual current-source review](../app-experience-review/README.md) remains unchanged because no working app UI/source is changed by this checkpoint.
