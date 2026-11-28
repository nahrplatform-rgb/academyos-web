# MP-B01 Players directory return and registration confirmation

9 November 2026. EX-07 / MP-B01, VAL-02/09, IMP-J06-A01, J06-A01, S16–S18, AO-013/016, AT-013/016, L05/L06, SEC-J06 and WD-69/70/71. Continue the accepted Owner registration and directory workflow at checked source `5e837dd`. The prior profile, toolbar, prepared directory and original-operation evidence remains in the linked receipts. [Profile continuity](mp-b01-profile-continuity-2026-11-08.md) · [Prepared directory continuity](mp-b01-empty-prepared-continuity-2026-11-08.md)

## Change packet

Keep the confirmed registration outcome visible during the directory check and same-account authentication recovery. Distinguish missing authentication, actual denial, unavailable data, an empty checked page and a genuinely empty checked directory. On an online page, a same-query check should retain the incoming page cursor and the visible checked rows. Search and First page start a fresh query position. The existing paginated, signed People reads and registration/reconcile commands govern authority and persistence. Page position belongs to the current mounted account and academy.

The selected Operations sample groups the directory and its adjacent task, with stable search and return context. PYSA's useful reference is finding and inspecting a person from the directory. Its richer fields, controls and authority assumptions require their AcademyOS decisions before adoption. [Operations contract](../03-design/operations-design-reference.md#layout-controls-and-visual-fidelity) · [Prior source and reference comparison](evidence/mp-b01-profile-continuity/reference-review.md)

Verify with the same fictional actor, query, page, locale and viewport before and after. Hold the return read after a confirmed first registration, expire authentication for that read, then retry it. Count creates, reconciles, profiles and lists and verify keyboard focus returns to the authorized player. Use 30 fictional rows to force a second page, hold its same-query check, and verify the checked row identities, cursor, scope and recovery. Record local component and real signed boundary evidence separately.

## Before and after

The same actual React component, stylesheet and Chromium fixture used synthetic identity and HTTP responses. It started with a checked zero-player directory, saved one fictional player, and withheld the directory response until the test supplied a `401`. The Arabic sign-in view was checked at 360 CSS px. The page check used 30 matching names at 1440 CSS px, with the same query and second-page cursor.

| State | Before at `5e837dd` | Working result |
|---|---|---|
| Return after a confirmed first registration | Confirmation disappeared while the list was held and under the sign-in message. Focus was lost on retry. | Confirmation stays visible in EN/AR. The sign-in card has one retry. A current list restores one authorized row and its keyboard focus. |
| Retry a profile after `401` | The profile restored and the directory claimed zero players after its rows had been cleared. Back made zero list reads and left that empty view. | Profile recovery reads only the profile. The directory shows that it needs a current check. Back performs one list and returns to the player. |
| Visible return from a filtered second page | One list used the first-page cursor and changed the five-row page to 25 rows. | One list uses the second-page cursor. The same five records and search focus remain through the check. |
| Refresh a filtered second page | The five rows disappeared while the request was held and the request reset the cursor. | The five rows remain during the single same-page request. Actual `403` removes them and clears the cursor. A later authorized retry opens the filtered first page. |
| Current tail page becomes empty | The baseline refresh reset to the first page. | One bounded check returns an empty page. The Arabic message directs the user to First page, which takes one deliberate read. |

The first registration through directory retry uses exactly `candidates → create → profile → list (401) → list (200)`, with one create in both versions. Retry never resubmits or reconciles an already confirmed operation. The pre-existing original-ID cancellation, lost-reply reconciliation and foreign-account cases remain in the same suite. There is one intentional list after Back when only the profile has been reauthorized. Page checks still return at most 25 visible rows. [Comparison receipt](evidence/mp-b01-directory-return/comparison.json) · [L05/L06 loading matrix](../03-design/screen-data-loading-matrix.csv)

The waiting view and checked directory stay together in the existing Operations panes. The EN/AR status uses the current notice and action styles. The factual review refreshed all 16 actual-component groups and eight entry views under its shared source-fingerprint guard. The Arabic phone-width sign-in and English desktop saved-profile views were inspected. [Current experience](../../design/app-experience-review/AcademyOS-experience-review.html)

## Verification and delivery boundary

People browser checks pass in both React modes, including the prior 54-request, four-create path and the new isolated return fixture. Node 24.14.0 production build, types, lint and 103 unit tests pass. The workspace transport suite rechecks the compiled public shell and actual People/workspace route handlers with the Supabase SDK and signed RPCs against disposable PostgreSQL 17. Its separate fixtures retain the online first-registration and prepared replacement proofs. [Transport evidence](evidence/ex13b-workspace-transfer/transport.json)

The same-mounted-workspace `401` scenario is synthetic. Actual Clerk expiry, physical phone, installed mode, hosted performance and the reported hosted prepared-directory symptom remain separate evidence. NR03 and NR07 remain open beyond this route and case. The accepted rich Player decisions still gate dependent fields, editing, archiving and imports.

One configured `gpt-6.1-terra` helper at medium effort reviewed page/query return against the Operations reference at `5e837dd`. Peak helper count was one. Its scope was read-only, with no browser or provider contention. The coordinator reproduced the findings, owned the authority and save handoff, implemented the repair and verified both modes. Token savings are unmeasured.

The previous checked `5e837dd` candidate and `c73bdf8` hosted evidence are retained. Exact CI and preview readiness for the combined candidate are recorded separately from the Owner's staging promotion and signed-in verification. [Earlier release receipt](evidence/mp-b01-profile-continuity/release.json)

## Checked candidate

Combined commit **`5a7bebc29ba156d3cced28b6f780f6ebc56458b8`** is pushed. One scripted wait reported **53 of 53 Foundation steps passed** on run `42544204255`, attempt 1, job `128925557190`. The AcademyOS preview is **Ready** with the same full source SHA. [Foundation result](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/42544204255) · [Exact Vercel preview](https://vercel.com/academy-os2/academyos-web/HovhkKS9ce4bfwZU8zJmjG9gdciY)

The staging alias still resolves to the Owner-promoted `c73bdf8` source. The Owner can promote the checked combined candidate to `staging.academy.nahr.dev`, then the live source and signed-in EN/AR Players journey can be verified. The tracker carries the ready changed-query work separately. [Release receipt](evidence/mp-b01-directory-return/release.json) · [Living continuation](../06-delivery/continue-academyos.md)

## Owner promotion and signed-in check

The Owner reported promoting `5a7bebc`. A read-only deployment lookup for `staging.academy.nahr.dev` confirmed Ready deployment `dpl_AKBdytKRozd6Ygd2KDYVz6YRwdQB` at the exact checked source. In a separate Chrome tab on the existing signed-in Owner account, synthetic Academy B showed two players. In English the checked directory stayed in place while a profile loaded, Back restored focus to its row, and Escape closed the Layout menu. In Arabic the single-character hint held input focus, a valid prefix found one player and Clear restored two rows and search focus. [Verified release receipt](evidence/mp-b01-directory-return/release.json)

This was a read-only hosted journey with two existing players. Registration, actual provider expiry, current revocation, later pages, prepared-device state changes and working acceptance retain their separate evidence requirements.
