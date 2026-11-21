# EX-18 Schedule verification

The connected disposable PostgreSQL case exercises the EX-17 migration and creates a 40-date football program plus a simultaneous swimming session in the same academy. Separate trainers and rosters permit concurrent sessions. Assigning the football player to the swimming session at the same time is refused. The program-wide save preserves an existing dated capacity of four and its roster.

The case checks publication from the Owner Calendar, each assigned Trainer's schedule and the opted-in Guardian's Calendar. It withdraws one date, moves it while preserving its original key and roster, reconciles and replays the original operation, rejects a stale replacement, republishes at the effective date, then withdraws and cancels. The Owner retains both history entries and the canceled Calendar row. Trainer visibility follows the published head. [Connected test](../../scripts/workspace-download/test_schedule.py)

Local Chromium suites passed for whole-program planning, dated planning, publication and Trainer schedule, session changes, Guardian training, and role Calendar views. They exercise English and Arabic rendering and controlled transport failures, including lost-reply recovery. The database case checks live signed database calls and both sport labels. The browser suites use synthetic transport. The full bilingual browser walkthrough using one live disposable database and connected routes remains open.

Attendance and QR component suites also passed locally as baseline checks. Their complete workflow checkpoints follow EX-18. The verified EX-17 candidate remains `57a7159`. Its staging migration, Owner promotion and signed-in walkthrough are a separate release follow-up.
