# Player Archive/Restore Staging Verification Checklist

## 20 November 2026 · EX-07 / MP-B01 · Player Lifecycle Local-to-Staging Handoff

### Current State

- **Local commit:** `6bcc672` (docs/runtime safety), product source at `823f2de` (Players lifecycle)
- **Staging alias:** `dpl_3L6vyUgDCHA5CtJfca3ZDbt8pJHC` (43056bc, private trial on)
- **Lifecycle migration:** `20261120170705_player_profile_and_lifecycle.sql` — NOT yet applied to staging
- **Lifecycle trial flag:** `PLAYER_PROFILE_LIFECYCLE_TRIAL=true` — set locally, NOT yet in staging
- **Local verification:** All 119 unit tests pass; navigation/device/keyboard/public suites passed

### Required Staging Steps (Owner-controlled)

1. **Apply lifecycle migration** to synthetic staging:
   - Migration: `20261120170705_player_profile_and_lifecycle.sql`
   - Adds `archived_at` column to `academy.players`
   - Adds `i2_set_player_archived_v1()` RPC
   - Adds `i2_archived_people_v1()` RPC
   - Existing 995 rows remain active (no data loss)

2. **Enable trial flag** in staging environment:
   - `PLAYER_PROFILE_LIFECYCLE_TRIAL=true`
   - This gates the `i2_archived_people_v1` and `i2_set_player_archived_v1` RPCs

3. **Owner promotion** of candidate `823f2de` (or successor) to staging alias

4. **Signed-in synthetic verification** (Academy Owner, synthetic academy):
   - Open a Player profile → Actions tab → Archive player button visible
   - Archive a player with NO active/future roster commitments → Success
   - Verify "Archived" badge appears on profile
   - Switch to "Archived players" view → Archived player appears
   - Restore archived player → "Player restored" status
   - Verify active directory omits archived player
   - Attempt archive on player WITH future commitment → "Resolve commitments" message
   - Version conflict: stale save → "Player changed" message
   - Reconcile original after dropped response → same original ID, no duplicate

### Local Evidence

- `PlayerLifecycle` component: archive/restore with confirmation, reconcile, commitment check
- `verifyLifecycle()` in people-workspace.tsx: refreshes directory after state change
- `switchArchiveView()`: toggles between active/archived directory
- API route: gates RPCs on `PLAYER_PROFILE_LIFECYCLE_TRIAL` flag
- `people.ts`: validates `setArchived` action with version and archived boolean

### Blockers

- Staging migration application (Owner-controlled)
- Trial flag enablement in staging (Owner-controlled)
- Owner promotion (Owner-controlled per standing policy)

### Not in Scope

- Bulk import (MP-Q21, deferred)
- Sport-scoped member IDs (multisport dependency)
- Real-data retention (no retention period approved)
- Archive with unresolved commitments (blocked by design)