# EX-02: stable workspace lifetime and current online-read ownership

2 November 2026. Authorized independent work alongside the current EX-10 policy checkpoint. The connected local-data design is approved; inactivity locking is rejected. The latest Owner direction also includes month/three-month preparation, offline local edits and reconnect/conflict handling. These expand the target but do not implement private storage or settle each domain's offline authority. See [the local-data plan](../06-delivery/local-data-and-sync-plan.md).

## Bounded outcome

Establish one principal/academy-bound client read owner above the changing task routes, first consumed by Home/Calendar and individual-date planning. Current no-store APIs, server authorization and task-owned writes remain canonical. Same-key concurrent reads can share one transport while each consumer retains cancellation ownership; completed projections are not cached. This is the workspace/repository lifetime seam required before durable storage, not a replacement for that storage or a claim that all current loading is fixed.

Joins: IMP-J01-A01/J01-A01, IMP-J09-A01/J09-A01; S03/S22/S23/S25; L01/L04/L07; SEC-J01/SEC-J09; existing AO/AT associations retained by the implementation matrices. Findings NR04/NR14 and G01; WB-04/07/12/14/15; planned WD-03/17/18/20/33 remain wider than this checkpoint. No parent finding or planned working-day case is completed from this seam.

## Existing source and reference

- Root `app/layout.tsx` already owns ClerkProvider. Protected pages already call `auth.protect`; the new layout must not add a second membership/bootstrap request or move authorization into a cached layout.
- `experience-workspace.tsx` owns current reads, generation/abort guards and local navigation preferences; `date-planning-workspace.tsx` owns current plan/candidate reads, dirty intent and unknown-operation identity. Existing `visible-resume.ts` pairs visible/focus events without a freshness timeout.
- `workspace-shell.tsx` and its presentation provider are still route-owned. This batch does not transplant every frame or hold unmounted domain pages alive. Shared read-owner persistence and shell DOM persistence are separate measurements.
- The isolated actual Next baseline at source `a7f955f` passed EN/AR navigation/dirty/unknown assertions. Its diagnostic shell sequence remains1/2/3/4 mounts across Home/Calendar/date/return, with one browser document; this is not evidence of repeated Clerk/DB calls.
- PYSA read-only: `pysa-platform/lib/query/query-client.ts`, `components/manager/schedule/schedule-calendar.tsx` and audit WF-0004/0005. Scoped window keys and explicit connected tasks are useful; query-memory defaults and partial offline tests are not durable storage or permission policy. No reference source/private data changed.
- Shift mechanism review remains [SR-01–SR-12](shift-ios-local-data-reference-review.md). Its single scoped lifetime/generation ownership is relevant; no personal/native lease, key, timer or queue authority transfers.
- [Next layout reference](https://nextjs.org/docs/app/api-reference/file-conventions/layout), checked2November2026: shared layouts may be reused on client navigation. Therefore server authorization remains in the existing protected pages and API/data boundary; the client boundary listens to current identity changes rather than treating layout reuse as authority.

## Ownership and trust boundaries

The academy layout supplies only the validated route identifier. A client boundary keys its owner to the currently loaded Clerk subject and academy. Changing subject, uncertain identity, leaving the academy or replacing scope cancels obsolete pending reads. No cached membership, account grant, private payload persistence or token storage is introduced.

Within that owner, keys include the presentation capability partition, exact allowlisted read action/path and canonical request parameters, including link/period/cursor/target. Capability labels partition work; they never grant server authority. Body/URL parameters still pass the unchanged signed gateway and current database checks. Commands, signed reviews, reconciliation and side effects must not enter the shared read path.

Each caller owns an abort subscription. One caller leaving cannot abort another required caller; the last departure cancels the browser transport. A cancelled/obsolete completion cannot replace a newer same-key entry. Known denial/setup-required invalidates pending reads in that capability; other roles are not automatically revoked. No successful result remains in the owner after settlement. Consumer values are isolated copies, not a shared mutable projection.

No inactivity timer, automatic retry, polling, background preload, new auth call, private disk, local lease, new service or dependency. The existing15second transport timeout is a request timeout, not an idle lock. Aborting fetch does not establish stopped RPC/SQL/limiter work.

## Budgets and acceptance

- Cold Home: existing1Home read. Cold Owner Calendar: existing1current-Calendar read. Explicit period: existing1Calendar read. Dated return from Home/Calendar: existing1plan read, no hidden directory request. No layout/bootstrap API request.
- Identical concurrent read consumers:1transport; different capability/link/period/cursor/academy/subject remain independent. This is a controlled concurrency case, not proof that each current user click previously made duplicate requests.
- Navigation after a read settles still requires the current read. Zero-page local reopening requires EX-06/04; this seam alone must not be called offline/local-first completion.
- Preserve current dirty/busy/unknown navigation, original-operation reconciliation, denial masking, focus/scroll/local controls, and exact server business outcomes. Writes remain on existing code paths.
- Verify isolated production Next route lifetime and identity/scope switches; unit cancellation/refcount/error/no-retry/fresh-read/mutation-exclusion cases; affected component suites in both locales and React modes; canonical/factual freshness and normal build/type/lint.
- Local synthetic identity/HTTP is not Clerk/provider/RLS proof. Record source/CI/deployment/hosted/Owner/security separately. Rollback is reverting this scoped seam; no migration or stored private data needs repair.

Result/evidence will be linked from [the execution tracker](../06-delivery/experience-execution.csv). Remaining exact local-device/key/read-access decisions and domain-specific offline-edit design stay in EX-10/09; safe current-online implementation need not wait for private enablement.
