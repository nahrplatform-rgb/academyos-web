# EX-25 Private media with consent and lifecycle — scoping packet

25 November 2026 · MP-B10 · Decision-ready packet (no implementation)

## What already exists (building blocks, not proof of consent-aware media)

- **Storage env var:** `STORAGE_MEDIA_BUCKET=academy-media` (and `STORAGE_PROOF_BUCKET`, `STORAGE_SUPPORT_BUCKET`, `STORAGE_EXPORT_BUCKET`) — provisioned but no code path uses them for media.
- **Player photo:** `apps/web/src/lib/player-photo.ts` normalizes base64-encoded JPEG/PNG/WebP to a 192×192 JPEG stored **in the database** (not in object storage). Used by `player-private-details.tsx` and `apps/web/src/app/api/people/route.ts`. No consent, no audience, no revocation, no retention.
- **Supabase client pattern:** `onboardingDatabase()` / `gatewayFetch()` / signed gateway RPCs — reusable for any new media RPCs.
- **RLS + signed gateway pattern:** proven by EX-24 Support and earlier batches.
- **Audit events:** `academy.audit_events` exists with actor/academy/action/operation_id/details.

## What is planned / gated (NOT implemented)

- No media table, no media API route, no media component, no storage integration.
- No consent scope, consent version, visibility/publication, or revocation state.
- No retention/hold, deletion, export, or download lifecycle.
- No signed-link delivery for media objects.
- No guardian/player access boundary for media.

## PYSA reference (read-only)

PYSA has a media gallery (`manager/media`, `player/media`, `guardian/media`) with:
- Supabase storage bucket `media` with signed URLs (15-min TTL)
- Upload validation (file type, size, batch limits)
- EXIF date extraction, image optimization
- RLS: player or linked guardian can read their own media
- Audit logging

**What PYSA does NOT have:** consent scope/version, consent withdrawal, retention policy, revocation of prior links, audience selection, or deletion lifecycle. PYSA's media privacy is access control (player/guardian), not consent-aware sharing.

PYSA media patterns are useful reference for storage integration and signed-URL delivery, but do not close any AcademyOS consent or retention decision.

## Connected workflow (candidate cases, not approved rules)

1. **Select & upload** — an authorized uploader (Owner/Manager/Trainer) selects files, validates type/size, uploads to `academy-media` bucket under `{academy_id}/{player_or_session}/{uuid}.{ext}`.
2. **Classify & consent** — tag the media with player/session/academy scope; record consent scope and version (who consented, when, for what audience).
3. **Publish to approved audience** — only roles/identities in the consent scope can view; signed URLs with short TTL.
4. **View through normal signed-in route** — authorized viewer opens media in-app; no public object URLs.
5. **Withdraw/revoke** — consent withdrawal or membership revocation removes access; prior signed URLs expire; audit trail preserved.
6. **Verify** — permitted access, denial to unrelated roles/academies, consent withdrawal, prior-link behavior, interrupted upload/retry, audit/persistence.

## Missing business decisions (decision-ready packet)

| # | Decision | Recommended default | Alternative | What it changes for users | Blocks |
|---|----------|---------------------|-------------|---------------------------|--------|
| 1 | **Consent authority** — who can consent to media sharing? | Guardian consent required for minors (D-004); player self-consent when age threshold met; Owner/Manager cannot consent on behalf of family | Academy-only consent (simpler, no guardian involvement) | Determines whether guardians must approve each upload or batch | Upload, publish, view, revoke |
| 2 | **Consent scope/version** — what does consent cover? | Per-upload consent with explicit audience (academy staff / specific roles / guardians of tagged players) | Blanket academy consent at enrollment | Per-upload is more granular but heavier; blanket is simpler but less precise | Publish, view, revoke |
| 3 | **Retention** — how long is media kept? | Retain while player is active + 12 months after archive; legal hold overrides | Indefinite retention (simpler, but privacy risk) | Determines storage cost and deletion timeline | Delete, export, backup |
| 4 | **Revocation** — what happens to prior signed URLs when consent is withdrawn? | Signed URLs expire naturally (15-min TTL); new access denied immediately; existing in-flight downloads complete | Immediate invalidation of all outstanding URLs (requires URL revocation mechanism) | Immediate is stricter but requires storage-level revocation; natural expiry is simpler | Revoke, prior-link behavior |
| 5 | **Audience** — who can view uploaded media? | Uploader + academy Owner/Manager + guardians of tagged players (if consented) | All academy members (simpler) | Determines gallery visibility and access checks | View, gallery |
| 6 | **Deletion** — can media be permanently deleted? | Soft-delete (mark deleted, retain for audit/hold period) then hard-delete after hold | Immediate hard-delete on request | Soft-delete preserves audit trail; hard-delete satisfies erasure faster but loses evidence | Delete, history, export |
| 7 | **Storage location** — object storage or database? | Supabase Storage bucket `academy-media` with signed URLs (PYSA pattern) | Base64 in database (current player-photo pattern) | Object storage scales better and supports larger files; base64 is simpler but limited to small images | Upload, view, download |
| 8 | **File types and size limits** — what media is allowed? | Images (JPEG/PNG/WebP) up to 10MB; videos (MP4) up to 50MB; no executables | Images only | Videos add value but increase storage/bandwidth cost | Upload, validate, scan |

## Decisions required

- **D-004** (Player accounts and minors) — open; guardian consent authority for minors depends on this.
- **D-015** (Retention and privacy) — open; retention, deletion, export, and consent records depend on this.
- **MP-Q12** (Media privacy and data-class lifecycle) — open; blocks all dependent private storage/sharing/real-data lifecycle.

None of these decisions are settled. No implementation should proceed until at least decisions 1, 2, 5, and 7 are resolved (they determine the core upload/consent/view/revoke flow).

## Building blocks available (not consent-aware)

| Component | Status | Reusable for EX-25? |
|-----------|--------|---------------------|
| `STORAGE_MEDIA_BUCKET` env var | Provisioned | Yes — object storage target |
| `player-photo.ts` (base64 normalize) | Implemented | Partially — image validation pattern reusable; base64 storage not suitable for media |
| Supabase client + signed gateway | Implemented | Yes — RPC and RLS patterns |
| RLS + signed gateway pattern | Proven (EX-24) | Yes — access control pattern |
| `academy.audit_events` | Implemented | Yes — audit trail |
| PYSA media system | Reference only | Partially — storage/signed-URL pattern reusable; consent model not present |

## What this packet does NOT authorize

- No implementation of media upload, consent, gallery, revocation, or deletion.
- No storage bucket creation or provider changes.
- No schema changes or migration.
- No real child media, public buckets, or paid provisioning.
- No promotion or deployment.

## Next action

Present the decision table above to the Owner. If the Owner resolves decisions 1, 2, 5, and 7 (consent authority, consent scope, audience, storage location), a connected implementation slice can proceed. If all eight decisions remain open, EX-25 stays decision-ready and no implementation should begin.