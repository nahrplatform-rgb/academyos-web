# I4d — configurable QR and simultaneous-session preview

[Policy and reference evidence](../../docs/06-delivery/i4d-qr-attendance-decisions.md), [connected design contract](../../docs/06-delivery/i4d-qr-attendance-design-contract.md), [security/retrieval/performance preparation](../../docs/04-engineering/i4d-qr-attendance-preparation.md). Configurable window/automatic routing direction accepted for design28October2026. Remaining card/settings recommendations and separate connected-design review pending.

Open http://127.0.0.1:3223/. Build `node scripts/design/build_i4d_review.mjs`; serve `python3 scripts/design/serve_i4d_review.py`; check `node scripts/design/test_i4d_review.mjs` using repository Node24 dependencies. No added package. Shared actual shell/panes/controls/styles; all business state is fictional local memory. Reload resets it. No camera/decoder/authentication/API/database/email/usable QR or hosted persistence. Review actor/scenario/clock/Finish simulated response above the shell are design controls only.

Try:

1. Owner → Open scanner → code `DEMO-1-R1` (Alex) → Read card code → Finish simulated response: unique Football match saves automatically. Read again: Already recorded; history remains one.
2. Reset → `DEMO-2-R1` (Taylor) matches simultaneous Swimming with a different Trainer. Switch review actor to Trainer Jordan: Swimming disappears and that code has no authorized match.
3. Reset → `DEMO-3-R1` (Morgan) belongs to back-to-back Football sessions with overlapping scan margins: choose17:00 or18:00 for this scan. Exactly one mark. Exact-session selector can also disambiguate beforehand.
4. `DEMO-4-R1` (Casey) already Absent: no overwrite, use existing correction context. Change demo time to16:20 for closed windows or16:45 for early arrival.
5. Owner Attendance settings → academy defaults or session override → edit before/after minutes → review → confirm → Finish simulated response. Existing explicit session overrides survive a default change. Numeric upper limit0–180 is still proposed in the contract; the local preview currently allows nonnegative whole-minute illustration.
6. Player cards → Alex → replace → confirm/finish: old R1 fails, new R2 works. Revoke→confirm/finish: R2 stops. Cards are text-only fictional placeholders with visibly non-scannable codes; raw-code/print recovery and actual QR images are not demonstrated.
7. Lost-reply/current-state/camera/read-failure scenarios show paused capture, original-operation recovery, no fake success and private denial. Try EN/AR and phone Back.

[evidence/checks.json](evidence/checks.json) records16 local design scenarios. Strict TypeScript passed. Responsive screenshots cover EN/AR ambiguity and settings at360/1440; overflow checks also320/926. These are local Chromium simulations, not physical-camera/device, hosted authority, SQL atomicity, security review or measured performance evidence. Screenshots were visually inspected. No implementation or account grant occurs in this packet.
