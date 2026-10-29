# Connected redesign preview — local verification, 29 October 2026

## Delivered and current status

The [single-file connected proposal](AcademyOS-connected-preview.html) is ready for the consolidated design review required by the Owner's accepted plan. Its source, generated coverage, manifest and [per-destination delivery status](delivery-status.csv) are synchronized. This is proposed experience, separate from [the factual current-source review](../app-experience-review/AcademyOS-experience-review.html).

| Evidence layer | Result |
|---|---|
| Design | 30 review destinations; consolidated Owner review pending |
| Preview implementation | Standalone fictional simulation; dark default/light, EN/AR, role homes and connected task journeys |
| Product implementation | Not started for this redesign; existing app and prior functional approvals preserved |
| Local design checks | 300 responsive cases; 309 applicable exceptional-state cases; 21 recorded journey/state groups |
| App deployment / hosted verification | None in this batch |
| Working-feature Owner acceptance | Pending later product implementation and hosted review |
| Security / physical device / broader accessibility / performance | Separate gates, not established by this preview |

## Checks actually run

- Chromium layouts: all 30 destinations × EN/AR × 320, 360, 390, 900 and 1440px. No document-level horizontal overflow in those cases. The [rendered-control inventory](evidence/rendered-control-inventory.json) records visible initial controls per layout; it is not an exhaustive inventory of every possible dynamic rendering.
- Representative connected stories: duplicate comparison and deliberate separate registration; 40-date automatic program-check gate and all-date access; 39 all-or-nothing plan changes preserving one individual plan; exact publication audience; moved-session reason/history; 18-player direct register; correction review; feedback return/revision/publication and family-only view.
- Actual local-state unknown-write branches: lost reply after local commit reconciles once; lost reply before commit retains choices after the attempt is closed. Pending states prevent replacement. These are simulation assertions, not API/database atomicity proof.
- Card replacement invalidates the old specimen; selected scan scope narrows matching; adjacent-session marks stay distinct. Adjacent Football/Skills appointments have overlapping scanning windows, not an illegal overlapping player/Trainer booking. Session overrides survive changes to academy scan defaults.
- Calendar mode/selection survive task return. Phone native detail dialog Escape restores focus. Ended family link clears private content; published family feedback excludes the private staff review. Future family session says Scheduled rather than Absent.
- Dark/light: 16 intended text/surface token pairs each ≥4.5:1. Actual smallest ratios: dark 7.09:1, light 5.41:1. This does not establish contrast of every composite/disabled/focus state or a full accessibility audit.
- No browser script errors or external requests in the local suite. HTML fingerprint in [the machine receipt](evidence/checks.json) matches the tested artifact.
- Implementation-register validation: 68 screens, 30 stable action groups, 180 retained requirements. Actual-source review freshness check passed; no product UI changed, so current captures were retained.

Representative captures: [Owner desktop](evidence/ownerhome-en-1440.png), [Arabic phone register](evidence/attendance-ar-390.png), [training desktop](evidence/training-en-1440.png), [Guardian desktop](evidence/guardianhome-en-1440.png), [dark](evidence/spectrum-dark-1440.png), [light](evidence/spectrum-light-1440.png). Captures use fictional records only.

## Review limits and next gate

This is a local design simulation with deliberately bounded fixtures. It is not the live app or an implementation of new role projections, authentication, camera decoding, email, signed preview receipts or persistence. The review toolbar controls fictional actor/scenario/story/response transitions and is outside the proposed product. It must never be copied into production UI.

Desktop/phone screenshots and viewport emulation do not prove physical-device behavior, outdoor camera use, an open phone keyboard, native browser 200% zoom, assistive-technology support or native-Arabic usability. Those remain explicit checks for the implementation batches. No live query/payload cost, LCP/INP/CLS, load capacity, tenant isolation, concurrency, provider delivery or independent human security verdict was measured here.

The preview demonstrates representative record lifecycles using one main synthetic program and a small adjacent-session scanner specimen. It is not a multi-program concurrency test. The supplied coverage links parent requirement/action families without retiring or claiming complete fulfillment of them. Finance, communication/media, Manager/Player operations and offline work remain visibly future scope.

After consolidated design approval: implement shared foundations and the attendance/training/publication reference journeys, then scoped homes/calendar and remaining journeys. Compare matching role, data state, locale and viewport to this reference; update the factual review and individual implementation/hosted/acceptance receipts after each real batch.
