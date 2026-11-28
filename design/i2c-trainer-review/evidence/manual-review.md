# Trainer design preview verification — 25 October 2026

Design simulation only. No live API, persistence, email, permission or provider behavior was tested or changed.

Observed in the in-app browser:
- Owner draft requires intended email and explicit branch/role approval before review; exact review shows name, recipient, fixed Trainer role, branch and 72-hour acceptance boundary.
- Simulated committed response loss disables replacement and offers original-operation reconciliation; reconciliation reveals the pending appointment.
- Simulated Trainer without verified-email fixture sees verification guidance without staff name, branch or email.
- After verification and explicit acceptance, own profile shows only staff name, Trainer role and branch; dated sessions are explicitly unavailable.
- Owner ending requires reason and review, shows disabled pending controls, then ended state without a restore shortcut. Switching to Trainer shows generic access unavailable without private profile fields.
- EN/AR switching preserved the appointment review. Arabic content containers have RTL direction and the recipient uses LTR isolation.
- Requested 390×844 viewport measured 433 CSS pixels wide in this browser, with document scrollWidth 433. Arabic review and denial screenshots capture this observed width; this is not physical-phone or 390-pixel proof.
- No browser console errors were captured at the final check.

Standalone TypeScript check, reproducible preview build and implementation-register validation passed. Shared source hashes are in ../source-manifest.json.

Other scenario controls are design references; not every fixture permutation was manually exercised. Wrong-account/branch, suspended/expired/revoked and delivery/duplicate cases still require real implementation tests after design approval. Performance targets in the design contract are proposed budgets, not measured product results. Physical-device accessibility and independent security review remain separate.
