# I2b fictional guardian appointment — connected design review

25 October 2026. Policy accepted for narrow synthetic design; connected design review pending. This preview is a **simulation**: no API, authentication, email, database, storage, membership or relationship grant. Refresh resets all in-memory state. Actor, verification and failure controls are explicitly simulation-only.

Build: `node scripts/design/build_i2b_review.mjs`. Serve this folder locally. Uses current actual WorkspaceShell/native Button/Input/Select and app CSS with a local link adapter; [manifest](source-manifest.json) records source hashes. No new dependency or external asset.

Try: Owner selects Alex Demo and `guardian@example.invalid` → explicit narrow appointment checkbox → review exact name/branch scope → simulated confirmation → recipient entry → simulate verified intended email → accept → restricted linked-player view → switch to Owner → end link with a fictional reason → switch back to recipient → denied. Sam Example is a separate player choice, never automatically a sibling link.

Toolbar scenarios: wrong account, unverified identity, no approved link, other-child request, lookup unavailable, expired/revoked/ended, failed delivery and response-loss reconciliation. EN/AR switch preserves the connected model and the shell owns RTL direction. No real guardian data/documents and no proposed future schedule/balance presented as current product.

[Accepted policy](../../docs/06-delivery/i2b-guardian-access-decisions.md) and [data/security/performance contract](../../docs/06-delivery/i2b-guardian-design-contract.md). Actual guardian implementation remains dependent on connected design review and separate recipient/grant authorization.

## Prototype verification

Prototype TypeScript and source hashes passed. [Manual browser receipt](evidence/browser-review.json) records the connected simulation checks and limitations. [Linked player](evidence/linked-player-en.png), [Arabic phone review](evidence/owner-review-ar-phone.png), [ended-link denial](evidence/ended-link-ar-phone.png). The requested 360px viewport measured400px with no horizontal overflow; exact360px, real devices and screen readers are not claimed. No browser errors were observed at the check. No actual permission, delivery or persistence behavior was tested by this prototype.
