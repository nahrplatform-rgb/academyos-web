# Owner Today review and return

11 November 2026 · EX-07 / MP-B01 · VAL-01/04/09 · IMP-J13-A01 and IMP-J16-A01 · L08/L10

Today opens the exact pending attendance correction or development submission in the main task area. The Owner can review the saved state, make the existing decision and use Back to Today. An unfinished item regains focus with the previous filter and scroll. After a decision, the current Home read removes completed work and focuses Needs your attention. The ordinary module lists are available through Browse corrections and Browse development.

The 3 November Operations studio supplies the Today task hierarchy and return behavior. Its four shown destinations leave these review screens to the accepted correction and development contracts. The task area uses the existing shared controls and keeps reasons, confirmations, status, retained history and publication audience with the decision. [Operations design](../03-design/operations-design-reference.md) · [Correction design](../06-delivery/i4c-attendance-correction-design-contract.md) · [Development design](../06-delivery/i5a-development-feedback-design-contract.md)

## Observed baseline and change

The baseline used source `78126d1`, real Next and Chromium, and the signed application handlers on disposable PostgreSQL 17. Today’s correction link loaded the list and the player’s attendance context. The server’s Owner context did not show a Trainer’s existing-request shortcut. Selecting the pending list row made the third read. The Development link loaded role context, the queue and then the exact detail. Both lacked an explicit return to the originating task. [Before evidence](evidence/mp-b01-owner-reviews/before.json)

| Task | Before | Current |
|---|---|---|
| Open attendance correction from Today | List, player context, then detail after selecting the row | One signed request-detail read using the request and occurrence IDs |
| Open a development submission from Today | Role context, queue, then event/player detail | One signed detail read for the event/player pair |
| Review and finish | Review state, decision and broader result reads | Existing decision and one current result read in the focused task |
| Back to Today | Workspace navigation without a task return | One checked Home read in the same browser document, with retained or finished-task focus |

The browser fragment carries a validated task identifier. Home compares it with its same-account and same-academy tab entry and consumes it on arrival. Earlier Attendance links and saved attendance navigation context remain readable. Current access checks decide what is rendered. User interaction during a held read cancels deferred focus and scroll restoration.

## Original-operation recovery

The baseline Development publication committed after the fixture dropped its response. Reload showed the publication, but the UI had lost the original operation reference and the option to reconcile it. The revised Development flow checks that the tab stored the event, player and operation identifiers before sending the command. A subsequent visit in the same account, academy and tab offers the original check before loading a new task. A failed lookup or missing sign-in retains the stored reference. A confirmed operation loads the exact saved result. An unavailable follow-up read offers a read retry. If storage refuses the locator, the reason stays visible and the command is withheld.

The signed tests retain Correction’s existing original-operation behavior and exercise Development publication with one command, a lost reply, a full reload and explicit reconciliation using the same ID. A missing sign-in keeps the locator, and a non-JSON authentication refusal masks the stale detail. The fixture also verifies zero commands when storage rejects the reference. Only identifiers are in the tab locator. Recovery across an ended browser session or evicted storage still needs separate evidence.

## Evidence and next work

The final source passed 27 working-day checks, including six EN/AR review returns and three recovery cases. It also passed eight connected Owner-day checks, eight startup checks, 70 protected workspace transport checks, 104 units, build, types, lint and 20 navigation geometry cases. Both review modules passed the current API and real-component checks. The factual HTML was rebuilt from 16 component capture families and eight entry captures. [After evidence](evidence/mp-b01-owner-reviews/after.json) · [Factual app walkthrough](../../design/app-experience-review/AcademyOS-experience-review.html)

The Owner reported promoting `78126d1`. The staging alias independently resolved to Ready deployment `dpl_2w5sYqKiAQPzooHyrws14oqU7stW` for that source. The signed-in Academy B register returned to Calendar in EN/AR with existing saved marks. Academy B had no pending register in Today during the observation. Pending and completed Today queue returns retain the prior controlled runtime evidence. [Prior release receipt](evidence/mp-b01-today-queue/release.json)

One `gpt-6.1-terra` helper inventoried Development’s existing tests, authored six focused review-return cases and reviewed the changed recovery source. Peak helper count was one. The coordinator reproduced the baseline, implemented the changes, ran integration and added the lost-response, sign-in and storage cases. The review identified authority handling for non-JSON 401/403 replies and a return guard during a failed confirmed-result read. Both were tightened. Token savings were not measured.

The request counts in this packet describe the named application reads and writes in the disposable fixture. Hosted latency, physical devices and a working-feature review remain open for this new source. The next Owner-day task is to measure the existing publication preparation link and return path. Installation identity and the rich Player policy decisions remain tracked.
