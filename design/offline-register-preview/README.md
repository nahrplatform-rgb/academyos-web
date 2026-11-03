# Owner offline-register review — proposed experience

3 November 2026. **Policy and connected write design approved for implementation3November2026.** This is a separate, fictional changed-state preview. It does not replace the factual current-app HTML or the previously approved read/preparation preview.

Open the self-contained [HTML](index.html), or start `node scripts/design/serve_offline_register_preview.mjs` and visit [the loopback preview](http://127.0.0.1:3237/design/offline-register-preview/index.html). The server exposes only this HTML, GET/HEAD and a blank favicon; it does not serve repository files. Port3237 is a different isolated origin from the approved read preview on3235.

## Try the connected flow

1. The fictional complete18-player register starts disconnected, with one previously recorded mark. Select Present/Absent for several unmarked players. The gold rows and unsaved count change without saving anything.
2. Review the exact selected players → **Save on this device**. The local projection and original immutable save packet commit in one real IndexedDB transaction. The result says **Saved on this device · Awaiting sync**, not server recorded.
3. Refresh or close/reopen this preview at the same origin. Open Saved work. The original ID, selected marks and base versions remain. Loading the HTML after a closed-browser restart still requires the preview server; offline cold launch is not implemented.
4. Click **Reconnect**. A fictional server rechecks current access, publication, roster/mark versions and the existing recording deadline. Success records all selected marks together. Unmarked is never inferred as Absent.
5. Expand Review controls. Reset the fictional demonstration between independent cases. Before reconnecting, try another device's mark, changed roster, withdrawal, deadline expiry, ended access, lost reply, no receipt, mismatched receipt or failed receipt storage. No server/API is contacted.
6. With a pending save, Sign out or simulate30-day cleanup. Downloads are removed but the original saved work remains quarantined. A different fictional account sees no names or saved choices. Return as the original verified fictional account → Recover original saved work. These buttons simulate identity verification; they do not create accounts or grants.

The actual browser transaction and process-restart behaviour are real. **All records are fictional and unencrypted. Account verification, server checks and protected recovery are simulations, not confidentiality or security proof.** Do not enter real names, child/customer data, tokens or credentials. There is no inactivity timer,24-hour read cutoff, invented late-upload authority, private runtime outbox, general command queue or closed-app synchronization promise.

## Fidelity and evidence

The accepted Charcoal spectrum anchors, semantic attendance colours and EN/AR language remain. Phone uses one task; wide desktop adds optional explanatory context. Compared with the earlier read preview, this artifact focuses on a register-level save and its recovery; it does not redesign unrelated modules or change existing online commands. See [the approved design and traceability packet](../../docs/06-delivery/offline-register-decision-design.md).

Build with `node scripts/design/build_offline_register_preview.mjs`; verify byte freshness with the same command plus `--check`. Run `node scripts/design/test_offline_register_preview.mjs`. Use the repository Node24 toolchain. [Manifest](manifest.json) hashes all five source inputs and the generated HTML; [checks](evidence/checks.json) record the final source-specific synthetic results and limits. Browser screenshots and temporary profiles stay outside Git. Current app source/capture inputs are unchanged; factual review freshness is checked independently.

Do not import this adapter into the working application: it deliberately stores fictional plaintext, models a server in separate browser stores and uses simulation account controls. Private key custody, migration/eviction recovery, exact retained fields, authenticated sync/discovery endpoints and independent security remain separate readiness gates.
