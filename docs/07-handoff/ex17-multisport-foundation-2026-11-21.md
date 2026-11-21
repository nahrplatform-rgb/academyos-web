# EX-17 multisport foundation

The Owner approved one connected setup-to-program workflow for football and swimming. This checkpoint preserves one Player profile per academy. Sport enrollment, sport-scoped member IDs, sport-specific Player fields, resource booking and delegated administration remain in their existing follow-up scopes.

In completed academy setup, the Owner can enable either supported sport and reopen the enabled list. Existing initial sports with matching English and Arabic labels retain their IDs and acquire the matching catalog key. Custom labels remain available as the initial sport. Additive enablement is serialized with setup writes and uses the existing operation receipt and audit. It keeps completed setup and its version so adding a sport does not invalidate a reviewed or preparing program.

New programs offer enabled sports and default to the initial sport. The signed review binds the chosen sport, and reopening reads the persisted program assignment. Legacy requests and receipts retain their original definition and default. Owner Calendar and prepared Calendar read the program sport. Publication snapshots both labels, which feed Trainer Schedule, Attendance and QR. The Calendar revision includes the saved sport field. Attendance and QR use the localized publication label to identify the session.

The PYSA scheduling reference connects real dates with programs and provides sport alongside branch and trainer on dated rows. This slice adopts program-specific sport context while retaining AcademyOS authority and dated-operation rules. The reference is source evidence. [Scheduling reference](../03-design/pysa-scheduling-reference-review.md)

## Local evidence

- The migration upgrade test creates a football draft and signed receipt before migration, enables swimming afterward, replays the original create, and prepares both programs. It verifies saved bilingual labels, shared Player roster identity, Calendar and signed prepared transfer, Trainer Schedule, Owner Attendance and QR session projections. A second synthetic academy is refused foreign reads and writes. A football review also fails when submitted with a swimming selection. [Database walkthrough](../../scripts/workspace-download/test_multisport.py)
- The actual React setup and Program harnesses exercise enable/reopen and select/review/create/reopen in English and Arabic with synthetic identity and transport. PostgreSQL separately verifies the authoritative writes and reads. A signed-in hosted walkthrough remains a release follow-up.
- Local production build, lint, type checking, 119 unit tests and the 24-case existing workspace transfer suite passed. The linked PR carries exact-candidate CI evidence. [PR](https://github.com/nahrplatform-rgb/academyos-web/pull/1)

The Owner controls staging promotion. The verified staging source and migration are recorded below. The signed-in bilingual walkthrough must confirm both sports in one synthetic academy and refusal of foreign-academy access. EX-17 staging verification remains separate from the current EX-20 development batch.

## Candidate and next workflow

Foundation run 44854580720 passed all 55 steps on attempt 2 for `57a715972cc97d681ad357efa94b91a2db29dce4`. Attempt 1 timed out in the existing Arabic Players private-profile browser case. The same source passed that step on rerun. Vercel confirmed the exact preview was Ready for the same commit. The local and CI checkpoint passed. The staging rollout is recorded below. [Foundation](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44854580720) · [Vercel preview](https://vercel.com/academy-os2/academyos-web/HY5kaVy98Mc4p5E8zLWLTqBEVp5A)

EX-18 is now the primary development workflow. The initial Schedule baseline passed whole-program atomic activation and overlap refusal, publication/withdrawal/republish with immutable snapshots, and concurrent publication versus plan edit. The next connected case combines the 40-date program with simultaneous football and swimming, Calendar and role discovery, dated move and cancellation, and original-operation recovery.

The inherited Schedule database suite subsequently passed all 79 cases, including all 11 session-change cases. This baseline covers existing planning, publication and dated-change contracts. The combined bilingual multisport Schedule case remains open. Staging still served `7454144` when checked against the candidate receipt.

## Staging rollout

Vercel confirms the staging hostname serves the checked combined candidate `21aa73ef2d956fb1b42299ad2f6dedc66a43d04d`. Foundation passed all 55 checks on that source. [Live deployment](https://vercel.com/academy-os2/academyos-web/fndeNPoTjnRK7YYsDcvy3kWzqvim) · [Foundation](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44872554943)

The Owner authorized the staging migration. Supabase applied the repository SQL from `20261121014923_ex17_multisport_foundation.sql` and recorded it as `20261121123317` under `ex17_multisport_foundation`. Schema readback confirmed the catalog column and enabled-sports function. Existing sport and setup counts stayed at two each. The existing synthetic rows have custom labels (`Synthetic Football` / `كرة قدم تجريبية` and `Swimming` / `سباحه`), so neither maps to a canonical catalog key. Those rows remain intact as custom initial sports. Create a separate synthetic academy with canonical football and swimming for the signed-in walkthrough, and verify cross-academy refusal.

The Owner enabled catalog football in the custom football academy and catalog swimming in the custom swimming academy. Staging database readback confirmed both enablements. The original swimming sport still has one program and shares its English label with catalog swimming. The local program picker now identifies the original and catalog entries when their labels match in either language and keeps the original academy sport as the default. The English and Arabic program browser checks passed in both React modes, along with type checking, lint and experience review freshness. This picker change is local. The complete signed-in multisport walkthrough remains open.
