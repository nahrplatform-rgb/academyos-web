# M1 authenticated HTTP boundary checks — 22 October 2026

Scope: J01-A01/J04 read boundaries; M1-T01 (unknown-resource subcase only), M1-T10 and relevant AO-003/004/169/175/178. Continue the [accepted M1 packet](../06-delivery/onboarding-m1-decision-design-packet.md) and [verification receipt](onboarding-m1-verification.md). No new policy, account, membership, grant, email or production operation.

Use the existing signed-in synthetic owner's setup refresh in a separate test tab. If supported, browser developer request interception will alter only a single outgoing request to the existing staging API. Preserve the signed-in session; never print/copy credentials or request headers. Read back only status, fixed error code, safe response headers and UI state. Disable interception in a finally block; then verify a normal refresh recovers. No API/auth bypass route or product test mode will be added.

| Case | Single controlled request change | Expected authoritative result |
|---|---|---|
| HTTP-M1-01 | Origin set to an unrelated synthetic origin | HTTP 403; no operation/data effect; private projection cleared after denial |
| HTTP-M1-02 | Content-Type text/plain | HTTP 403; no operation/data effect |
| HTTP-M1-03 | Malformed JSON | HTTP 422; validation failure remains distinct from empty saved data |
| HTTP-M1-04 | Valid JSON body above 16 KiB | HTTP 413; no operation/data effect |
| HTTP-M1-05 | Unsupported read action | HTTP 422; no operation/data effect |
| HTTP-M1-06 | Well-formed unknown academy identifier on setup read | HTTP 403 before private projection; no existence disclosure |
| HTTP-M1-07 | Same unsigned refresh body directed to the invitation worker | HTTP 401; no delivery claim/send |

An unknown academy is not a second populated tenant. Do not promote HTTP-M1-06 to full two-academy isolation proof. Wrong-role and foreign populated-tenant/persona cases remain separate. No hostile input is sent outside the already authorized staging application. If developer interception is unavailable, record the missing capability and continue other authorized checks; do not extract session credentials or introduce an auth bypass to work around it.

Results and remaining gates are recorded below. Independent security review remains open.


## Executed authenticated cases

All seven planned cases returned their expected statuses in the actual signed-in browser, and every subsequent normal refresh recovered. The six app-API errors carried `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Denial cases 01/02/06 cleared the private setup projection. Validation errors 03/04/05 retained the previously saved state, with an explicit error. The unsigned worker call returned empty HTTP 401 with default route headers (`public, max-age=0, must-revalidate` / `strict-origin-when-cross-origin`); it did not claim a delivery or expose private response data. Do not infer the worker's private-response cache contract from this empty denial.

The well-formed unknown academy probe was independently confirmed absent before the read; this remains an unknown-ID denial rather than populated two-tenant isolation. Interception used explicit non-document Fetch patterns, was cleared after each case, and never exported credentials/request bodies. No application/test-auth endpoint was added. Sanitized [HTTP observations](evidence/onboarding-m1-http-boundary.jsonl) contain only case IDs, expected/actual status, safe header values and projection/recovery booleans.

## Executed wrong-role tests — separately authorized

Use the same already-confirmed Clerk account and its one existing membership in **AcademyOS M1 Synthetic Academy**. Temporarily change only that membership from owner to **manager**, test denied setup read and a save submitted from a previously loaded owner form, then immediately restore owner. Repeat separately for **trainer**, **guardian** and **player**, restoring owner before proceeding to the next role. The existing platform grant stays unchanged; this also verifies it does not override tenant setup authority.

Eight prepared permission-restricted operator files are in the owner's configuration directory: `test-role-{manager,trainer,guardian,player}-{enter,restore}.sql`. Each transaction checks the exact original subject, membership, academy, active status and expected role, then audits operator/reason/before/after with a per-role test reference. Each restore requires its matching entry audit. Restoration is prepared before any change, runs even if a browser assertion fails, and stops on unexpected state. No new account, membership, email, operational entitlement or normal role-assignment endpoint is introduced.

This briefly leaves the synthetic academy without an active owner while each lower-role check runs; it has no real/customer data. Restoring owner access is privileged, so the original owner's explicit restriction requires authorization before executing these files. Moamen explicitly authorized all four role tests and owner restorations in this chat before execution. All four tests have now executed on the existing protected staging deployment. A broader two-account/two-populated-academy packet and independent review remain separate; passing this same-account role-state test will not close those layers.


The exact prepared role-control files were rehearsed against a disposable local PostgreSQL cluster: all four roles denied setup reads/writes; restoration returned the original owner projection; repeated entry/restoration failed its state guards; exactly eight audit receipts were created. The cluster was removed. This local rehearsal preceded authorization and hosted execution; its results remain separate from the browser evidence below.

Provider-cost investigation: the connected Upstash scope listed no Redis databases, so it could not identify the verified AcademyOS Redis resource. EU QStash statistics from that unbound scope were not attributed to AcademyOS. The provider console required sign-in; no new account, agreement, resource or upgrade was created. Billing/meter costs remain unverified. See the provider's [metrics definitions](https://upstash.com/docs/redis/howto/metrics-and-charts); do not substitute sample Insights charts or another account's zeros for dated AcademyOS usage.

Postcheck after the seven HTTP probes: one academy, one membership, active owner role, setup version 9/completion true/Cairo timezone and one invitation delivery attempt. No business operation, audit-grant change or email was produced by these probes.

## Hosted role results and restoration

Executed after explicit owner authorization on the same deployed app commit `549de6d3227cac653fb5106a170f6ff85f507add` / deployment `dpl_HvqWcKskiiBpkGjCAsWoiTKfU1N7`. For each role, a previously loaded owner branch form submitted a distinct synthetic draft after the guarded role change. A second already-open tab refreshed the saved setup. Each role was restored to owner immediately after the denial observations; both tabs then recovered the saved owner view before the next role. No credentials or private request payloads were exported.

| Current membership role | Save from previously loaded owner form | Setup refresh | Denial clears private view/form | Owner view recovers after audited restoration |
|---|---|---|---|---|
| Manager | HTTP 403 | HTTP 403 | Yes | Yes |
| Trainer | HTTP 403 | HTTP 403 | Yes | Yes |
| Guardian | HTTP 403 | HTTP 403 | Yes | Yes |
| Player | HTTP 403 | HTTP 403 | Yes | Yes |

Sanitized [role observations](evidence/onboarding-m1-role-boundary.jsonl) record only role, status arrays and clearing booleans. Recovery was separately observed in both tabs after each restoration. Database postcheck: active owner; one academy/one membership; setup version 9, complete true, timezone `Africa/Cairo`; 11 business operations and nine setup-write audits unchanged; zero rejected test branch names persisted; invitation delivery attempts still one; platform grant remains active. Exactly four `test.role.enter` and four `test.role.restore` audit receipts exist. Thus the existing platform grant did not override lower-role setup restrictions.

These are same-account role-state HTTP/browser checks, not separate-persona login/context isolation or two populated tenants. Write-revocation races, recipient expiry/reissue/provider-failure layers, full navigation/physical-device performance, billing meters and independent security review remain open. Wording/usability acceptance remains separate from full milestone acceptance.
