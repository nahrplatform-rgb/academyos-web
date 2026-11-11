# Attendance redesign — connected design review

Open `index.html` directly, or serve this directory locally. Charcoal spectrum starts in dark mode; optional light and EN/AR controls are in the review toolbar.

This is a proposed fictional in-memory simulation. It is separate from the current-source app-experience review and from the deployed application. Reload resets it. Review actors and scenarios simulate views; they do not switch real permissions. There are no account, database, camera or email operations.

## Review path

1. Open attendance from the session.
2. Select Present/Absent for several unmarked players. Search/filter without losing choices.
3. Review the exact changed players; keep editing or save the selected marks together.
4. Use **Finish simulated response**, outside the app frame, to resolve the simulated request.
5. Open a saved mark's Details. As Trainer, request a correction with a reason. Switch the review actor to the different-account Owner to review it. Existing marks use correction, not direct Trainer overwrite.
6. Try the concurrent-mark, expired-window, lost-response and confirmed-save/read-failure scenarios. Unknown results require checking the original save before replacement.
7. Compare English/Arabic, phone/desktop, optional light mode, empty/loading/error and revoked-access states.

Owner accepted all-or-nothing register saving **for design** on 29 October 2026. Connected-design approval remains pending. No new access or product implementation is authorized by this preview.

## Evidence and limits

Run from the repository root with the repository's Node 24 environment:

```sh
node design/attendance-refresh/test.mjs
```

`evidence/checks.json` records the latest simulation checks; four EN/AR screenshots show 390px and 1440px widths. Tests also check 320/360/926px overflow, focus return, retained choices, changed-only saving and recovery scenarios. The roster fixture has 18 players; the large scenario loads 50 of 120 at a time.

These are local simulation checks, not live permission, atomic database, server-clock, screen-reader, physical-device, performance/load, cost or independent security evidence. Future batch-size limits and transaction design require feasibility review. Correction text is held only in memory while editing; reload clears it. This preview covers attendance, not a finished redesign of every module.

Policy, traceability, PYSA evidence and future gates: [design contract](../../docs/06-delivery/attendance-refresh-design-contract.md). Selected palette reference: [theme explorer](../palette-sample/theme-explorer.html#theme=spectrum&mode=dark).
