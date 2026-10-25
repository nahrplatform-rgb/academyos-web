# Shared visual and interaction patterns

The owner-selected baseline is [recorded here](reference-baseline.md). Tokens and visual primitives live separately from platform and onboarding domain views. No production component architecture is prescribed by these files.

| Pattern | Contract |
|---|---|
| Context shell | Separate platform/academy navigation. Show academy and role; branch/timezone at the relevant task. Switching never silently adopts another academy's draft. |
| Compact action hierarchy | One primary commit action at the working form/review. Secondary cancel/back and recovery controls use neutral treatment. No unapproved destructive undo. |
| Lists and inspection | A named row button opens inspection; a checkbox changes only the bulk set. Visible-row selection and matching-result selection have distinct labels. Selected count is explicit. |
| Bounded retrieval | Working demonstration uses tiny local synthetic lists and a25-row visible bound. Production search/pagination must follow L01–L03 and authorize every projection. Complete-result bulk selection needs server scope confirmation before any later bulk mutation. |
| Inspector | Secondary detail, status, consequences and operation history; explicit close. Phone opens detail as a page, not a squeezed inspector. Tabs need keyboard/browser review. |
| Forms | Visible labels, required fields, preserved values after validation; explicit review before access-related commits. Error summary receives focus. Per-field linked errors remain a review improvement. |
| Saved/pending/unknown | Local saved receipt is explicitly simulated. Delivery pending/failure is independent. Unknown outcome offers original-operation check before replacement; no blind resend. |
| Loading/error | Deterministic review controls show reserved content, retry and access-change states. A manual advance ends simulated loading. No latency or server-performance claim. |
| Empty versus unavailable | Empty requires a successfully known local list. Failed reads show a recoverable error, not zero memberships/balance/stock. |
| Drafts and refresh | Saved fictional steps survive current-tab refresh; unsaved drafts do not. Leaving an edited form asks before discard. Context switching clears incompatible form intent. Storage is demonstration-only. |
| Private files | Later batch: scoped upload progress, processing/quarantine, per-file partial result, authorized preview, expired download recovery; not built in Batch1. |
| Timeline | Safe synthetic operation references and explicit timezone. No tokens/private payloads. Real audit must be authoritative and access controlled. |
| Arabic | Logical placement, mirrored directional arrows, natural full sentences, isolated LTR emails/IDs/timezones and Arabic sport labels. Native review pending. |
| Phone | Single task column, no desktop sidebar or inspector;44px form/control targets. Trainer/guardian dedicated task homes are Batch2, not completed by this setup view. |

Five quality dimensions are evaluated independently: usability (task understanding), speed (first useful action), correctness (current scope/state), cost (bounded work) and recovery (safe continuation). Security/privacy is its own gate. Rendered contrast, reflow, keyboard focus, touch, screen reader and zoom checks remain pending.
