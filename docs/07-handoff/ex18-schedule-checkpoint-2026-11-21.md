# EX-18 Schedule verification

The connected disposable PostgreSQL cases exercise the EX-17 migration and create a 40-date football program plus a simultaneous swimming session in the same academy. Separate trainers and rosters permit concurrent sessions. Assigning the football player to the swimming session at the same time is refused. The program-wide save preserves an existing dated capacity of four and its roster.

One case checks publication from the Owner Calendar, each assigned Trainer's schedule and the opted-in Guardian's Calendar. It withdraws one date, moves it while preserving its original key and roster, reconciles and replays the original operation, rejects a stale replacement, republishes at the effective date, then withdraws and cancels. The Owner retains both history entries and the canceled Calendar row. Trainer visibility follows the published head. The companion case marks attendance on the football session, approves an Owner correction, rejects a QR scan that conflicts with the canonical absence, then captures the swimming session through QR and confirms its Attendance readback. [Connected tests](../../scripts/workspace-download/test_schedule.py)

Local Chromium suites passed for whole-program planning, dated planning, publication and Trainer schedule, session changes, Guardian training, and role Calendar views. They exercise English and Arabic rendering and controlled transport failures, including lost-reply recovery. The database case checks live signed database calls and both sport labels. The browser suites use synthetic transport.

The Chromium check uses the populated disposable database through app request parsers and signed database calls. In both locales it saves the full program plan, publishes its 40 dates, verifies simultaneous football/swimming labels and Trainer/Guardian visibility, withdraws the selected date, exercises Calendar and the dated page, loses the committed move reply, reconciles the same operation after reload, cancels it and reopens Calendar to verify the canceled state. This uses a fictional identity and a local HTTP adapter. [Browser case](../../scripts/workspace-download/test_schedule_browser.mjs)

Attendance and QR component suites also passed locally as baseline checks. Their complete workflow checkpoints follow EX-18. The verified EX-17 candidate remains `57a7159`. Its staging migration, Owner promotion and signed-in walkthrough are a separate release follow-up.

The publication overview now uses the program's saved sport. The bilingual regression uses a swimming program in a football setup. Local production build, refreshed experience review, workspace transport, and normal Attendance regression passed. Foundation passed on `e769c48` for the connected database case before the later browser case and label fix. Vercel still resolved the staging hostname to `7454144` when checked. [Foundation](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44860756292)

## Release evidence

The combined Schedule, Attendance and QR candidate `21aa73e` passed all 55 Foundation steps. [Foundation run](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44872554943) Staging promotion remains Owner-controlled. The previously verified EX-17 candidate and its staging follow-up remain tracked separately.
