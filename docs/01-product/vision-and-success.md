# Product vision and success

Version 1.0 · 21 October 2026

## The product

AcademyOS is the daily operating system for sports academies. It connects the academy owner, manager, trainer, guardian and player around the same trustworthy operational records. NAHR operates the SaaS platform and sells academy subscriptions; each academy runs its own branches, sports, programs, teams, sessions, fees and trainer arrangements within an isolated workspace.

A useful day starts with a manager seeing which sessions will run, which need a trainer, which players are expected and which operational problems need action. A trainer opens the next assigned session, records attendance and develops players without seeing unrelated financial or family records. A guardian sees the correct child's next session, published progress, authorized media and family invoices. An owner sees meaningful collections, outstanding balances, staffing commitments and branch performance. A platform administrator manages academy subscriptions, support and service health without automatically browsing every child's private data.

## End-to-end value

An owner creates an academy and chooses its operating settings. The manager creates branches and sport-specific programs, registers players, verifies guardian links, assigns trainers and schedules dated sessions. Families enroll under explicit effective-dated fee plans. The trainer runs a session and records attendance. An evaluation can progress through draft, review and publication. Bills, receipts and trainer earnings follow their own approved policies. Reports reconcile back to source records. Changes retain history and remain understandable after retries, corrections, staff changes and a new subscription period.

AcademyOS should reduce duplicated spreadsheets, repeated messages, lost attendance, ambiguous balances and the need to reconstruct what happened. The value comes from dependable connected workflows, not from the number of dashboard cards.

## Product principles

1. The active academy, role and child context must always be clear.
2. Permission checks belong to the server and database, not only hidden buttons.
3. A successful message means the relevant state was durably committed. Queued, delivered, failed and uncertain are different outcomes.
4. Money, history and consent must remain explainable after correction.
5. English and Arabic are equally complete product experiences.
6. Desktop supports high-volume work; mobile supports focused, interruption-prone work.
7. An unavailable report must not look like zero revenue or an empty academy.
8. The platform grows through a stable shared domain model and API, without requiring every future client to reimplement policy.

## People and first meaningful success

| Persona | Main outcome | First meaningful success |
|---|---|---|
| Platform administrator | Operate a healthy, commercially controlled SaaS | Academy onboarded with a valid plan and clear support route |
| Owner | Understand and control academy operations | First branch, staff membership and operating dashboard reconcile |
| Manager | Run the day reliably | A complete scheduled session with valid roster and trainer |
| Trainer | Deliver training and record outcomes quickly | Attendance saved for the assigned session with clear confirmation |
| Guardian | Know what happens next and what is owed | Verified child link, next session and correct family balance |
| Player | Understand their own training and development | Own schedule and published progress, subject to account policy |

## Proposed measurable outcomes

Measure onboarding completion, time to schedule the first valid session, trainer attendance completion rate, correction backlog age, overdue balance trends, invoice/payment reconciliation failures, notification failures, successful restore duration and support resolution time. Instrument these through named events and aggregate records; do not send children's names, notes or financial details to general analytics.

Proposed usability targets: a returning trainer can reach the next session register in two deliberate actions; a guardian can identify the next session and child context without searching; bulk registration provides row-level outcomes; a manager can resolve a schedule conflict without losing the draft. Validate with representative users in both languages before calling these targets achieved.

Proposed technical targets and their testing conditions are in the acceptance strategy. A fast empty dashboard does not establish performance at realistic scale. A complete pilot includes real role workflows, failure recovery and reconciled financial examples, not only a successful login.

## Product boundaries

The platform is not a general accounting suite, medical record system, unrestricted social network or all-purpose NAHR identity provider. Basic inventory, financial operations and sport-specific progress are in scope; expansion into procurement, clinical records or social networking needs a separate decision. Other NAHR products may share brand assets and operational expertise but do not inherit AcademyOS users or tenant data.

## Commercial readiness

Before accepting paying academies, verify provider commercial eligibility, support ownership, privacy and contractual requirements, backups, restore capability, access revocation, billing correctness, monitoring and the agreed release scope. No percentage such as “100% working” replaces concrete acceptance evidence for the defined release.
