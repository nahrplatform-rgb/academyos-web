# AcademyOS connected experience proposal

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
