# EX-10: Owner offline register — connected design review

3 November2026. **Policy and connected write design approved for implementation3November2026. No private app implementation or hosted offline release.** [Open preview](http://127.0.0.1:3237/design/offline-register-preview/index.html) · [portable HTML and instructions](../../design/offline-register-preview/README.md) · [source-specific synthetic evidence](../../design/offline-register-preview/evidence/checks.json).

## Authorized outcome and traceability

The Owner accepted saving selected new attendance marks together on a personal device, uploading together under the original save ID, current server access/version/deadline checks, retained Needs review conflicts/refusals and protected same-account pending recovery after logout/30day read-copy cleanup. [Policy and exact replies](../04-engineering/offline-edit-and-conflict-contract.md). This packet makes that accepted policy reviewable; it does not re-ask it or invent late recording, Trainer offline authority, encryption approval or another idle timer.

| Join | Scope in this review |
|---|---|
| Journey/actions | J12-A01–A03 / IMP-J12-A01 register; J14-A01 / IMP-J14-A01 local recovery concept; current Owner capability only |
| Screens / loading / security | Existing S28 register and S30/S68 recovery concepts; L08; SEC-J12/SEC-J14; current authority and field gates retained |
| Requirements | AO-035/AT-035 equal domain checks; AO-036/AT-036 canonical idempotent mark; AO-042/AT-042 original-outcome reconciliation; AO-045/AT-045 device timestamp is not server authority. Broader J14 requirements remain unimplemented |
| Findings / execution | NR13/NR14/NR15/NR17, G08/G09; EX-10 design readiness, then ready EX-06/EX-04/EX-03 work; EX-11 operating proof remains later |
| Working-day cases | WD-46–48,WD-52–57; WB-09/10/12/13/15/16/19/20/23. These remain planned operating cases. A fictional prototype check is not a private runtime pass |

Trust boundaries: fictional UI → isolated local transactions; local original intent → simulated server receipt; same-account versus other-account recovery; read replicas versus retained pending work; known denial and late outcome; copied source → reviewer artifact. No real Clerk, Supabase, Redis, email, camera, staging data, membership, provider configuration or current app write endpoint is changed.

## One connected task

**Complete downloaded session → choose new marks → exact local review → local atomic save → reopen original work → reconnect → current checks → all recorded / Needs review / original outcome unknown → retained recovery.**

The18-player roster includes17unmarked players and one saved Present. Direct labelled Present/Absent controls, gold unsaved rows, a selected count and one register-level review/save keep the task visible. Existing marks open an explanation of the existing online correction path; a new offline mark cannot overwrite them. Saved pending rows use a violet local-work treatment, visually separate from recorded success and from unsaved gold. Training context retains sky tint; explanatory context uses violet and gold; successful receipts use mint. Primary actions stay consistent. This is the approved Charcoal direction, not a new palette decision.

| State / transition | Visible behaviour and recovery |
|---|---|
| First entry | Complete fictional published roster, branch timezone, current saved counts, deadline and explicit review/simulation boundary. A newly seeded review is preprepared; this is not an actual app bootstrap claim |
| Unsaved selection | Exact choices and gold summary; no durable acknowledgement or server effect. Routine status selection has no extra confirmation. Dirty navigation offers Back or explicit discard |
| Review local save | Exact player/status list and count, clear local-only consequence. Native modal, keyboard containment, Escape and focus restoration |
| Local transaction failure | No Saved banner; neither journal nor local projection commits. Choices stay available. No plaintext fallback or automatic destructive reset |
| Saved on device | Packet, original ID, basis versions and local projection commit together. Awaiting sync is not server recorded. One unsettled register prevents a replacement command |
| Reopen / process restart | Real browser storage retains the original packet. Pending work is separate from ordinary read downloads. No closed-browser background or cold-offline-launch claim |
| Reconnect | Per-scope Web Lock coordinates active tabs; fixture receipt handling is idempotent. The current app still needs an authenticated transport and leadership/access design |
| Confirmed | All selected marks commit together in the simulated server; a validated matching receipt settles the local intent/projection together. Unselected marks stay unchanged |
| Another mark, changed roster or withdrawal | Whole upload refuses; zero selected marks apply. Local/base/current comparison remains; existing saved marks require current online correction rules |
| Recording deadline passed | Original choices retained as Needs review. No backdating or silent extension from a local timestamp. The unchanged server deadline still applies |
| Lost or mismatched reply / local receipt failure | Original ID stays unknown, replacement is blocked. Lookup/replay uses exactly the original bytes. A stored matching receipt settles once, even if the prior simulated server commit succeeded |
| Known loss of access | Hide rows, stop sending and retain quarantined pending work. Denial survives preview reload. Signing in alone does not restore academy access |
| Logout / simulated30day cleanup | Remove read copies/local materialized projection, retain unsettled original work separately. Show no player names to another fictional account; original verified account has explicit recovery |
| Cross-tab work during dirty input | Retain unsaved choices separately; compare before proceeding. Another tab's recorded mark cannot be overwritten by stale selections. Changes of principal hide incompatible private state |
| Missing downloads / unsupported storage | Say Not downloaded or storage unavailable, not empty/success. Recover original work separately; new local marks require a complete compatible roster |

Needs review offers a retained-work/next-action explanation. It does **not** introduce an offline correction, Owner deadline override, automatic conflict winner or automatic discard. Rebase/replacement commands beyond this accepted slice require their own reviewed contract. Reset is a labelled review tool deleting only fictional local stores after confirmation, never a product control.

## Real mechanism versus simulation

`design/offline-register-preview/src/repository.mjs` owns a separate `academyos-offline-register-review-v1` IndexedDB database. Transactions cover capture projection+immutable packet, validated receipt+settlement and replica-cleanup+quarantine. A metadata-only transition cannot replace packet bytes. Native IDB serialization plus Web Locks prove the selected browser fixture cases. BroadcastChannel carries invalidation hints without private payloads. No external network, third-party assets, polling, idle timer or service worker is present.

The fixture server is another browser store. It has its own recording clock, current access/publication/roster/mark versions, immutable receipt and applied-batch count. Tests may deliberately advance those **fictional** states. They do not validate current SQL/RLS or actual authenticated server reconciliation. The account controls are **simulated verification**, and all fictional storage is **unencrypted**; UI hiding is not confidentiality. The actual private app adapter must not reuse this test implementation or copy native Keychain guarantees into a browser.

## Reference practice

Rechecked read-only PYSA `pysa-platform/lib/pwa/offline-sync.ts`, audit WF-0005, EV-0041 and EV-0116. Useful: explicit ownership, pending/conflict/retry state and visible sync outcome. Known defects to avoid: a failed/aborted queue write acknowledged like success; incompatible app/worker database versions; incomplete actual server-replay proof. Its24hour registry helper and retry frequencies are **not** AcademyOS policy.

Rechecked Shift staging native `EncryptedEditJournal.commitSchedule/sealScheduleTransport/confirmScheduleTransport/retainPendingForLogout`, `DurableScheduleEditor.synchronize` and `JournalSessionController` under `/Users/moamenghareeb/.codex/worktrees/shift-super-app-reliability/Shift Super App`. Preserve atomic journal-before-ack, original packet, version conflict and pending-versus-projection cleanup concepts. Native personal-account encryption/key/file protection, seven-day lease and prior synthetic tests are reference evidence only; no Shift source or private data was copied or changed. [Earlier detailed reference and its limits](../04-engineering/shift-ios-local-data-reference-review.md).

## Bounded retrieval, freshness and measurement

| Layer | This preview / required runtime contract |
|---|---|
| Review artifact | One standalone local HTML, no external data/asset request; same-origin IDB only. Fake server exchanges are local method calls, not Vercel/Supabase request savings |
| Editing basis | Exactly one complete18-player fictional roster; only17new marks may be selected in this fixture. No full directory or whole-app preload. Runtime retains existing bounded roster/API contracts until a versioned replacement is accepted |
| Navigation / selection | Register ↔ saved work, EN/AR, theme and covered row choices need no fixture transport. They do not establish permission or refresh private runtime authority |
| Capture | One IDB transaction for complete selected intent+projection; no operating API request. Await transaction completion before local acknowledgement |
| Reconnect / unknown | One scoped leader; same original operation; exact current checks and receipt. No repeated blind writes or new ID; definitive conflict remains held, not retried in a loop |
| Freshness | Show last downloaded basis separately from device capture time and authoritative recording time. Browser time never settles a conflict or extends a deadline. Known denial overrides reuse |
| Proposed runtime budgets | Preserve declared first useful task p75≤3s, local feedback p75≤200ms, ordinary reads p95<800ms and CLS≤0.1 under an explicit profile. Real journal durability, reconnect latency, byte/SQL/limiter/provider costs must be measured during implementation. None is declared passed from these fixture checks |

No new operating API, Supabase RPC, manifest/receipt discovery endpoint, queue telemetry or cached auth is introduced. Unchanged record reuse, missing/changed-month bootstrap and current online read budgets stay in their own accepted/implemented checkpoints.

## Verification and remaining gates

The [final source-specific checks](../../design/offline-register-preview/evidence/checks.json) cover real browser transactions/abort, network-disabled capture, browser process restart, original replay, atomic conflict/deadline/publication refusal, bad receipt, receipt-transaction abort, account/cleanup UI, concurrent tabs,17new marks in the18-player roster, retained dirty input and24EN/AR dark/light layouts at320/360/390/768/1280/1440px. Screenshots remain outside Git. Initial tests found dialog return/containment issues and a collapsed-review-controls test setup error; those were corrected before the recorded final pass. These are synthetic review checks, not real encryption, hosted offline, physical device, screen reader, quota/eviction/migration or broad performance evidence.

**Owner design acceptance recorded:** “Approve this connected offline-register design for implementation.” The exact approved HTML/source hashes and scope are in the [approval receipt](../07-handoff/evidence/offline-register-design-2026-11-03.json). This is the implementation reference for this connected slice, separate from private implementation, working acceptance and security readiness. Do not ask for the same design again.

Next, follow the [actual-source runtime/key readiness packet](../04-engineering/offline-register-runtime-readiness.md) and finish exact personal-device/key/unlock/field and authenticated sync/operation-discovery readiness with LF-P01–LF-P06; then implement a bounded private repository/journal/transport slice in EX-06/04/03. No inactivity lock,24hour read cutoff or pending-edit expiry may be invented. Browser encryption/key custody, shared-device policy, known-denial recovery, logout failure, migration and eviction are an independent security gate. EX-11 real operating cases, deployed source, hosted verification and Owner working acceptance remain separate.
