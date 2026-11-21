# I3e — move or cancel one future occurrence

28 October2026. Policy accepted for design; **connected-design approval pending**. [Accepted policy](../../docs/06-delivery/i3e-session-changes-decisions.md), [design contract](../../docs/06-delivery/i3e-session-changes-design-contract.md), [security/retrieval preparation](../../docs/04-engineering/i3e-session-changes-preparation.md), [PYSA behavior preservation](../../docs/03-design/pysa-behavior-preservation.md).

Open http://127.0.0.1:3215/. Build `node scripts/design/build_i3e_review.mjs`, serve `python3 scripts/design/serve_i3e_review.py`, test `node scripts/design/test_i3e_review.mjs` with existing Node24 dependencies. No login/API/database/email/provider or hosted persistence; reset/reload clears everything. Existing shared blue shell/panes/native inputs reused; no new dependency or operating-system window decoration.

Try:
1. Open occurrence1November → Move this date → choose2November or1February2027 (outside the original sample period), enter a reason → Review exact change → confirm. Original identity/roster/Trainer/capacity retained; result stays private. Back → week view versus all occurrences → reopen moved history;3November remains unchanged.
2. Cancel one occurrence with a reason → review effect → confirm → reopen canceled history and retained names. No delete/automatic replacement or reinstatement control.
3. Published scenario → date → review/confirm simulated existing withdrawal → then move/cancel. Withdrawal alone does not cancel.
4. Occupied same-program date3November, reversed/overnight times, conflict/DST/query failure/inactive Trainer/started scenarios block review/save. These are labeled scenario examples, not actual server/timezone validation proof.
5. Stale final confirmation; committed/lost reply versus did-not-commit/fence; confirmed save/failed read; date list/detail failures; denied role; loading. Unknown state blocks new navigation and scenario changes until original reconciliation.
6. EN/AR, phone Back/reopen, keyboard native fields and required confirmation. Fixed fictional clock28October2026 noon Africa/Cairo. Two sample occurrences demonstrate behavior; bounded production25-row/roster/history pages are specified in the contract, not claimed as implemented by this tiny fixture.

[Automated design checks](evidence/checks.json), EN/AR [desktop](evidence/review-en-1440.png) and [phone](evidence/review-ar-360.png). Checks and strict TypeScript passed. This proves local simulated transitions and layout only, not authoritative identity, SQL transactions, DST conversion, conflict queries, permissions, hosted recovery or performance.
