# Selected reference and visual baseline

23 October 2026. Latest owner instruction selects `/Users/moamenghareeb/Downloads/AcademyOS_MacOS_Refined_Complete/AcademyOS_MacOS_Reference_Matched.html`. The selected reference controls appearance and demonstrated interaction patterns, not business policy. Every sample person, price, scope and action remains fictional.

The supplied HTML, README, showcase and nine screenshots are copied unchanged under `../reference/`. [The manifest](../reference/source-manifest.json) records source paths, size and SHA-256 checksums. HTML SHA-256: `6941598aa7ecfe25b8f44e5b81ba20ee4fc4acaf119626a3c92e93f08d68ccb9`. Inspection evidence was added in a separate folder and is not part of the original bundle.

This owner instruction supersedes the visual defaults in the historical UI/UX specification and ADR-010: compact blue controls replace the earlier teal palette, 18px cards and larger desktop text targets for this design branch. Historical evidence is preserved. This does not approve every reference screen or its business behavior.

## Extracted final cascade

Use final overrides, not the earlier CSS declarations. System/SF/Segoe/Arial stack; body 13px; page heading 22px/1.15, weight755; subtitle12px; table12px; header10.5px; ordinary action11px and31px height; small action10px and27px; controls6px radius; work cards8px. Sidebar218px, toolbar43px, inspector360px, window13px radius. Primary blue `#075bea`, semantic accent `#075bee`, ink `#172941`, border `#e7ecf2`, neutral surfaces. Preserve density and restrained information hierarchy.

The macOS frame remains a presentation treatment in the new prototype. No recommendation to make it mandatory in the final application has been adopted. Mobile forms use 44px touch controls and a dedicated single-column flow; this is a targeted phone treatment, not blanket desktop enlargement. Font fallback, contrast and Arabic need actual review; no accessibility pass is inferred from CSS.

## What the reference actually contains

[Reference inventory](reference-inventory.csv) maps 31 unique view IDs across 48 role/view combinations for six role contexts. The full supplied reference was opened locally and rendered before browser access became unavailable. [Inspection evidence](../reference/inspection/source-inspection.json) records computed tokens, role/page coverage and interaction probes. The supplied showcase/screenshots were inspected as visual evidence. Static source inspection found no outbound API calls or external assets; this is not a security audit.

Useful visual references include Requests, academy directory, subscriptions, setup, players, calendar, service operations, trainer Today and family home. Most have incomplete action/state coverage. Missing or insufficient areas include private media, full identity recovery entry, detailed scheduling changes, financial reversals, complete exports/privacy handling and role-specific phone journeys.

## Observed gaps to avoid copying

- Requests inspector ignores close state; checkbox selection is conflated with row inspection.
- Academy directory View switches persona; handoffs can retain hardcoded Riverside context.
- Setup shortcuts mark tasks complete without required records.
- Final calendar ignores newly added sessions and opens the same roster.
- Service row and inspector health can disagree; unknown metrics need explicit treatment.
- Final toolbar removes a settings entry point; some source dialogs may be unreachable normally.
- Arabic is partial and falls back to English in dialogs. Fixed body minimum760px breaks phone layouts.

New prototype source addresses bounded admission/context/setup behavior only. Other reference defects remain tracked for later batches. Rendered correction evidence for the new prototype is pending.

### Current owner correction — 24 October 2026

The red/yellow/green macOS window controls are excluded from the web app and active prototype by explicit owner instruction. Earlier retained-frame descriptions and original reference assets are historical; keep compact blue styling and genuine web navigation. The original reference files are preserved unchanged.
