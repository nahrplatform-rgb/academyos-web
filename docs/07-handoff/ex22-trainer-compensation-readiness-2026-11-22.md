# EX-22 Trainer attendance, earnings and payout

22 November 2026 · MP-B07 · Approved synthetic workflow

The synthetic workflow adds an Academy Owner record of who actually covered a session. The monthly earning review uses both that record and the effective Trainer contract. Trainers use their own approved statement and can request a correction from a posted line. [Domain coverage](../06-delivery/master-plan-v2/domain-coverage.csv) · [Trainer compensation contract](../02-workflows/trainer-compensation.md)

The saved plan keeps Trainer compensation separate from Family billing and platform revenue. It requires effective contract versions, explicit approval, recoverable original operations and preserved posted history. On 22 November the Owner answered **Approve A–D as recommended** for this first synthetic workflow. This settles the linked D-008, MP-Q09 and approval choices within this scope. [Product decisions](../00-governance/decisions-and-open-questions.md) · [Decision dependencies](../06-delivery/master-plan-v2/decision-dependencies.csv)

## Approved first synthetic workflow

| Decision | Approved rule | Effect on the example |
|---|---|---|
| A · Rate and effective date | Pay per verified completed session. Select terms by the session's local start date in the academy time zone. Round each earning line once to two decimal places, half up. The worked fixture is set to Africa/Cairo, with the new rate effective at the start of 16 November. | The overnight session that starts on 15 November uses the old 100.00 rate. Two later eligible sessions use 120.00 each. |
| B · Attendance and cover | The Academy Owner confirms the Trainer who actually worked. A substitute needs an active appointment in the session's branch and uses their own effective contract. Cancelled sessions and recorded absence earn zero. Unverified coverage waits for review. | The substitute receives 120.00 for the session they covered. Cancellation and absence add zero. |
| C · Review and corrections | The same Academy Owner may prepare and explicitly approve in separate steps. Approval and correction require reasons. A Trainer may request a correction on their own approved line. The Owner posts a linked adjustment while preserving the original lines. Reductions below confirmed payouts wait for separate policy. | The three approved lines total 340.00. An approved 20.00 reduction leaves 320.00 net approved and 120.00 payable after the payout. |
| D · Payout and Trainer access | The Owner records confirmed fictional cash or bank payouts. Bank payouts require a reference. Allow partial payouts and same-original recovery. The Trainer sees their own approved lines, payouts and balance. | A confirmed 200.00 payout leaves 140.00 payable. Other Trainers' statements and internal notes stay outside this view. |

## Worked example in fictional units

| Earning source | Approved result | Hourly comparison |
|---|---:|---:|
| Starts 15 November at 23:30 and ends 16 November at 00:30. Verified under the rate of 100.00. | 100.00 | 100.00 |
| 18 November, 45 minutes. Verified at the new rate of 120.00. | 120.00 | 90.00 |
| 20 November, 60 minutes. Verified as the substitute at their effective rate of 120.00. | 120.00 | 120.00 |
| One cancelled session and one absent Trainer entry. | 0.00 | 0.00 |
| **Approved earnings** | **340.00** | **310.00** |
| **Balance after a confirmed 200.00 payout** | **140.00** | **110.00** |

These amounts are fictional. Paid leave, late-cancellation compensation, varying rates for shortened sessions, Manager delegation, real currencies and transfers require their own decisions. Keep the broader examples in the contract when scoping the first release.

## Source and verification map

- Schedule uses immutable publication events and current publication heads, with dated changes tracked separately. Trainer appointments supply identity and branch eligibility. Player attendance stores marks per player and supplies no evidence of staff attendance. EX-22 adds a separate verified coverage record tied to the exact publication, with the earning identity bound to the stable academy, program and session date. [Publication and Trainer schedule](../../supabase/migrations/20261027210954_i3d_published_trainer_schedule.sql) · [Trainer appointments](../../supabase/migrations/20261025123233_i2c_synthetic_trainer_appointments.sql) · [Player attendance](../../supabase/migrations/20261028024556_i4a_online_attendance.sql)
- Keep the compensation ledger separate from Family billing. Reuse the existing Clerk session and signed database gateway pattern for a scoped request handler. Scope reads and writes to current memberships in PostgreSQL. Prepare a bounded, complete review, recheck source and terms at approval, and post all related rows and the receipt together. The Trainer projection excludes drafts and internal details. [Household billing transaction pattern](../../supabase/migrations/20261121195423_ex21_family_billing.sql) · [Signed gateway](../../apps/web/src/lib/onboarding-gateway.ts)
- PYSA reference `37d8901c` was reviewed read-only. FND-0036 found selection of active contracts without effective dates. FND-0035 found an earning header could survive missing item writes. FND-0037 and FND-0026 found approval paths that differed between action, database, and current membership. FND-0071 and FND-0065 found incomplete overnight interval and dated assignment selection. The relevant earning handlers and Trainer statement projection supplied patterns and negative cases. The underlying evidence is bounded local SQL, injected SDK faults and local signed HTTP. [AcademyOS reference mapping](../06-delivery/master-plan-v2/finance-simplification-and-control.md)
- Run the approved example through the real bilingual components, signed local API and disposable PostgreSQL. Add direct refusal, stale source and two concurrent approval or payout cases. Test a successful payout whose reply is dropped, reload and resolve the same operation, then count ledger and audit rows independently. Rehearse the new migration against a verified backup restore before any authorized hosted application.

