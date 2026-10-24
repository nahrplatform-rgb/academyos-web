# I2 first people slice — recommendation awaiting owner decision

24 October 2026. Next after I1 in the accepted implementation sequence. This is a proposed narrow I2a, not approval of the whole people/relationship chain. Source: canonical people/onboarding workflow, roles, requirements AO-013/016 and design-local J06-A01; S16–S18; L05/L06; SEC-J06. Existing prototype is not policy.

## Recommended first outcome

An existing Academy Owner opens the synthetic academy's people area, registers a fictional player name and optional fictional guardian contact, reviews scoped name-match candidates, and saves an idempotent player/contact record with audit and resumable operation receipt. A saved contact has no login or child-view authority. No birth date, real child/customer data, age decision, consent or payer inference, external invitation, automatic merge, deletion or real-academy activation. Limit this first slice to existing owners; manager/staff capabilities are still a separate D-003 decision.

Use the academy's existing initial branch as an explicit context; no new branch administration is implied. Registration does not activate scheduling, billing or commercial service. This would be a new bounded synthetic people capability in server/data checks, not a reinterpretation of M1's existing setup-only permission. Implement only after owner accepts this policy; no new account/membership/platform grant is included.

## Choices and consequences

| Topic | Recommended I2a choice | Alternative / later decision |
|---|---|---|
| D-003 authority | Existing Academy Owner only, current academy and explicit initial branch, current authority checked at every read/write | Name exact Manager capabilities and branch scope before allowing Manager writes |
| D-004 identity | Player record without player login; optional unverified contact is distinct from guardian relationship, payer and consent | Guardian access/player login requires approved identity/evidence/consent process first |
| Duplicate review | Within this academy only, bounded normalized-name candidates; no global lookup or auto merge. Open an existing record or explicitly confirm that this is a different fictional person | Stronger matching fields/identity evidence need purpose, policy and privacy review; no silent DOB collection |
| D-015 data | Synthetic staging only; no deletion/retention promise or real personal-data rollout. Keep audit and status visible | Real data requires per-class retention, applicable obligations/holds and cleanup policy |

Accepting this recommendation settles only the limited I2a policy so its connected design/data/security contract can be prepared. It does not approve production, real child data, a new privileged grant, or the later guardian-verification evidence standard. The next I2b packet must explicitly settle who reviews relationship evidence, which evidence is sufficient, verified-recipient acceptance, revocation effects and the exact child projection before granting guardian access.

## Engineering work after policy acceptance

Prepare the connected EN/AR phone/desktop registration → duplicate review → saved profile prototype, exact fields, bounded cursor/candidate queries, operation/version/audit/outbox contract as applicable, denial/isolation/concurrency/unknown-outcome cases and measurable budgets. Inspect/reuse existing M1 identity/gateway/operation patterns and shared compact controls, rather than using prototype state. No implementation or accepted-policy status is established by this proposal.

## Owner policy decision — 24 October 2026

After asking for plain-language clarification, Moamen answered “yes” to the explained first flow: Academy Owner enters a fictional player name, reviews possible duplicates in that academy, opens an existing player or confirms a different person, then saves and views the profile. Optional parent email remains contact information only, with no invitation or access. Fictional data only. This accepts the narrow I2a policy; broader guardian verification, child login, manager authority, real personal data and retention remain unresolved. The technical design and connected preview below still need their own review; no new grant or hosted operation follows from this decision record.
