# I3b connected draft-date planning design

27 October2026. [Policy accepted for design](../../docs/06-delivery/i3b-draft-session-planning-decisions.md); **connected-design approval pending**. Local React simulation only. No login, API, database, email, access grant, hosted persistence or product integration. Reset/reload clears all simulated records.

Build: `node scripts/design/build_i3b_review.mjs`. Serve: `python3 scripts/design/serve_i3b_review.py`. Open http://127.0.0.1:3209/ . Loopback only; no-store responses and versioned assets prevent an older open tab from silently reusing the earlier bundle. Reuses actual shared app shell, panes and native controls. No OS window dots.

## Review

1. Open1 November · Synthetic Football Program → Plan this date.
2. Enter capacity2, choose Jordan Demo and Taylor Demo (all fictional). Review the exact changes → check the review acknowledgement → Save draft plan.
3. Back to dates → reopen: saved capacity/Trainer/roster persist in this simulation's memory. Other dates remain unchanged. Enter another date to make an independent plan.
4. On the first date, Casey Demo or Alex Demo conflicts with the overlapping Synthetic Skills Program fixture. Three players with capacity2 must reject. Changing choices permits another review; failed lookup never means no conflict.
5. Use the controls above the product frame for no eligible Trainer, stale review, ended appointment, validation unavailable, failed/limited save, committed reply lost, no-commit cancellation, confirmed save/read failure and denied access. They are review scenarios, not future product controls.
6. Try EN/AR and phone/desktop: work list and contextual planning on desktop; selected date/editor/review with Back on phone. Different weekday times were saved by I3a; this slice does not edit them.

## Evidence boundary

`node scripts/design/test_i3b_review.mjs` tests the compiled local preview's connected state transitions and reflow. [Receipt](evidence/verification.json), screenshots in `evidence/`, [source hashes](source-manifest.json). Inspect the receipt's actual status; source presence alone does not prove a passing test. Synthetic capacity/conflict/operation behavior is design evidence only. Real current permissions, private projections, serialized capacity/overlap locks, idempotency/cancellation fences, revoked appointment races and hosted reload durability remain implementation/verification gates.

[Engineering packet](../../docs/04-engineering/i3b-draft-session-planning-preparation.md) and [full PYSA scheduling review](../../docs/03-design/pysa-scheduling-reference-review.md) govern the next step. PYSA references inform the connection and failure design; no PYSA data, schema or permission assumptions were copied.


## Final local verification — 27 October2026

Node24.22.1 compiled-preview suite passed, with no page errors/external requests, happy path/reopen, roster removal with another date unchanged, retained search selections, capacity/Trainer/player conflicts, failed validation, stale comparison, ended Trainer, unknown/no-commit recovery, confirmed-save/read failure, restricted/empty states and EN/AR320/360/926/1440. Standalone TypeScript and local links/register integrity passed. [Served bytes](evidence/serving-verification.json) match disk; [actual IAB observation](evidence/actual-tab-verification.json) separately confirms refreshed review values and screenshot. [Actual review screenshot](evidence/actual-tab-review.png). Owner connected-design approval remains pending; none of these results is a database, authority, concurrency or hosted-persistence test.
