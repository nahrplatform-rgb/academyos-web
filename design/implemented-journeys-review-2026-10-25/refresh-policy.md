# Refresh, freshness and original-operation recovery

**Proposed interaction contract; engineering review required before changing runtime behavior.** No fixed polling interval, stale-time threshold or new API is assumed.

| Trigger/state | Proposed behavior | Visible message/control | Boundary |
|---|---|---|---|
| Initial page / academy or actor change | Read authoritative current scope once; abort/ignore previous generation; clear previous private scope immediately | Structural loading region, then scoped result / denied / failed | Never display private data from another actor/context; browser memory is not authority |
| Confirmed action | Keep domain receipt; read affected current region once, coalescing competing lifecycle requests | Confirmed result + read status | Existing post-action refresh already present; do not add a second blanket load |
| Confirmed write, read failed | Preserve confirmed receipt but remove unavailable private projection | Operation confirmed; current view unavailable. **Retry current read** | Never resubmit write; failed read is not unknown commit |
| Return to clean directory/profile | Coalesce focus/visibility into one relevant refresh; preserve valid selection/cursor if contract permits | Quiet current-read status, manual Refresh view remains secondary | Validate current authority; do not expose cached private details during denied/unknown authority |
| Return to editable draft | Preserve typed inputs in memory; refresh authority/context separately or mark required revalidation | Draft retained; current access being checked | Do not erase fields, change branch or manufacture persisted draft; cross-account/context clears private state |
| Return to confirmation/duplicate review | Preserve review intent; current-authority/version validation before commit; preserve focus | If changed: Saved state changed; review again | Never silently confirm or reset user approval; outdated confirmation must not remain valid |
| Manual refresh on clean read view | Read current visible scope; no mutation | **Refresh view**, **Retry current read** on failure | Useful after an external invitation/role change or failed read; not every form's primary action |
| Manual refresh during draft/review | Explicit **Recheck current state** if needed; preserve input, visibly invalidate stale review | Recheck current state | Engineering: specify selection/candidate pages, dirty guard and version handling; avoid universal reset button |
| Unknown original M1 mutation | Keep stored actor/context operation identity; original lookup and implemented same-operation retry rules | **Check original operation** | M1 lookup/retry semantics retained; never issue a replacement identity because a list is empty |
| Unknown I2a registration | Explicit domain reconciliation returns committed player or cancellation/fence for uncommitted operation | **Check original operation** → recovered receipt or confirmed cancelled | Reconciliation can write a fence and consume WRITE budget. Not safe to relabel as ordinary refresh or run silently |
| Unknown I2b/c appointment/accept/end | Explicit domain original-operation reconciliation; retain invitation handoff recovery | **Check original operation**; reopen original email if handoff expired | Keep scoped receipt ACL, cancellation behavior, original IDs and capability checks; no blind replacement or grant |
| Invitation delivery failed / provider outcome unknown | Inspect original delivery state separately from invitation acceptance; show implemented permitted recovery only | **Inspect delivery state** | Never infer failure from provider timeout or create duplicate appointment. Do not import M1 reissue into I2b/c without contract |
| Revoked/ended/foreign access | Deny and clear private projection; show safe context-selection path | Access no longer available | Preserve history and unrelated authorized roles. No restore control |

## Engineering decisions to settle

Choose the single return-to-page trigger and in-flight deduplication approach. Preserve existing generation tickets, cancellation and stale-response guards. Agree what view selection can survive a fresh page, and whether a changed list cursor must reset with an explanation. Do not invent a freshness interval or widen query bounds to keep a visual selection.

Model `draft`, `review(current version)`, `committing(original ID)`, `unknown(original ID)`, `confirmed(receipt)`, `confirmed-but-read-failed`, `cancelled/fenced` and `denied` distinctly. UI copy is derived from these states, not optimistic timers. A success animation is never commit proof. A general page refresh must not mutate an unknown operation.

For review return, two safe approaches need engineering selection: preserve entered intent and force visible re-review after authority/version refresh; or keep the review visible but disabled until fresh validation succeeds. Both must retain input, clear stale approval, enforce current server authority and announce meaningful changes without background focus theft.

## Before/after examples

- People unknown: two actions, “Refresh saved state” and “Check original save” → one recovery card, **Check original operation**. Ordinary Refresh view appears only on clean read views.
- Guardian confirmation after tab return: current handler clears selected appointment, review and checkbox → proposed handler retains intent and says **Saved state changed; review again** only when validation requires it. This is an engineering proposal, not an existing guarantee.
- Trainer post-end read failure: “Operation confirmed” alone → **End confirmed. Current view could not be refreshed. Retry current read.** No restore or repeated end action.
