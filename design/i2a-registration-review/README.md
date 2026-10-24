# I2a fictional registration — connected design review

Policy accepted 24 October 2026. Design review pending; no business functionality implemented by this artifact.

Build with `node scripts/design/build_i2a_review.mjs`, then serve this folder on localhost. The preview reuses actual WorkspaceShell/Button/Input/Select and CSS, with a local link adapter and clearly labelled fictional in-memory model. It has no fetch, authentication, API, database, localStorage/sessionStorage, invitation, grant or outbound asset. Refresh resets drafts and records.

Path: Players → Register player → name/optional `@example.invalid` contact → scoped same-name candidates → open existing or explicitly confirm different person → review → simulated save → fictional profile. Try `Alex Demo` to see an existing candidate. EN/AR language control preserves the draft. Use the review scenario selector for empty, access removed, failed directory, save failure, lost response and a new concurrent same-name record. Pending and uncertain states explain recovery; profile contact remains unverified and grants no authority.

See [policy](../../docs/06-delivery/i2-people-first-slice-decisions.md) and [data/security/performance contract](../../docs/06-delivery/i2a-registration-design-contract.md). No real child/customer data. Prototype model outcomes are not API/database evidence or implementation acceptance.

## Review evidence

[Browser check receipt](evidence/browser-review.json) records the manually checked simulated paths. Screenshots: [form](evidence/registration-form-en.png), [review](evidence/registration-review-en.png), [Arabic phone review](evidence/registration-review-ar-phone.png), [uncertain save](evidence/uncertain-save-en.png), [Arabic save failure](evidence/save-failure-ar-phone.png).

Prototype TypeScript and source-manifest hashes passed on 24 October 2026. The phone viewport request was 360px but the observed in-app DOM width was 400px, without horizontal overflow; exact 360px, physical devices and screen readers remain open. These checks do not validate real persistence, security, concurrency or performance budgets. The product source and database were unchanged.
