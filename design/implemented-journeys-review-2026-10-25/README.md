# AcademyOS implemented journeys — connected design review

25 October 2026 · **Design proposal; awaiting Owner review.**

**Correction: the original reference is the exact structural and visual foundation.** See the [reference foundation contract](reference-foundation-contract.md). The first card-oriented review layout is superseded; the active prototype restores navigation → main work area → contextual inspector. Keep the compact-blue foundation and refine the connected experience around the business functions already implemented. The next step is Owner review of this packet, followed by bounded presentation work in the implementation chat. Dated training is outside this packet.

- [Reference foundation contract and correction](reference-foundation-contract.md)
- [Review and prioritized findings](review.md)
- [Findings register (CSV)](findings.csv)
- [Refresh and original-operation policy](refresh-policy.md)
- [Acceptance cases and exceptional states](acceptance.csv)
- [Journey/source/matrix overlay](journey-overlay.csv)
- [Implementation handoff](implementation-handoff.md)
- [Connected prototype](prototype/index.html)
- [Correction verification receipt](evidence/reference-correction-verification.md)
- [Earlier verification receipt (superseded layout)](evidence/verification.md)

## Review the prototype

Open `http://127.0.0.1:8765/prototype/index.html` while the local review server is running. Or serve this folder with `python3 -m http.server 8765 --bind 127.0.0.1 --directory design/implemented-journeys-review-2026-10-25` from the repository root. The active `prototype/` is the corrected revision. All assets are local; there is no API, identity provider, email or persistence integration. Browser reload resets the demo. `prototype/build.cjs` rebuilds with the repository's existing React/esbuild dependencies; it reads but does not modify app components.

Start at admission → inspect/create/review → Owner invitation → workspaces → resumable setup (separate branch/timezone and bilingual sport saves) → players or Trainers. Player → guardian appointments connects the guardian path. Recipient transitions are explicitly labelled **Demo** and switch fictional fixtures/personas; they are not a product role switch. Open **Review journey & exceptional states** to choose every proposed screen, EN/AR and applicable exceptional states. Operation recovery is a deliberate action; ordinary Refresh view never reconciles a write.

The corrected prototype uses a shared reference-based frame and semantic table, reusing current `Button`, `Input`, `Select`, `StatusBadge` and `TimezoneSelect`, with a local anchor adapter for Next Link and a copied, hashed baseline stylesheet. Proposed presentation overrides and fixture journey content remain isolated here. It is not an implementation branch or replacement functional app.

## Scope guard

No functional app source, permissions, database, provider configuration or deployment was changed. The implementation plan and compact-blue foundation received append-only Owner correction notes; existing text and concurrent work were preserved. The initial working tree was captured before writing this folder. Existing uncommitted design, handoff and matrix work was preserved. Previous M1/I1 and narrow I2a/b/c approvals remain valid for their recorded scope; they do not approve this new presentation or close broader security/device/workload gates.
