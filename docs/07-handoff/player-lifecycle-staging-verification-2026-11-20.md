# Player Archive/Restore Staging Verification Checklist

## 20 November 2026 · EX-07 / MP-B01 · Player Lifecycle Local-to-Staging Handoff

### Staging Readback

- Vercel resolves `staging.academy.nahr.dev` to Ready deployment `dpl_31eebZ6fqy4rzhpi7hXBjQwX8L79` at `4bedab305625625f894049871b68e4c20f78bbd8`.
- The synthetic staging migration ledger contains `20261120072229` (name correction) and `20261120170705` (profile and lifecycle).
- Vercel lists `PLAYER_NAME_CORRECTION_TRIAL` and `PLAYER_PROFILE_LIFECYCLE_TRIAL` as sensitive settings on the existing staging deployment target. The earlier handoff reported lifecycle enabled. Current effective values still need signed-in runtime verification. The provider returns `true` for the private-profile setting on that target.
- Foundation passed for `823f2de`. The subsequent layout commits failed Foundation. Use a checked successor for the consolidated workflow.

### Required Staging Steps (Owner-controlled)

1. **Owner promotion** of the checked successor to the staging alias.
2. **Signed-in synthetic verification** as Academy Owner in a synthetic academy.
   - Open a Player profile → Actions tab → Archive player button visible
   - Archive a player with NO active/future roster commitments → Success
   - Verify "Archived" badge appears on profile
   - Switch to "Archived players" view → Archived player appears
   - Restore archived player → "Player restored" status
   - Verify the active directory omits the player while archived and includes the player after restore.
   - Attempt archive on player WITH future commitment → "Resolve commitments" message
   - Version conflict: stale save → "Player changed" message
   - Reconcile original after dropped response → same original ID, no duplicate

### Local Evidence

- `PlayerLifecycle` component: archive/restore with confirmation, reconcile, commitment check
- `verifyLifecycle()` in people-workspace.tsx: refreshes directory after state change
- `switchArchiveView()`: toggles between active/archived directory
- API route: gates RPCs on `PLAYER_PROFILE_LIFECYCLE_TRIAL` flag
- `people.ts`: validates `setArchived` action with version and archived boolean

### Not in Scope

- Bulk import (MP-Q21, deferred)
- Sport-scoped member IDs (multisport dependency)
- Real-data retention (no retention period approved)
- Archive with unresolved commitments (blocked by design)
