# EX-13A local baseline evidence

5 November 2026. [Checkpoint and limitations](../../ex13a-baseline-and-dataset-checkpoint-2026-11-05.md) · [family coverage](../../ex13a-refresh-family-coverage-2026-11-05.csv) · [measurement manifest](measurement.json).

The final run passed all 15 existing actual-component suites with **830 known-read hold observations**. These observations include first loads, returns, controls, intentional failures and post-action reads across whole suites. They are not 830 duplicate requests, 830 cases, a per-user cost or a performance measurement. Existing suite assertions were retained. UI/SQL source still matches the investigated staging commit `cb00ab886f2278d0f3deb9a586b0c20872e672d2`.

`measurement.json` binds every family to its original test and observer/launcher hashes, browser/runtime profile, full-suite API counters, fixture document entries, held observations and available explicit resume metrics. Family `.log` files retain the actual suite output. [Compressed trace](component-traces.jsonl.gz) contains fictional fixture control labels and count/focus/scroll snapshots, grouped by family/page/request identity. No request bodies or typed values are recorded. The gzip digest and uncompressed digest are in the manifest.

Reproduce locally from the repository root with the named families, for example:

```sh
REFRESH_TRACE_DIR=/private/tmp/academyos-refresh-baseline node scripts/navigation/measure_refresh_families.mjs onboarding people guardians trainers programs planning program-planning publication session-changes attendance corrections qr-attendance guardian-training development experience-projections
```

The launcher uses temporary observer-import copies and redirects suite evidence into the temporary output. Do not run overlapping jobs for the same family/output. Some fixture servers use fixed ports. Test substitutions for identity and Next Link mean document counters cannot establish real application routing; use the separate real Next/hosted evidence.

Retained prior local receipts, copied without rerunning them in this checkpoint:

- [Next routing](next-routing.json), [layout read owner](read-owner.json), [shell identity](shell-identity.json) and [held geometry](geometry.json.gz): actual production Next with fictional adapters. The optional shell import matcher was repaired only in its disposable diagnostic copy; its input hash is not the unchanged committed diagnostic script.
- [Attendance fixture](attendance-prior.json): actual component, fictional API/identity, original save/recovery assertions.
- [Optional cold diagnostic](optional-cold-open.json): failed isolated hydration result, still open. It is not a staging failure or a passed first-useful-content measurement.

The prior root-cause receipt records separately sampled signed-in staging observations. This directory introduces no new hosted visit/write, role grant, performance percentile or service-cost proof. Future no-flash/request-budget and full offline cases remain planned until their changed implementation is exercised. The final documentation/review validation result is recorded in `validation.json` after checks complete.
