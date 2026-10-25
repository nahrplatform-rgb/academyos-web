# I2c fictional trainer entry — connected design review

25 October2026. Narrow policy accepted for design preparation; this connected design awaits review. **Simulation only:** no authentication, API, database, email, account/membership/branch grant, browser storage or provider connection. Refresh resets the in-memory model. Actor/verification/scenario controls are explicitly test fixtures, never product authority.

Build with `node scripts/design/build_i2c_review.mjs`; serve this directory locally. Reuses actual WorkspaceShell, Button, Input, Select and app CSS, with a local Next Link adapter. [Source manifest](source-manifest.json) records hashes. No new dependency, external image or fake OS controls.

Try Owner → fictional name and `trainer@example.invalid` → explicit existing-branch Trainer approval → review → confirm → switch simulated actor to Trainer → unverified state → check simulated verification → review/accept → own staff name/Trainer role/branch only → Owner → end/review/reason → Trainer denied. Other role/academy authority is not revoked by this model. No trainer sessions/rosters/attendance are represented as implemented.

Use scenarios for delivery failure and same-invitation retry, committed response loss and original reconciliation, duplicate appointment, failed lookup (not empty), wrong account/branch, suspended membership, expired/revoked/ended and wrong-role Owner command. EN/AR changes preserve drafts/state. Phone/emulated rendering checks and the actual model's limitations are recorded separately under evidence. They cannot prove actual permissions or persistence.

[Accepted policy](../../docs/06-delivery/i2c-trainer-entry-decisions.md), [data/security/performance contract](../../docs/06-delivery/i2c-trainer-design-contract.md), [existing verification board](../../docs/07-handoff/people-verification-closure-board.md). Actual implementation depends on connected design review; actual recipients/grants require their own authorization.

[Manual browser evidence and limitations](evidence/manual-review.md). Screenshots: [Owner review EN](evidence/owner-review-en.png), [Trainer profile EN](evidence/trainer-profile-en.png), [ended denial EN](evidence/trainer-ended-en.png), [Arabic review at observed 433px](evidence/owner-review-ar-phone.png).
