# EX-12 read-only role preflight — 4 November 2026

**Executed checkpoint4November:** the Owner completed iCloud login and explicitly authorized the exact transfer/cleanup. It committed with one audit and preserved all operating/history fingerprints. Gmail is Platform-only; iCloud is Owner in A/B, with Trainer/Guardian ended. Both isolated sessions and reciprocal denials were checked. [Current result and limitations](../07-handoff/role-first-offline-sequence-2026-11-04.md). Earlier pending/unexecuted paragraphs below are historical.

**Execution follow-up4November:** [Role-first/offline checkpoint](role-first-offline-sequence-2026-11-04.md) records fresh matching role reads, separate Gmail Platform/iCloud Safari sign-in preparation and a tested exact operator-only A ownership/unused Guardian cleanup transaction. No product transfer endpoint is introduced; actual new access still needs the exact Owner authorization and pending-work check. The earlier RS-C04 hold is now a prepared operation, not an executed transfer.

Supports EX-07. Implements the inspection part of the [dedicated-role plan](../06-delivery/staging-role-separation-plan.md), not the account changes. All hosted SQL in this checkpoint was SELECT-only against `academyos-staging`, project `snpphkenmvmhpjstbeul`. No credentials, token hashes, private operation bodies or child/customer payloads were retrieved. The current Gmail menu and workspace chooser were read through the normal signed-in staging UI; no session was exported.

## Current observations

| Target | Current evidence | Difference from target |
|---|---|---|
| `nahr.platform@gmail.com` | Current UI email and displayed subject `user_3L0kOSQNQmbTetNTefF6gqkNF64` agree with the database. One active Platform grant; active Owner membership `889717c1-c317-4544-8aad-dfb48091c9e3` in academy A. Chooser offers both Platform and Academy. | Still combined; not Platform-only. |
| `moamen_ghareeb@icloud.com` | Accepted B invitation maps this recipient to `user_3L5mZMvNN95teSpCPM233gzC06S`; current DB has active Owner membership `67b04312-8952-4ebe-bf59-a02f0b7d93ea` in B and active Guardian membership `e9a0266f-78cb-4bf4-8e17-4e778b3f75ce` in A. Trainer membership `bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0` is ended. | Extra Guardian context remains. Current provider email/session has not been independently reverified; historical acceptance is not a fresh login. |

Academy A is `b2c7920d-d467-4e9f-9a68-809ac627399e` / AcademyOS M1 Synthetic Academy; B is `c8a4045a-a636-4bad-86f3-68f2036666f6` / AcademyOS M1 Isolation Academy B. Both have completed initial setup and **exactly one active Owner**. Two identities, four memberships, two academies and one Platform grant were observed. Both original Owner invitations are accepted, generation1/provider accepted; this does not verify current inbox placement.

The single A Guardian link `3eec2f21-b0d1-4cf7-89cd-84fd829f69c3` and the single Trainer assignment are ended. An active Guardian membership with an ended link is not active linked-player access; it can still create an unwanted role context in the chooser. Do not restore a link/assignment to fill redesigned screens.

Retained onboarding receipt counts are12 for the Gmail subject and4 for iCloud. Audit events include96 and12 respectively, plus historical operator/worker events. These are limited current reference counts, not a full cross-domain integrity fingerprint. No hosted device/register-journal/key-custody table matched the scoped metadata query. This does **not** establish that browsers contain no unsent edits or original-operation locators. Client pending work, all provider sessions and complete cross-domain receipts remain uninspected; do not delete/reset them.

## Concrete cleanup list — prepared, not authorized or executed

| Item | Current → intended | Supported path / remaining dependency | Safety and recovery |
|---|---|---|---|
| RS-C01 | Retain Gmail's existing active Platform grant | No change required. | Never revoke/recreate it merely for a test; preserve audit history. |
| RS-C02 | Retain iCloud's existing active B Owner membership | No grant or invitation required to use B for current permitted Academy UI work. Fresh independent browser login still needed for positive session proof. | Preserve B setup/data/actor IDs and sole Owner. No email-based automatic authority. |
| RS-C03 | End only iCloud's extra active A Guardian membership `e9a0266f-78cb-4bf4-8e17-4e778b3f75ce` | Prepare an exact compare-and-set audited operator maintenance operation using the existing reviewed membership-maintenance pattern. The public Guardian end-link command is not a membership-ending command and the link is already ended; do not pretend it performs this change. Requires the concrete operational authorization and pending-work check before execution. | No link/profile/receipt deletion; transaction abort on any subject/academy/role/status mismatch. Restoration would require separately authorized access, not an assumed rollback grant. |
| RS-C04 | Gmail's A Owner membership → no academy membership | **Hold.** Gmail is A's sole Owner. No supported product Owner-transfer/archive flow was found in the reviewed onboarding contracts. Determine an authorized supported ownership/fixture disposition before preparing a real transfer or ending the membership. | Do not leave A ownerless, rewrite an accepted invitation/redeemed actor, purge records or invent a transfer endpoint. Existing access remains until that separate operation is concrete and authorized. |
| RS-C05 | Ended iCloud Trainer membership/link/assignment history | No change. | Do not reactivate, purge or rewrite historic authors/reviewers. |
| RS-C06 | Separate signed-in test contexts | Use the Gmail session for Platform tasks and a separate verified iCloud profile/browser for B. No cookies/token copying or account creation. | Current tree exposes one IAB staging session, not proof of two independent profiles. Do not sign out an existing session or inspect unrelated browser data merely to simulate separation. |

No executable transfer or broad purge is generated. The old sole-Owner membership cannot be removed by a presentation change. Exact recovery/authority/pending-work checks and any new account operation stay separate from the deferred external security review. This limitation does not stop authorized independent Operations implementation.

## Case disposition

RS-01/RS-02 target-only navigation is not passed: current DB still contains the extra roles. Gmail current login/subject and both database role sets are partially verified. RS-03 two independent sessions is not executed. RS-04 retained-history inspection is partial; no before/after mutation result exists. RS-05 Platform local UI evidence is in the [Operations checkpoint](operations-admission-checkpoint.md); Academy sequence and hosted new-source parity remain open. RS-06 post-removal denial cannot be tested before an authorized removal. No role target or case is marked accepted/complete from these reads.

Next preflight: verify iCloud's current independent normal login and prepared/pending state, then settle A's supported ownership disposition and request only the concrete necessary operational authorization. Continue EX-07 ready UI work in parallel. No additional reviewer, access grant, service purchase or deployment promotion is required for the SELECT-only inspection itself.
