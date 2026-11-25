# EX-25 Private class photos, consent and lifecycle

25 November 2026 · MP-B10 · Synthetic local checkpoint

## Current direction and finish line

The Owner directed EX-25 toward a private staff photo gallery with a workspace **Gallery** and a contextual **Class photos** entry on published classes. The private save and class-staff workflow should work without per-photo player tags or consent entries. Use the current Academy Owner and explicitly class-granted Manager as the synthetic roles. The workspace Gallery should lead to the same class media and preserve class and locale on return. Start with the class sources already supported by EX-25. Match and event sources beyond those classes belong to the broader media plan.

A finalized photo is visible within its authorized class scope. Use simple Owner controls to withdraw access and delete. Specify compatibility for reservations, drafts, published photos, withdrawals and in-progress deletions before changing the lifecycle. Keep historical fictional tags and permissions auditable and preserve previously withheld access, expiry and original-operation recovery. The existing synthetic time limits are the starting point, including the separate draft and published lifetimes. Capture the revised state transitions and any proposed retention decision before applying a changed lifetime.

Finish EX-25 with one coherent candidate and signed-in synthetic staging evidence. Prove the English and Arabic staff journey from Gallery and class entry, tag-free save and reopen, sparse Manager data, denied unassigned class and academy access, independent file recovery, old-link denial on role loss and withdrawal, and physical absence after deletion. Test expiry and legacy-item behavior. Confirm both image variants on hosted Storage and keep migration source and hosted ledger evidence together. The Owner performs any promotion and gives working acceptance separately.

