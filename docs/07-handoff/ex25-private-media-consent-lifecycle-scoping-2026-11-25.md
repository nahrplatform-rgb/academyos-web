# EX-25 Private class photos, consent and lifecycle

25 November 2026 · MP-B10 · Synthetic local checkpoint

## Working flow

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

The connected workload used ten successive ten-photo selections across ten published classes. The 100 new photos used **107,929,160 bytes** in 200 objects, including **3,369,120 thumbnail bytes**. Opening the ten galleries transferred **3,369,120 bytes of image response bodies** and fetched no larger variants. Opening one full-size photo per gallery transferred another **12,098,866 bytes**. These figures exclude HTML, headers and pre-existing test photos. The batch and transfer measurements took about 40 seconds on this machine.

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
