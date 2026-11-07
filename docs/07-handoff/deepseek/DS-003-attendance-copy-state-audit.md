# DS-003 — Attendance wording/state audit

**Scope:** static copy/state audit of normal Attendance and the prepared register, EN/AR. Detail is in [`DS-003-attendance-copy-state-audit.csv`](DS-003-attendance-copy-state-audit.csv) (**83 rows**, `DS-003-C01`–`C83`). Proposals only; nothing accepted, implemented or closed.

## Provenance

- Commit `3be2d4168bef1f58c5664f5daf3f038b6c602459`; DS-003 `ready_for_handoff`; EX-07 `primary/current`, MP-B01. Worktree already dirty as expected; not touched.
- `attendance-workspace.tsx` `de8e4d472eb46338bec4b3fde5519d8d485863f6373c7f422c19d121d3e34c17` (134 lines)
- `prepared-register-panel.tsx` `7849631b47c8140885e299db475954249c26257373e0875f2d725edeb3ab786c` (360 lines)
- `prepared-register-session.tsx` `0d22aacd0fa1d5e37bc7266814577eca583e0eafb9cfb8bd955452c82d8a400c` (88 lines)
- Read also: Operations reference, working-behaviour contract, product-outcomes/simplicity. The offline-edit/conflict contract supplied save terminology; no synchronization was redesigned.
- Model: harness session reports the `deepseek-flash` alias; no credential read.
- Written: these two files only.

## Coverage

| Surface | Rows | Assessments |
|---|---|---|
| Attendance online (entry, authority, roster, counts, filters, save/review, history, correction, unknown) | 56 | 26 `ok`, 10 `minor`, 18 `issue`, 2 `not_found` |
| Prepared register (device save, pending/unknown/review, sync, window, binding, recovery) | 27 | 12 `ok`, 8 `minor`, 5 `issue`, 1 `decision_needed`, 1 `not_found` |

`ok` accurate; `minor` clarity/consistency; `issue` misleading or wrong for the state; `decision_needed` needs the coordinator's rule; `not_found` state absent in these files. Rows quote source text, `reason` is interpretation, `suggested_text` is proposed copy.

## Strongest observations

1. A confirmed save with a failed read shows "Save confirmed; result read unavailable…" beside the generic alert "Service unavailable. No success is assumed." (C23).
2. The prepared register collapses every pending original into "Saved on this device" (heading) and "1 save pending" (top bar), including the unknown and needs-review states its own body distinguishes (C58–C61).
3. Unknown-outcome copy is written for one mark ("before another mark") although the all-or-nothing register save reaches the same state (C26).
4. The online window sentence merges "not open yet" and "closed", which the panel separates (C10).
5. "Roster unavailable until current access and saved state are checked" also renders *after* the check failed (C29).
6. Count wording: fixed plurals give "1 selected changes"/"1 remain unmarked", and Arabic uses "18 اختيارات" rather than the 11–99 form (C43, C44, C46, C47).
7. The Arabic closed-window line says unsaved choices are saved here — self-contradictory in one sentence (C66).
8. Working well: device save, unknown original, retained review and server "Synced · Server recorded the register." are separately worded (C57, C71, C72); partial counts are explicitly limited to loaded players (C34).

## Uncertainties

- The pilot's full error-code set lies outside the three files, so which cleanup codes reach the generic fallback is unverified (C73, `decision_needed`); the `scope_lost` producer is likewise outside scope (C74).
- No browser, rendered 18-row volume, accessibility or Arabic-specialist review; counts were read from source. `Intl` numeral output depends on runtime ICU data.