The [media vision](../06-delivery/master-plan-v2/product-and-module-specifications.md#d14d17--private-media-consent-and-privacy-lifecycle) covers all role Galleries, selected family and player sharing, optional downloads and video. EX-25 provides the private staff photo foundation. Record the outstanding phases and their dependencies for the later platform sequencing decision. D-004, D-015 and MP-Q12 remain open.

## Working flow

This section records the existing candidate before the workflow revision.

In the enabled local trial, the Academy Owner opens **Class photos** from the published class date. The Owner or an explicitly assigned Manager can select up to ten JPEG, PNG or WebP photos, preview the prepared copies and save them as private drafts. Each photo has its own progress and recovery state. If an upload fails, its successful siblings remain saved. If a save response goes missing, the same tab can look up the original operation after reload. Resuming an unfinished binary upload uses the same file and reservation. The browser leaves the source file intact.

The Owner declares all depicted players from the class roster and records **fictional** permission for each player. Only the Owner can publish, withdraw or delete. Permission applies to the immutable image and its fixed class-staff audience. Changing the depicted players clears earlier permissions. Manager gallery responses omit the roster and consent details. Guardians, Players, unrelated staff and other academies have no gallery access under this trial. The local Manager fixture uses an explicit per-class grant and a direct class link.

The same-origin endpoint checks the current class, role, membership, item state and publication consent on requests for either variant. The gallery transfers thumbnails first. Opening a photo requests its larger variant. Withdrawing the photo or withdrawing any required permission blocks new requests to both previous URLs. Data already received can remain with the recipient. There are no shareable or presigned object links.

## Retention and storage

| Stage | Synthetic rule |
|---|---|
| Incomplete upload | Expires after 24 elapsed hours |
| Unpublished draft | Expires after seven elapsed days |
| Published photo | Expires after 30 elapsed days |
| Withdrawal | New reads are denied. The withdrawal remains distinct from deleting stored bytes. |
| Owner-requested deletion | Read access closes first. Success is recorded after both objects are confirmed absent. |
| Minimal audit and recovery receipts | Eligible for removal after 90 elapsed days. An unfinished deletion retains its starting receipt until it can be recovered. |

Expiry denies reads at the boundary. The Owner runs bounded cleanup for the class to remove expired objects and receipts. No scheduled cleanup service is included in this trial. The local store uses a private runtime directory, immutable main and thumbnail objects, and a single application process. Image bytes stay outside PostgreSQL. Participant tags and permission records are removed after confirmed object deletion.

The existing `academy-media` setup receipt and bucket migration describe a private staging bucket and a 10,485,760-byte provider limit. The local trial used disposable private files. The staging readback and authorized rollout are recorded below.

## Image handling and measurements

The device processes one image at a time. A selection can contain ten files. The source cap is 40,000,000 bytes, 24,000,000 pixels and 8,192 pixels on either axis. The server enforces 10,000,000 bytes for the prepared main and 262,144 bytes for the thumbnail before decoding. The default maximum long edges are 2,560 px and 384 px. An already suitable image keeps its dimensions. A source outside the supported limits or one that cannot be prepared at acceptable quality produces a file-specific error. HEIC shows an export-to-JPEG message. RAW, video and full-resolution original storage are outside the trial.

Chromium 156 on arm64 macOS processed the same synthetic detailed group illustration at both sizes. The comparison measures mean absolute pixel error against the original at a 1,280 px viewing width, on a 0–255 scale.

| Prepared long edge | Main bytes | Thumbnail bytes | Browser preparation | Mean absolute error |
|---|---:|---:|---:|---:|
| 2,048 px | 1,408,358 | 53,115 | 154 ms | 5.692 |
| 2,560 px | 2,195,423 | 53,115 | 110 ms | 3.056 |

The 2,560 px version retained more sample detail and exceeded the 2 MB starting target. Timing is a single sample per size. A 35,031,280-byte synthetic camera-style JPEG produced a 3,534,045-byte main and an 80,217-byte thumbnail in 228 ms. Browser checks also confirmed orientation correction, removal of synthetic GPS and other metadata, transparent PNG handling, unchanged original checksums, exact source size, and pixel and axis checks. These are generated group images tested in Chromium. A physical iPhone/Safari HEIC conversion remains unverified.

The connected workload used ten successive ten-photo selections across ten published classes. The 100 new photos used **107,929,160 bytes** in 200 objects, including **3,369,120 thumbnail bytes**. Opening the ten galleries transferred **3,369,120 bytes of image response bodies** and fetched no larger variants. Opening one full-size photo per gallery transferred another **10,067,660 bytes**. These figures exclude HTML, headers and pre-existing test photos. The batch and transfer measurements took about 40 seconds on this machine.

## Verification and release scope

The [local receipt](evidence/ex25-private-media-local-2026-11-25.json) links the observed checks to the local source. Desktop English and 390 px Arabic touch Chromium exercised the actual React gallery, request handlers and signed database operations with fictional identities, disposable PostgreSQL 17 and private files. The Arabic flow returned to the exact class and opened its gallery again. Tests covered mandatory permission for each pictured player, old-URL denial after membership or permission loss, cross-class and cross-academy denial, sparse role responses, incomplete-object retry, committed-response recovery without duplicates, physical deletion, and the four expiry boundaries. The loopback fixture substitutes the real Clerk and provider connections. It is not hosted or physical-device evidence.

Run focused checks with `node scripts/class-media/test_image_quality.mjs` and `node scripts/class-media/test_connected.mjs /tmp/academyos-ex25-connected.json` on the repository's Node 24 toolchain with Playwright Chromium and PostgreSQL 17. The connected fixture creates and disposes its own storage and database.

The PYSA review stayed read-only. `pysa-platform/actions/media.ts` shows private image storage and failure handling. `lib/security/media-access.ts` creates signed links. Audit findings FND-0013, FND-0029, FND-0047 and FND-0048 document successful sibling loss, visibility filtering after pagination, unconfirmed physical deletion and cross-academy tagging. EX-25 exercised the corresponding local boundaries using AcademyOS rules.

The Owner approved the fictional workflow only. D-004, D-015 and MP-Q12 remain open for actual consent authority and family sharing, data retention and legal holds, backup/deletion/export semantics and any hosted rollout. Physical device coverage and independent security review are separate. The local checkpoint changed no hosted schema, bucket or deployment. Owner acceptance of the working staging workflow remains separate.

## Authorized synthetic staging rollout

25 November 2026. The Owner authorized use of the existing private bucket and staging configuration after Foundation and a verified restore rehearsal. The Owner still promotes the deployment. EX-25 remains the current batch while this is in progress. The approved EX-26 work is preserved for resumption afterward.

The staging readback found `academy-media` private with JPEG, PNG and WebP allowed, a 10,485,760-byte bucket limit and zero objects. Row-level security was on and there were zero object policies before EX-25. The staging alias served `c905f78`. The database had no active Manager memberships. The planned hosted walkthrough uses the existing synthetic Isolation Academy B and a temporary class-scoped Manager grant to a verified test identity.

The staging transport sends prepared mains above 4,000,000 bytes as bounded same-origin parts. The server verifies the exact total and SHA-256, decodes the assembled image, stores the complete main immutably, and removes the parts before confirming the draft. This preserves the 10,000,000-byte cap despite Vercel’s default request limit. Downloads use a same-origin authenticated streaming response. [Vercel function limits](https://vercel.com/docs/functions/limitations#request-body-size)

A committed provider upload whose reply disappears is reconciled by exact byte and hash readback. A provider write with unknown outcome stays pending until reconciled. Deletion fences new reads before touching storage and confirms catalog absence before completing. Storage receives the current user JWT plus a server-only method-and-object proof. The staging app keeps the feature disabled outside the one configured test academy. There is no new service-role credential in the app.

The [encrypted staging backup](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/45587782357) passed. The replay of all three EX-25 migrations preserved 1,204 existing rows across 93 tables in disposable PostgreSQL. The local hosted-transport contract assembled and read back a 9,920,676-byte image and reconciled a dropped provider reply without a second write. It also verified the Storage policies against a simulated HTTP provider with the actual SQL rules. Physical iPhone HEIC remains unverified and continues to show the JPEG export instruction. Real child media, family-facing sharing, legal holds and backup erasure policy remain outside the synthetic authorization.

The checked candidate is prepared in the separate `ex25-staging-candidate` worktree based on `c905f78`. Its scope excludes the other edits in the main workspace, including the EX-26 preparation. The receipt must bind the final candidate to Foundation before any hosted schema or settings are changed.

EX-25 candidate `0f9c166ac118cce1410419daee76662fe9f41a78` is in [draft PR #1](https://github.com/nahrplatform-rgb/academyos-web/pull/1). The isolated build, 121 unit tests, 100-photo workload and review captures passed. Foundation is the next release gate. The stage alias still serves `c905f78`.

Foundation [run 45591909056](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/45591909056) passed the EX-25 checks and stopped at the register evidence fingerprint. The candidate is being narrowed to a media-owned gateway. The existing register check matches the original source again. The affected Owner-route and migration-dependent regression suites run against the repaired candidate before another push. No staging configuration has been applied.

Repaired candidate `95b72943ce682770149697d758f23730b5b7fabc` is on draft PR #1. Media now has a scoped gateway. The original register evidence check passed, and the affected Owner working day, normal and additive Attendance, and workspace-download runtime checks passed locally. [Foundation run 45594075023](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/45594075023) is checking this exact commit. All three compiled migration source hashes match the restore rehearsal.

## Hosted Owner upload blocked — 25 November 2026

Foundation run `45594075023` passed on `95b72943ce682770149697d758f23730b5b7fabc`. Staging subsequently served Vercel deployment `dpl_2gjkzd4ccyuif9mwWJUsHtDA6GVp` on that SHA after the Isolation Academy B settings were saved. The Owner reported opening the signed-in class gallery for the 6 November synthetic class. The uploaded file reached **Confirmation needed**.

Supabase Storage logged HTTP 400 and PostgreSQL logged a row-level security rejection for the original main object at 12:58:26, 12:58:35 and 13:00:11 UTC. The corresponding database item remained reserved with a reserve receipt and the main variant closed. The object catalog contained zero objects for the item. The checks establish storage rejection and absence from the gallery, with the exact failed policy predicate still open. The simulated provider fixture supplied request context directly and did not validate the hosted provider boundary.

The staging catalog contains the EX-25 objects and the three Storage policies. The three source versions are absent from the hosted migration listing. The last role readback found no active Manager or class grant. Preserve the original reservation and the private bucket. Verify the hosted provider contract before repairing the write path, then check recovery of the original attempt and run the remaining signed-in cases. EX-25 remains current and EX-26 remains queued. Physical iPhone HEIC and Owner acceptance remain open.

### Storage refusal follow-up

The 12:58:26 UTC refusal was `storage.object.upload` / `AccessDenied` on Storage 1.98.0. PostgreSQL reported SQLSTATE `42501` on a plain insert into `storage.objects` (no upsert or `RETURNING`). The edge log recorded the expected Clerk issuer, an authenticated subject, and the same subject on the successful variant RPC calls. Readback confirmed the reservation creator still held an active Owner membership, the class was still the current published event, and the original main variant was closed with no stored objects. No additional restrictive object policies were present. None of these reads exposes the actual policy-time proof header or distinguishes an absent header from a rejected signature or other failed predicate.

Next diagnostic checkpoint: capture only the failed predicate category for a single synthetic staging upload through the actual Storage endpoint. Distinguish claims, request method, proof presence/validation and reservation/variant state; keep the same policy result and never emit headers, proofs, tokens, secrets or image payloads. Prove the corresponding failure and corrected behavior before any policy change is applied. Retest the original reservation while it is unexpired; if expired, use normal cleanup and a fresh synthetic selection after the repair, never extending expiry or replacing an uncertain operation. No hosted policy, app source, access grant or deployment was changed in this diagnostic readback.

### Storage proof alignment

The hosted function definition still expected the original Storage proof format. Candidate `95b7294` signs the same private object operation in the scoped gateway format, which the older verifier rejects before it checks the upload reservation. The function definition established a concrete mismatch without collecting any upload payloads or credentials.

Applied `20261125145344_ex25_align_staging_storage_proof.sql` to the synthetic staging database. The migration replaces only the known older proof call and leaves an already-correct function in place. Disposable PostgreSQL exercised replacement and repeated application. The local hosted-contract fixture passed with the verified app route, the database policy and simulated Storage HTTP, including 9,920,676-byte upload and lost-response recovery. Hosted readback confirmed the corrected call, three EX-25 policies and a private bucket. The app already signs the correct format, so this repair required no redeploy.

The original item was still reserved and unexpired with zero stored objects at readback. The signed-in Owner was asked to retry the same selected synthetic file once. The retry, actual hosted write, Owner lifecycle, Manager grant and limited view, isolation, old-link denial, deletion and per-photo recovery remain to be verified.

Follow-up readback found the same original item in `published` state with one finalize receipt, ready main and thumbnail variants, and exactly those two objects in the private Storage catalog. This establishes the original save and publication outcome under the existing candidate. Signed-in reopen, withdrawal, deletion, Manager verification and the revised workflow remain open.

The first regression check for the revised direction passed in the local hosted-contract fixture. A class-granted Manager reopened a finalized photo before tagging or consent and received empty roster, tag and consent projections. The rest of that test still exercises legacy publication and withdrawal, deletion and lost-response recovery. This is a baseline for implementation in the candidate worktree.

## Revised staff Gallery candidate

The workspace picker links to Gallery in the enabled academy. Gallery lists current published classes using active Owner membership or an explicit current class grant for a Manager. The class link opens the existing media workspace and the return locates the class in the same language. The published class still has its contextual Class photos entry.

Finalizing an upload saves a private staff photo under the existing seven-day draft expiry. Owners can withdraw saved and legacy published photos. Withdrawal leaves expiry and historical restrictions intact and denies new reads of both variants at the application and Storage boundaries. Legacy published photos still require their original complete consent. Existing reserve, finalize, cleanup and deletion receipts retain their operation IDs and fingerprints. Legacy publish and consent commands remain available for existing clients and recovery.

Local verification covered English desktop and Arabic narrow touch, both entry routes, role scope, same-operation retry, legacy publication and consent loss, expiry, and deletion. The simulated Storage fixture also verified Owner withdrawal and deletion of a new private photo, and refusal of Manager withdrawal. The hosted catalog has the expected prior function definitions and the proof-alignment receipt. The initial three EX-25 source versions are absent from the hosted ledger. Apply the new forward migration explicitly without replaying prior scripts against staging. Signed-in verification of the revised candidate follows Owner promotion.

### Dependencies for later media delivery

1. Trainer Gallery and coaching links need current class assignment and an approved upload capability. Tie player-specific links to the development record and its authorization.
2. Guardian and Player Galleries need verified identity relationships and the D-004 account rules, along with purpose-specific eligibility, sharing, withdrawal and expiry policy under D-015 and MP-Q12. Add selected photo sharing and optional downloads together with audience tests.
3. Short video needs resumable upload, processing recovery, authorized playback, measured storage and transfer budgets, and deletion across generated versions. Use synthetic inputs until real media is approved.
4. Evaluate full-match recordings using observed upload reliability, playback and storage costs after short video is proven. Schedule these phases in the later platform sequencing decision.
