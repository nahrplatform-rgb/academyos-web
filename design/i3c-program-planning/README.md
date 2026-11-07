# I3c all-or-none program planning — connected design preview

27 October2026. Owner explicitly selected **Require all dates to save together**. [Revised direction](../../docs/06-delivery/i3c-program-planning-decisions.md), [engineering/design contract](../../docs/06-delivery/i3c-program-planning-design-contract.md). Connected-design approval is pending. No product source, database, API, email, real account, provider or deployed business behavior is changed by this simulation.

Open **http://127.0.0.1:3211/**. Rebuild with Node24 `node scripts/design/build_i3c_review.mjs`; serve `python3 scripts/design/serve_i3c_review.py`; test `node scripts/design/test_i3c_review.mjs`.

Try:

1. Plan the program; keep the full three-month40-date period or select a narrower explicit range/weekdays.
2. Set shared capacity/optional Trainer/fictional players. Enable different choices by weekday; expand Tuesday and choose its separate plan.
3. Review every date: the existing1 November plan is preserved,39 currently unplanned dates are proposed. Browse all pages/statuses. No implicit overwrite or dynamic inheritance.
4. Confirm the exact39 changes; prepare, then Save39 dates together. Preparation is0 saved until the simulated final activation.
5. View saved dates; edit1 November individually. Other dates remain unchanged. A later program preview preserves every now-saved date and offers no empty apply.
6. Try the conflict scenario: one blocked date prevents the entire save. No ready-subset shortcut. Interrupted preparation can resume at12 prepared/0 saved; cancel leaves the initial plan intact.
7. Try stale-date and ended-Trainer scenarios at final save: no changes become effective. Lost-reply scenarios reconcile either all committed or none before another operation.
8. Switch EN/AR and use phone Back/desktop inspector. Reset/reload intentionally clears the in-memory demonstration.

All identities/people/dates are fictional. The same static fictional candidate options are available in this design; real bounded search/current eligibility remain implementation work. Date pagination10 here demonstrates review; proposed production retrieval contract is25+sentinel, subject to measured feasibility. No synthetic scenario control is a product permission or operation. The prototype's in-memory assignment of all records is **not evidence** of transactional SQL, recovery across reload, current authorization or scale feasibility.

## Verification

[Local automated checks](evidence/checks.json) cover shared and weekday-specific planning, preserved existing date,39-date simulated save, independent date edit, all-preserved no action, conflict blocking the entire save, interrupted private preparation/cancel, stale/ended final checks, lost all/none response reconciliation, unknown navigation guard, EN/AR320/360/926/1440 and reset. No page errors or external requests observed. Standalone TypeScript passed. Source hashes are in [manifest](source-manifest.json).

Screenshots: [dated review](evidence/review-en-desktop.png), [blocked whole save](evidence/blocked-en-desktop.png), [EN desktop preparation](evidence/prepare-en-1440.png), [AR phone preparation](evidence/prepare-ar-360.png). Local browser control reported disabled, so the real interactive in-app tab was not driven; automated local Chromium and opened review URL are distinct evidence. Owner visual review, physical devices/accessibility, actual database atomic activation, hosted performance/security and working acceptance remain pending.
