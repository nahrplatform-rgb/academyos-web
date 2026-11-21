# EX-17 multisport foundation

The Owner approved one connected setup-to-program workflow for football and swimming. This checkpoint preserves one Player profile per academy. Sport enrollment, sport-scoped member IDs, sport-specific Player fields, resource booking and delegated administration remain in their existing follow-up scopes.

In completed academy setup, the Owner can enable either supported sport and reopen the enabled list. Existing initial sports with matching English and Arabic labels retain their IDs and acquire the matching catalog key. Custom labels remain available as the initial sport. Additive enablement is serialized with setup writes and uses the existing operation receipt and audit. It keeps completed setup and its version so adding a sport does not invalidate a reviewed or preparing program.

New programs offer enabled sports and default to the initial sport. The signed review binds the chosen sport, and reopening reads the persisted program assignment. Legacy requests and receipts retain their original definition and default. Owner Calendar and prepared Calendar read the program sport. Publication snapshots both labels, which feed Trainer Schedule, Attendance and QR. The Calendar revision includes the saved sport field. Attendance and QR use the localized publication label to identify the session.

The PYSA scheduling reference connects real dates with programs and provides sport alongside branch and trainer on dated rows. This slice adopts program-specific sport context while retaining AcademyOS authority and dated-operation rules. The reference is source evidence. [Scheduling reference](../03-design/pysa-scheduling-reference-review.md)

## Local evidence

- The migration upgrade test creates a football draft and signed receipt before migration, enables swimming afterward, replays the original create, and prepares both programs. It verifies saved bilingual labels, shared Player roster identity, Calendar and signed prepared transfer, Trainer Schedule, Owner Attendance and QR session projections. A second synthetic academy is refused foreign reads and writes. A football review also fails when submitted with a swimming selection. [Database walkthrough](../../scripts/workspace-download/test_multisport.py)
- The actual React setup and Program harnesses exercise enable/reopen and select/review/create/reopen in English and Arabic with synthetic identity and transport. PostgreSQL separately verifies the authoritative writes and reads. A signed-in hosted walkthrough remains a release follow-up.
- Local production build, lint, type checking, 119 unit tests and the 24-case existing workspace transfer suite passed. The linked PR carries exact-candidate CI evidence. [PR](https://github.com/nahrplatform-rgb/academyos-web/pull/1)

The Owner handles staging promotion. Rollout requires the additive migration on staging before the signed-in walkthrough. Confirm the applied migration, exact served commit, both sports in one synthetic academy and the second academy's access refusals. The next development workflow is EX-18 Schedule after the scoped EX-17 gate, followed by Attendance and QR in tracker order.
