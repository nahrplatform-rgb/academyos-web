# Role-specific sitemap

This inventory preserves the canonical [screen catalog](../../../docs/03-design/screen-and-navigation-catalog.md) IDs. S59–S68 are proposed additive design IDs in the local coverage matrix, not silently renumbered canonical screens. Navigation availability must follow release, authority and capability; source presence does not mean a feature is live.

| Context | First useful destination | Navigation and connected work |
|---|---|---|
| Identity | S01 sign-in → S02 intended invitation or S03 explicit academy/role choice | S04 profile/security; S05 notifications; S63 recovery; S64 no membership/suspended/unavailable |
| Platform Owner | S06 current decisions/incidents; S59 admission queue | S60 academies → S61 creation → S62 appointment receipt; S07 tenant metadata/lifecycle; S08/S09 commerce; S51–S58 Services & Operations; S35 support; S10 access/audit; S67 ownership/lifecycle |
| Academy Owner | S13 resumable setup, then S11 operational priorities when available | S14 settings; S15 branches/sports; S16–S21 people/authority; S22–S29 training; S31–S32 development; S36–S45 three separated financial domains; media, reports, support |
| Manager | S12 permitted branch tasks/coverage | Permitted people, schedule, rosters, attendance and review actions; no implied owner approval, compensation or cross-branch authority. No M1 setup writes. |
| Trainer | S27 next assigned dated session → S24/S28 complete roster/attendance | Sessions, evaluation drafts, self statement S44, planned sync S30, updates/help. Dedicated phone journey in Batch2. |
| Guardian | S46 authorized child context and next required action | Children S17/S19, schedule, attendance, published progress S32, permitted payments S38 only with payer authority, updates/help. Dedicated phone journey in Batch2. |
| Player | S47 personal next session and published goals | Personal schedule/progress/help subject to D-004/D-015; no invented age threshold. |

Batch1 connected source: platform queue/directory/create/review/receipt → fictional recipient invitation → context chooser → owner checklist → branch/timezone → sport labels → final review → setup-complete receipt. Language and theme preserve synthetic state. Academy setup does not enable commerce or operations.

Later domains remain in coverage: communication composition/delivery S65, imports S66, media, support internal/customer separation, inventory movement, complete-scope reports/exports and privacy outcomes. S68 native concepts stay later evaluation under ADR-009/D-020; a responsive web preview is not a native app.

## Final studio navigation

All19 requested domains now have connected or explicitly policy-gated source paths. The studio registry links identity/authority, training changes, evaluation/progress, three financial domains, communications/media/support/inventory, reports/privacy, complete Services & Operations/incident, preferences, imports/archive and later offline/native concepts. See [final handoff](batch-5-final-handoff.md) for exact route, role, device and evidence boundaries.
