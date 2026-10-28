# I4b — Guardian training and attendance connected preview

[Policy explicitly accepted for design](../../docs/06-delivery/i4b-guardian-training-decisions.md), [design contract](../../docs/06-delivery/i4b-guardian-training-design-contract.md), [security/retrieval preparation](../../docs/04-engineering/i4b-guardian-training-preparation.md). Separate connected-design approval is pending.

Open http://127.0.0.1:3219/. Build `node scripts/design/build_i4b_review.mjs`; serve `python3 scripts/design/serve_i4b_review.py`; check `node scripts/design/test_i4b_review.mjs` using existing Node24 dependencies. Shared AcademyOS shell/panes/controls/styles are bundled; no new dependency.

This is a fictional local simulation: no login, API, database, email or hosted persistence. Reset/reload clears state. Review controls outside the shell are not product actions or access enforcement.

Try next session → own corrected attendance → Back → second same-day session/Unmarked. Page through all four dates. Switch List/Week calendar, select a day and Show full week. Previous week opens a retained session before the fictional link acceptance. Switch to Taylor's empty schedule. Try loading/read failure/retry, obsolete response after player switch, withdrawal and ending a link while open. Check EN/AR and phone Back/desktop inspector.

The scenario clock is1November2026 17:00 Africa/Cairo. Two-row demonstration pages exercise coverage; real proposed retrieval is25 plus sentinel/32KiB. No program/history duration limit follows from weekly navigation. Actual attended sessions remain protected from withdrawal; the preview's withdrawal control is solely a read-boundary scenario.

[Checks](evidence/checks.json) and screenshots document local simulated behavior, not server authorization, network race handling, database results, physical-device tests or measured hosted budgets.
