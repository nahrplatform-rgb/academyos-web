# Device/passkey diagnostic — fictional data only

3November2026. Prepared after the Owner chose **Investigate device/passkey unlocking first**. This is a diagnostic, not the working AcademyOS app or an accepted private-key implementation.

Start `node scripts/design/serve_device_unlock_probe.mjs`, then open [the local diagnostic](http://localhost:3239/design/device-unlock-probe/index.html) in the browser/device being tested. Keep this exact **localhost** address and port; do not use the127.0.0.1alias or a production/staging RP. The loopback server serves only the diagnostic HTML. No app API, sign-in, email, membership, real child/customer record or paid service is used.

## Owner handoff before a real credential

Loading the page **does not create a passkey**. The agent must not press Create on a real browser profile. The Owner must explicitly agree to creating a diagnostic credential for **localhost**, tick the impact checkbox, press **Create diagnostic passkey** and perform any browser/provider/Touch ID step themselves. This stores a real test credential in the provider they select; it is not an AcademyOS account credential or access grant. Research approval by itself does not authorize that creation.

The diagnostic uses a fictional identifier and one fictional encrypted record. Do not type account passwords, passphrases, codes or real personal details. PRF output and raw encryption keys are neither logged nor sent by this page; only public credential metadata, salts, wrapped key and ciphertext are stored in this test origin. Actual provider/OS services may have their own network/sync behaviour, so no blanket “zero provider activity” claim is made.

## Test sequence after the explicit handoff

1. Create one diagnostic passkey. Read **PRF available for that credential**. A browser/passkey that supports sign-in may still report Unsupported here. Stop rather than accepting a silent plaintext or local-passphrase fallback.
2. If Available, press **Save encrypted sample** and complete its device prompt. Check **Encrypted sample stored: Yes · ciphertext**. Enrollment alone is not a saved-record result.
3. Reload/reopen the same address. It must say **Not tested this visit**, rather than falsely claiming the old unlock is still valid. Press **Unlock existing sample**; the exact fictional record should match.
4. Test a cancellation using the browser/device's normal Cancel, then retry explicitly. Do not deliberately fail biometric checks repeatedly; device lockout/recovery is a different case and may need the OS's usual PIN/password flow.
5. To check disconnected operation, turn off the external connection yourself while keeping the loopback server running; reopen the page and/or unlock the stored sample. Record the actual device/browser/provider and state. This local-server test is not proof that the hosted Next.js app can cold-launch without its server/assets.
6. **Remove local diagnostic data** deletes only this fictional test database's records after confirmation. The provider passkey remains. Remove that named localhost test entry from the provider yourself if desired. The page cannot truthfully claim to delete it from the OS/cloud.

If creation succeeds at the provider but local metadata storage fails, the credential can still exist there. The page reports this rather than pretending enrollment never happened. Failed unlock/storage preserves the existing encrypted sample; it never silently resets a key or purges work.

## Evidence and boundaries

[Diagnostic UI checks](../../docs/07-handoff/evidence/device-unlock-probe-2026-11-03.json) bind the HTML and harness hashes. Reproduce with `node scripts/design/test_device_unlock_probe.mjs` using Node24. These checks use an isolated Chromium virtual authenticator, not the Owner's profile: explicit enrollment, ciphertext storage, reload/network-disabled unlock, visible cancellation/retry, honest cleanup/unsupported states, keyboard modal and8EN/AR viewport combinations.

[Mechanism investigation](../../docs/04-engineering/passkey-local-unlock-investigation.md) separately retains the repeated-verification/lockout recovery gap. No real Touch ID, iCloud Keychain, Safari, Windows Hello, Android, hardware-only guarantee, passkey loss/rotation or account-bound pending-work recovery is proven by virtual tests. Independent security remains open. No private app data is enabled and no staging promotion is required for this local diagnostic.
