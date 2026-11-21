# I3d — connected publication and Trainer schedule design

27 October2026. Policy accepted **for design preparation only**. [Accepted direction](../../docs/06-delivery/i3d-trainer-schedule-decisions.md), [connected design contract](../../docs/06-delivery/i3d-trainer-schedule-design-contract.md), [security/retrieval preparation](../../docs/04-engineering/i3d-trainer-schedule-preparation.md). Separate connected-design approval is pending. No product source, identity, API, database, email, deployment or actual access change.

Open **http://127.0.0.1:3213/**. Build with Node24 `node scripts/design/build_i3d_review.mjs`; serve `python3 scripts/design/serve_i3d_review.py`; test `node scripts/design/test_i3d_review.mjs`.

Try this connected path:

1. Owner → Publish planned dates → whole period or explicit range/weekdays → review all four date pages and exact assigned audience.
2. Confirm review → prepare → resume remaining preparation → Publish40 dates together. Before the final save, the simulation keeps zero published dates.
3. Use the **Simulated account** control outside the app to try Jordan Demo → Today → open the dated roster. Upcoming dates shows only39 assigned dates, with real local pagination.
4. Switch to Casey Demo → Upcoming dates →3November: this fictional Trainer is assigned to only one date and still discovers it. Only program/date/time/branch/sport/capacity and fictional display names are shown.
5. Owner →1November → published edit lock → withdraw this date → confirm/prepare/withdraw. Jordan's Today becomes empty. Owner can edit the now-private capacity, review and publish again.
6. While a Trainer detail is open, **Simulate appointment ending** clears private details. This is a review control, not a staff-management action.
7. Try missing active Trainer, conflict, stale plan, already-started date, interrupted preparation/cancel, all-or-none lost reply, confirmed-save/read-failure, loading, list/roster failure, denied role and already-published-preservation scenarios.
8. Try EN/AR and phone Back → list → reopen. Reset/reload clears the whole in-memory demonstration. The fixed demo clock is1November2026 at14:00 Africa/Cairo, explicitly outside product controls.

The40 dates, people, assignments, state changes, reconciliation fence and published roster are fictional local state. They prove no real authorization, transaction atomicity, durable reload recovery, provider behavior or hosted speed.10-row design review pages illustrate bounded review; implementation proposal is25+sentinel, not a business duration/roster limit. Simulation role switching is not product role selection or permission authority.

## Local evidence

[Automated checks](evidence/checks.json) pass the connected behaviors above, Owner/Trainer EN/AR320/360/926/1440, no observed page errors or external requests, and reset. Standalone TypeScript passed. Account changes now reset the simulated Today/pagination/selection context; this corrected an initial test failure caused by carrying the previous account's Upcoming tab. No assertions were removed. Phone caption width was corrected in preview-only CSS. [Source hashes](source-manifest.json).

[Owner desktop](evidence/owner-en-1440.png), [Owner Arabic phone](evidence/owner-ar-360.png), [Trainer desktop](evidence/trainer-en-1440.png), [Trainer Arabic phone](evidence/trainer-ar-360.png). Actual in-app review browser also completed40-date preparation/publication and opened dated-only Casey's restricted roster: [browser capture](evidence/browser-trainer.jpg). Shared compact-blue shell/panes/native controls reused; no imitation macOS window controls. Physical-device/screen-reader, real API/database/security/performance evidence and design approval remain separate/pending.
