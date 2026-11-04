# AcademyOS connected experience proposal

**Current reference reconciliation — 4 November 2026:** this complete proposed flow/state design was approved on 29 October (see its approval receipt below). The Owner's later selected [Operations design](../../docs/03-design/operations-design-reference.md) supersedes presentation values: light default, Charcoal alternative, compact resizable panes and unified controls. Preserve this broader workflow/state coverage where compatible with current rules, and implement it as one connected working app. Do not recreate another fictional whole-app proposal or use historical review-pending text below to re-ask the settled approval. The four-view Operations sample, this simulation and factual app captures have different evidence roles.

## Persistent local data and synchronization — LF-v2,2November2026

Persistent local data and quiet synchronization are now the Owner-directed experience target; read [local-data and sync plan](../../docs/06-delivery/local-data-and-sync-plan.md). The approved full Charcoal visual/workflow reference and factual current-source capture evidence stay separate. New bootstrap/reopen/coverage/lock/sync/storage failure states need a targeted local-first review; do not infer durable functionality from this HTML. The older summary-only storyboard is superseded.

Owner-authorized full redesign plan,29October2026. Open [the single-file proposed preview](AcademyOS-connected-preview.html). It is separate from the [factual current-source review](../app-experience-review/AcademyOS-experience-review.html).

**Design simulation only:** no identity, API, database, email, camera, credential, real card or hosted persistence. Reload resets fictional records. The proposed role homes/calendar and revised program-review sequence are not claimed as app implementation. Plan approval does not mean this unseen design is approved. Consolidated review is pending.

## Review it as a connected app

Start at Owner overview. Open Training → program → program or individual planning → publication → session inspector → move/cancel/history. Use People for registration/duplicate comparison, Guardian links, Trainer appointments and card lifecycle. Use the external **Review actor** control for Trainer Today → sessions →18-player register → correction request, or development authoring; switch to Owner to review, then Guardian for published-only feedback/schedule.

Program creation: Details → different weekday times → summary. Save is disabled while all dates are checked. **Deliver date-check result** in the external review toolbar finishes the fictional check; View every date shows the40-date default fixture. Draft creation and publication remain separate.

Every local write has a pending state. **Deliver simulated reply** is an external review control, never a proposed production button. **Next save reply** can demonstrate response loss after commit or before commit. Check save status before replacement. Generic scenario controls show loading/empty/read failure/stale/denied and other applicable states; invitation expiry is confined to invitation-related views. These simulations are not server authorization, atomicity or reliability proof.

DEMO-ALEX(-R1) shows saved Present/duplicate protection; DEMO-SAM shows correction-only saved Absent; DEMO-JORDAN shows one matching session; DEMO-TAYLOR requires a choice between adjacent sessions whose scan windows overlap; DEMO-OTHER is not rostered. Card replacement/revocation invalidates the fictional Alex card version. Specimen QR is decorative and intentionally not a usable credential. No camera permission is requested.

Use EN/AR, dark/light, phone/tablet/desktop and the labelled drawer/details/bottom navigation. Module accents are distinct from status colours. Coverage/notes links30 proposed destinations to existing parent IMP/J/AO/AT/loading/security IDs; associations do not close requirements. Notes remain in memory until downloaded as JSON; there is no upload.

## Maintenance

Source lives in `src/`; the delivered HTML embeds all CSS, JavaScript and coverage. No CDN or network dependency.

```sh
node scripts/design/build_full_experience_preview.mjs
node scripts/design/test_full_experience_preview.mjs
node scripts/design/build_full_experience_preview.mjs --check
python3 scripts/design/validate_implementation_register.py
node scripts/experience-review/build.mjs --check
```

Run from the AcademyOS root using its Node24 runtime. Build regenerates HTML, coverage and manifest deterministically. Test uses an ephemeral localhost server and Playwright for the fictional design, creates local evidence, and never reaches app APIs. Do not describe responsive emulation, contrast spot checks, role controls or fictional saves as real-device/security/backend/hosted verification. Native Arabic, assistive technology and the eventual app-to-preview parity need separate review.

[Full design/action/reference/gate packet](../../docs/06-delivery/full-experience-redesign.md). Financial, communications/media, Manager/Player operational and offline/native work remain future scope.

[Local verification and limitations](verification.md) · [per-destination delivery status](delivery-status.csv) · [rendered controls](evidence/rendered-control-inventory.json). Review-toolbar story fixtures can show future family training, published feedback, pending corrections and ended-access states without executing each preceding step.

## Owner approval29October2026

Moamen explicitly approved this connected proposal for implementation (reference commit8e0b667). Earlier pending-review language is historical. Approval applies to the declared proposed experience; simulations and future backlog do not become implemented features, new policy or access authority. Product progress is recorded in the [implementation checkpoint](../../docs/07-handoff/full-experience-foundations-implementation.md).
