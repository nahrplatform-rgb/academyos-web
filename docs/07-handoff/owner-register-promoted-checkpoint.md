# EX-11 closed staging verification

4 November 2026. The Owner reported promotion of the combined register and Operations source. Vercel resolved the canonical staging alias to rebuilt deployment `dpl_7uNTT7sXQ3SWHh9gWhbFn9pzxGMM`, Ready, source `ef73a36537228461f80aecf1084bd1429b2ebb8c`. The earlier preview and both CI receipts remain in the [delivery record](evidence/owner-register-staging-delivery-2026-11-04.json). [Hosted verification receipt](evidence/owner-register-promoted-2026-11-04/verification.json) · [Deployment](https://vercel.com/academy-os2/academyos-web/7uNTT7sXQ3SWHh9gWhbFn9pzxGMM).

## Observed result

- The existing synthetic Academy Owner session loaded Today and the published attendance register in EN and AR at 1600 × 900. The retained Operations layout, navigation and summary were visible. Today had zero sessions and one publication preparation. The historical register showed its one retained Present mark, an expired recording window and disabled register review. Returning from attendance to Today completed through the normal navigation.
- The personal-device preparation action was absent in both attendance languages. The normal Clerk account menu remained available. The browser reported no application errors in the observed pages. Clerk's development-key warning was expected for this staging identity instance.
- The public prepared-register page and its worker returned 200. The page carried the expected `register-v1` marker and online workspace guidance. The document check found none of the sampled account, academy or Clerk-host identifiers. The observed browser profile had zero prepared-register workers, zero matching public caches and no register account locator after ordinary navigation. A clean-profile baseline and hosted offline preparation remain future tests.
- Same-origin empty JSON requests to the key, transfer and dispatch endpoints each returned `503 unavailable` with `Cache-Control: no-store`. The health route returned 200 and its process-only status. These observations establish the closed endpoint behavior on this source.
- Read-only Supabase inspection found 25 migrations ending at `20261102124518`. The four register migrations were absent from history. Catalog checks found no register key table and none of the five bound or unbound register RPCs. Record future database apply and gate changes independently.

The receipt includes eight individual public HTTP durations, byte counts, response hashes, selected headers and screenshot hashes. Individual network observations do not establish latency percentiles or Supabase, Redis and hosting cost under operating load. Only the existing signed-in synthetic Owner session was exercised. Fresh sign-in, sign-out, access restoration, private preparation, synchronization, physical-device support and private working acceptance remain open.

## Next gate

Use the [staging and independent security handoff](owner-register-staging-handoff.md) for review of the four migrations together, the real identity and grant boundary, wrapping-root custody and recovery, browser protection and exact synthetic cases. Independent reviewer assignment and hosted key-custody readiness remain unresolved. The approved one-register scope, ordinary login and protected pending-recovery choices stand.

After the independent disposition and explicit private enablement authorization, perform the reviewed migration and custody procedure and run the synthetic private cases with the original-operation and current-authority checks. Keep physical-device evidence and Owner acceptance distinct. Current engineering and browser results do not supply independent security approval.