## Local verification

- The signed English and Arabic browser workflow covers current Owner and Trainer navigation, verifying actual coverage, effective rates, opening and approving the dated review, the private Trainer statement, a correction request, linked adjustment and partial payout. The assigned and substitute cases use verified same-branch appointments. Cancelled and absent sessions earn zero. Missing coverage blocks preparation and stale or concurrent approval is refused. Trainer, Manager, ended-appointment and foreign-academy refusals preserve the scoped statement. The overnight case uses a stored session spanning midnight. The current Schedule editor cannot create overnight sessions. [Connected test](../../scripts/working-day/test_trainer_compensation.mjs)
- The expected line amounts are 100.00, 120.00 and 120.00. The confirmed 200.00 payout leaves 140.00 due. The linked −20.00 adjustment leaves 320.00 approved and 120.00 due. The recovery cases drop committed preparation, approval and payout replies, reload and resolve the exact original. PostgreSQL shows one operation and one audit event per tested original and one payout. The original three earning lines remain identical after adjustment. Owner reasons and bank references stay outside the Trainer projection.
- Adding Trainer earnings to the navigation exposed a narrow-phone register regression. At 320 pixels the stacked dock intercepted clicks on player details. The shared phone navigation now fits in a row, and the Attendance component test passes in production and development React with its existing English and Arabic assertions. [Attendance regression](../../scripts/attendance/test_ui.mjs)
- The Node 24 production build, lint, types and 119 unit tests passed. The disposable PostgreSQL 17 restore verified the encrypted [21 November backup receipt](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44950313559), replayed the reviewed EX-21 and EX-22 SQL in order, and preserved all 1,065 existing rows across 65 academy tables. The backup had zero Storage objects. EX-22 migration source SHA-256 is `cdf10b5ecfb9ad4b5d746460b56e8185c7c38fb2d6c9303c32fe28ea7ab30aa4`.

## Release status

Candidate `641b7cf4f232bf7a71b7a922ce1463a317fd7d68` is published to [draft PR #1](https://github.com/nahrplatform-rgb/academyos-web/pull/1). [Foundation run 44996260504](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44996260504) passed **58/58** on attempt 1. The connected compensation test explicitly passed in English and Arabic. The [Ready Vercel preview](https://vercel.com/academy-os2/academyos-web/8NUtSBkMbJBm2VrJ6PeKdQ5F3udn) matches the exact commit.

The [fresh encrypted staging backup](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44996315260) was verified at 09:03 Cairo time on 22 November. Its 1,024,440-byte ciphertext matched the trusted workflow receipt at SHA-256 `3b9e4f3827145ff91e82b6bb058646d86ac506cf6d0aba22a27fa3b3f726cd6b`. The local PostgreSQL 17 restore and membership boundary passed. Replaying only the exact candidate's EX-22 migration preserved all **1,137 rows across 69 existing academy tables**, including the EX-21 tables, and added nine compensation tables. This backup held zero Storage objects.

## Staging verification

- Before applying the schema, Vercel showed [staging deployment `dpl_3GeA1xXogEdh5qvFxnxLWA8TqDxu`](https://vercel.com/academy-os2/academyos-web/3GeA1xXogEdh5qvFxnxLWA8TqDxu) already serving exact `641b7cf`. The agent did not promote the deployment. On 22 November the Owner explicitly authorized applying the reviewed migration after the exact candidate passed Foundation.
- Supabase applied reviewed source `20261122063506_ex22_trainer_compensation.sql` as hosted migration `20261122072433`. The before/after counts match for two academies, 26 players, eight memberships and 12 posted EX-21 billing rows. All nine new tables have RLS enabled and deny direct anonymous and authenticated table access. The three public signed-gateway functions permit execution to the authenticated application role and deny anonymous execution. No earnings, payouts or compensation operations had been posted when read back.
- The public English and Arabic staging entries returned HTTP 200. The compensation endpoint refused an anonymous same-origin request with 401 and a foreign-origin request with 403.
- Separate existing Academy Owner and Trainer browser sessions opened their own compensation screens on staging in English and Arabic. The Trainer's attempt to open the Arabic Owner route displayed the access refusal and withheld the Owner attendance panel. The signed-in check covered the empty ledger. Staged earning and payout posting, an approved Trainer statement and working product acceptance remain open. The connected signed fixture and Foundation cover those transaction paths.

EX-22's technical checkpoint passed. Continue to the separate [EX-23 commercial lifecycle decision packet](ex23-platform-commercial-lifecycle-readiness-2026-11-22.md). The larger-roster projection and broader compensation policies remain open. Earlier EX-21 signed-in billing and original-receipt evidence is preserved. [EX-21 staging evidence](ex21-family-billing-readiness-2026-11-21.md)
