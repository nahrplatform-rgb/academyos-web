# I4a — online attendance connected design

28 October2026. [Policy accepted for design](../../docs/06-delivery/i4a-online-attendance-decisions.md); [connected design](../../docs/06-delivery/i4a-online-attendance-design-contract.md) awaiting Owner review. [Engineering/security preparation](../../docs/04-engineering/i4a-online-attendance-preparation.md). PYSA source/audit references and intentional initial differences are recorded in the decision packet.

Open http://127.0.0.1:3217/. Build `node scripts/design/build_i4a_review.mjs`, serve `python3 scripts/design/serve_i4a_review.py`, check `node scripts/design/test_i4a_review.mjs` using existing Node24 dependencies. Strict TypeScript check runs directly against `review.tsx` with bundler module resolution and react-jsx.

This is a fictional local simulation. No login, API, database, email or hosted persistence. Reload/reset clears it. Review actor/scenario controls are outside the product shell; they do not implement permissions.

Try:
1. Open attendance → Alex Demo → Record attendance → Present/Absent → Review → acknowledge → Confirm → Finish simulated response. Reopen and inspect history. Browse the next roster page; coverage includes all four fictional players, not only the visible two.
2. Switch review actor to Academy Owner → Alex → Correct saved mark → reason → review/confirm. Inspect retained before/after history. Review session protection to see why schedule/roster/publication changes are blocked after attendance.
3. Before/closed-window, canceled, loading, unavailable, empty and denied scenarios. None means everyone is absent.
4. Concurrent change, committed/lost reply, not-committed/lost reply and confirmed-save/read-failure. Original-operation reconciliation precedes a replacement; no duplicate saved event.
5. EN/AR, phone Back/roster/reopen and desktop inspector. No operating-system traffic lights, family/finance, QR, offline or implicit completion controls.

[Checks](evidence/checks.json) and EN/AR phone/desktop screenshots show local simulated outcomes only. They do not prove server permissions, database transactions, current time-window enforcement, hosted recovery, physical-device accessibility or performance budgets.
