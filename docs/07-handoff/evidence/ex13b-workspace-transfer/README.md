# EX-13B backend evidence

Fictional disposable PostgreSQL17 and actual local app transport and Chromium repository. Read the [normal-route checkpoint](../../ex13b-normal-workspace-checkpoint-2026-11-05.md), [device lifecycle checkpoint](../../ex13b-workspace-lifecycle-checkpoint-2026-11-05.md) and [original transfer checkpoint](../../ex13b-workspace-transfer-checkpoint-2026-11-05.md) for scope, current source, authority and remaining hosted work.

The subsequent [activation packet](../../owner-workspace-staging-activation-2026-11-05.md) records expiry/capability cleanup, root preparation and the later Owner-authorized live schema/key/settings setup. The local checks, installed provider definitions and signed-in working acceptance retain separate evidence.

- `database.json`: final SQL-suite result and migration/test hashes.
- `snapshot-interleaving.json`: observed writer commit between read metadata and row access; production STABLE versus fixture-only VOLATILE negative control. No production function change remains.
- `query-plans.json`: indexed seek/enrichment work for the declared 10,001-player/301-program fixture. Single warm local SQL observations, not provider latency or a percentile.
- `transport.json`: 40 actual Next handler/Supabase SDK/signed gateway/PG and browser checks, scoped wire-byte totals, logical limiter checks and repository recovery cases. Includes normal Players and Calendar with the production-built public offline shell, seven DOM-verified offline entries with the fixture origin disconnected, physical expired-context deletion, four capability cleanup checks and four early/repeated reconnect, unreachable-origin and departing-task cases. Workspace wrapping, browser storage and account cleanup use the actual implementation. Identity, online legacy reads, Redis and the PostgREST wire use fixtures. The original transfer-only receipt is retained at commit c616816. The staging packet retains both failed89e7536 CI runs, the ca48e2b push-pass/PR-failure,83cf2d5 push-failure/PR-pass and the fixture/product repairs. All seven offline openings now verify a new document and the exact destination response; a worker response by itself is not accepted as proof of cached-shell entry.
- `advisors.json`: local CLI advisor result/disposition, including limitations; not independent human review.
- `validation.json`: commands/results for the completed checkpoint, regressions and generated-document checks. Source hashes in individual receipts define their exact boundary.
- `root-custody.json`: separate purpose-bound workspace archive generated and recovered with the existing Owner identity; independent digest recheck passed. No provider provisioning and no plaintext key. The archive/identity remain private outside Git.
- `activation.json`: later explicit Owner authorization, provider-assigned migration version, 59-table/605-row live preservation, installed ACL/gateway/trigger checks, unsigned-call denial, separate sensitive workspace root and three settings. Includes provider advisor findings/dispositions, consistent fingerprint timezone and one bounded Terra review. Owner promotion and signed-in runtime proof remain separate. `root-custody.json` retains its earlier preparation-only scope.
- `startup-reentry.json`: actual-component before/failure and four-case post-repair scope; public probe budget and diagnostic limits.
- `readiness.json`: subsequent cleanup/custody regression scope and source-bound local checks; current staged release observations remain separate.
- `backup-readiness.json`: fresh main-only encrypted backup receipt matched to trusted workflow output before recovery; the original copy result remains separate from restore evidence.
- `migration-readiness.json`: that recovered staging dump restored to disposable PG17, x21 replay/membership checks and matching fingerprints for all 59 pre-existing academy tables / 605 rows. No hosted apply. Recovered plaintext removed; encrypted data/identity stay outside Git.

Run database fixtures **sequentially**; existing harnesses share loopback port 55441. These commands create/delete disposable clusters and never connect hosted staging:

```sh
npm run build
WORKSPACE_TRANSFER_EVIDENCE_DIR=docs/07-handoff/evidence/ex13b-workspace-transfer python3 scripts/workspace-download/test_boundary.py
node scripts/workspace-download/test_api.mjs
node scripts/workspace-download/test_transport.mjs
node scripts/workspace-download/test_transport.mjs --check
python3 scripts/register-key/test_custody.py
```

Use the repository's Node24 runtime. The final transport evidence records its exact runtime. The optional local CLI advisor check must target only the disposable database; the linked hosted project is not this unapplied migration. Do not use a default/linked advisor result to claim verification of new source.

Private operator rehearsal uses explicit PostgreSQL17 PATH for both `backup.py recover` and `rehearse_local.py`. Compare the encrypted artifact digest with trusted workflow output first; then invoke `python3 scripts/backups/rehearse_local.py <privately-recovered-payload> --migration supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql --preserve-existing-rows`. Remove the recovered payload afterward. This command accepts no hosted target. The private recovery identity and artifact paths are not copied into a public receipt.

No captured private records, gateway proofs or encryption keys belong in these files. A complete backend chain is not proof that browser ciphertext exists, that a normal page opens offline or that the Owner accepted the experience.
