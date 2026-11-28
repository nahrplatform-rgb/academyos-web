# DS-005 coordinator takeover and native helper completion

8 November 2026. EX-07 / MP-B01; VAL-02/09, IMP-J06-A01 and WD-70/71. The Owner reported DeepSeek quota exhaustion. Its interrupted, 116-line helper had SHA-256 `12c756d371c9018ff92cfb4ae255c9d34031b54e8e18052e3aa92179e10b6181` and no completion report; the interruption receipt records that baseline and its syntax-only check. This is not a reconstructed DeepSeek completion report. The coordinator explicitly authorized takeover of that existing file; the configured native helper model for these amendments was `gpt-6.1-terra`. Usage and savings are unmeasured.

Owned outputs:

- `scripts/workspace-download/empty_online_registration.mjs` — retained the original helper and added exact returned row/button count and visibility, one recorded registration, decimal revision validation, and all five signed RPC count assertions. Completed SHA-256: `aa475ecd1fc48623e9ee6ba0fca6712072db207dd910f3a9bbd747e48110886f`.
- `docs/07-handoff/deepseek/DS-005-empty-online-registration.md` — this takeover report.

Frozen source commit `d2bccb8c9475dac9f7c4d1210b33655ae8320008`; frozen and working-tree SHA-256 matched at inspection, with no drift observed:

| Source | Full SHA-256 |
| --- | --- |
| `apps/web/src/components/people-workspace.tsx` | `5d9d0d46b9c20e865708a85d578177ff7c05844402cd0760adf0ac2ee59b91a0` |
| `scripts/workspace-download/normal_workspace.mjs` | `7323cc8c3923909c559e8b2285ce444fde94231cc091ae7c5bf8e7c0f39621df` |
| `scripts/workspace-download/bridge.py` | `afb9f8dfb482ea5397f5c12f66c8ec2985565b2ab3925caf7d30476c3a127a0c` |
| `scripts/workspace-download/test_transport.mjs` | `342f65d85115e82815537035c0eb5587a190f8c9675e82a50110ee18e34918d6` |

The helper exports `checkEmptyOnlineRegistration({page, ui, fixture, base, rpcCalls, observe, pass})`. It expects People actions `list, candidates, create, profile, list` and signed RPC counts of two `i2_people_v1`, one each `i2_candidates_v1`, `i2_register_v1`, and `i2_profile_v1`, and zero `i2_operation_v1`. These expectations remain unmeasured. The existing original save ID, canonical total and revision, and operation-linked result checks are retained. The coordinator must implement the specified read-only disposable-database `observe` adapter and integrate the isolated fixture and runner before executing and reviewing the scenario.

`node --check scripts/workspace-download/empty_online_registration.mjs` passed after amendments. No browser, app, database, provider, build or integrated test was run for this takeover. This is unintegrated test code, not a passed regression, product fix, hosted NR07 diagnosis, security or Owner acceptance, or promotion.
