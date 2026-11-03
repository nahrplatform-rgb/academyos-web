# Device/passkey local unlocking — investigation, not enabled

3November2026. The Owner selected **“Investigate device/passkey unlocking first.”** This does not accept the separate local-passphrase proposal or authorize creation of a real passkey, modification of Clerk/Vercel credentials, an app access grant or private-data enablement. Keep the approved offline-register design and current online app intact.

## Conclusion at this checkpoint

The **WebAuthn PRF** mechanism is a credible direction to investigate: selected disposable Chromium/virtual-authenticator cases can derive a wrapping key, seal fictional data in IndexedDB, reload the page and unlock while the network is disabled. **It is not ready to enable.** One virtual verification-failure recovery case remains unresolved, and no actual Mac/iPhone/Android/passkey-provider behaviour has been established. [Source-specific evidence](../07-handoff/evidence/passkey-unlock-research-2026-11-03.json) records8passed/1failed research checks; the script exits nonzero while that recovery case is open.

Run `node scripts/design/investigate_passkey_unlock.mjs` using Node24 to reproduce. It creates a disposable headless browser, a local loopback page and virtual credentials only, then closes them. No real browser profile, OS credential, account, private record or app origin is touched. It never records PRF output, wrapping/data keys or signing private keys. The test is intentionally a research diagnostic rather than a required green CI regression until the recorded incompatibility is understood; do not hide its nonzero result or call it a pass.

## What the standards establish

An ordinary passkey proves authentication; it is not automatically a usable encryption key. The optional PRF extension provides credential-bound output suitable as key-derivation input where supported. Registration reports availability for the particular credential, and authentication must actually return the requested output. Do not infer support from the existence of `PublicKeyCredential`, a biometric button or a browser-brand table. PRF results can be included in serialized credential JSON: local encryption output must be stripped from any remote registration/authentication payload rather than forwarded to Clerk, logs or analytics. [W3C WebAuthn3 PRF](https://www.w3.org/TR/webauthn-3/#prf-extension), [MDN extension inputs/outputs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/WebAuthn_extensions).

The browser mediates a user-approved authenticator ceremony; this cannot be promised as silent background unlocking. [W3C PRF explainer](https://github.com/w3c/webauthn/blob/main/explainers/prf-extension.md). Emulation is useful for mechanism/negative tests, but does not establish platform hardware, cloud-key synchronization or physical user verification. [Chrome virtual authenticators](https://developer.chrome.com/docs/devtools/webauthn), [official protocol reference](https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/). These sources were checked3November2026; no blanket device/provider compatibility claim is made.

## Actual experiment and limits

| Check | Observed |
|---|---|
| New fictional PRF credential | Virtual CTAP2.1 platform authenticator reports PRF availability |
| Encrypted local envelope | PRF → HKDF-SHA256 with origin/scope context → AES-GCM wrapping key → wrapped random data key and ciphertext committed to real IndexedDB. No plaintext fictional name/status/operation value in the stored envelope |
| Reopen offline | Reload page while the local server is available, then disable network; virtual credential unlock recovers the exact fictional record with a nonextractable unwrapped data key and no request |
| Wrong owner/academy binding | Altered derivation/AAD cannot decrypt. This is cryptographic scope binding, not actual Clerk identity or server permission proof |
| Wrong passkey / tampered envelope | Both refuse; the original envelope is retained |
| Verification failure / explicit retry | Failed virtual user verification produces no decrypted result. After restoring virtual verification and explicit page/user-action reopening, the original request still returns NotAllowedError. A control confirmed the original key worked after adding the second credential and before changing verification. Root cause is unconfirmed: virtual/browser ceremony state versus product-relevant recovery requires further isolation |
| No PRF | Ordinary virtual passkey reports unsupported. No automatic plaintext, persisted raw-key or local-passphrase fallback |

### Follow-up isolation and concrete device handoff

The new cancellation control actually withholds virtual user presence, aborts that request, restores presence, and asserts that the **original ciphertext** opens offline on the next approved ceremony. It passes. Cancellation/retry is therefore distinct from the separately retained failed-UV state; it has not been removed from the assertions.

The [Chromium virtual-authenticator setter](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/webauth/virtual_authenticator.h) changes the verification-success flag, while [virtual CTAP2](https://raw.githubusercontent.com/chromium/chromium/main/device/fido/virtual_ctap2_device.cc) keeps/decrements a separate internal verification retry counter and refuses at exhaustion. Restoring the flag does not itself reset that counter. This is a **source-supported explanation consistent with virtual lockout**, not a measured retry-counter value or proof of actual Touch ID/PIN recovery. Reapplying automatic virtual presence and reopening did not remove the blocked result. The pending envelope was never cleared. Keep the failed recovery case and require a real-device recovery assessment rather than bypassing it or declaring the data lost.

A separate [EN/AR device diagnostic](../../design/device-unlock-probe/README.md) is prepared at [localhost:3239](http://localhost:3239/design/device-unlock-probe/index.html). Its [8UI checks/8layouts](../07-handoff/evidence/device-unlock-probe-2026-11-03.json) pass with virtual credentials, including Cancel/retry and unsupported-provider handling. Tests also caught Chrome's algorithm-compatibility warning; ES256 and RS256 are now both offered, as [Chrome documents](https://chromium.googlesource.com/chromium/src/+/main/content/browser/webauth/pub_key_cred_params.md). This is not a change to the approved register preview or the app's authentication.

The native Chrome page was opened read-only: it reports browser PRF support as a hint, while the credential still shows **Not created / Not tested**. [Sanitized handoff observation](../07-handoff/evidence/device-unlock-handoff-2026-11-03.json). No real credential was created by the agent. The Owner has been given the concrete credential-creation/device-verification handoff. Until the Owner performs it and its visible results are checked, physical PRF/provider/reopen proof remains pending. Local probe-data removal explicitly does not remove a provider passkey. No promotion is needed for this loopback-only diagnostic.

The initial experiment omitted an HKDF hash parameter; that harness defect was corrected before the successful key round-trip. The remaining verification-recovery failure is retained, not removed from assertions. Reload is **not browser-process restart**; virtual credential secrets are process-owned here, and importing/exporting a signing credential would not prove preservation of its PRF secret. This test does not claim closed-app synchronization, offline cold launch, protected search indexes, existing authenticated account linkage or working logout recovery.

## Proposed product behaviour to validate

- Explicit personal-device preparation after real current Owner verification. Register an AcademyOS-local-unlock credential under the exact approved application RP/origin; do not reuse Vercel promotion credentials or assume Clerk's existing passkey provides local PRF material.
- Opening the encrypted store may require the device's unlock ceremony. Normal internal pages use the current in-memory key; **no inactivity lock or per-page prompt**. Reopening after the key is gone needs a new supported ceremony. A suspended/closed browser is not guaranteed to synchronize.
- Ordinary read replicas and protected pending intent have separate encrypted envelopes/key lifecycle. After logout/30day cleanup, no read-copy restoration or pending payload display before the approved same-account verification/recovery gate. No fallback from a missing key to a new empty vault that discards unresolved work.
- Unsupported provider/browser, cancellation, lost passkey, changed authenticator, missing output, revoked academy access, corrupted/old store and failed cleanup must have explicit retained-work states. Device/passkey synchronization means “uses Touch ID” cannot be equated with “device-only hardware key.”
- A local unlock never grants current server marking, late upload, cross-role access or approval authority. Preserve the [canonical runtime/readiness contract](offline-register-runtime-readiness.md), including cancellation-fence and count-only receipt distinctions.

These are engineering recommendations to demonstrate and review, not a physical-authenticator compatibility result or a selected recovery/backup policy.

## Next bounded investigation

1. Isolate verification/cancellation state with minimal controls, retaining the failing assertion and an explicit per-case result. Check a valid original credential before/after each negative case. Do not change an actual provider/account to make a virtual test pass.
2. Prepare a dedicated fictional local diagnostic for the Owner's actual browser/device, covering PRF availability, denied/cancelled ceremony, reload/offline unlock and original-envelope recovery. **Creating/using a real diagnostic credential requires a concrete Owner handoff/authorization**; “continue” is not that authorization. No AcademyOS account grant or private app data is needed.
3. Verify declared Mac Chrome/Safari and intended phone/browser/provider combinations individually before offering the option. If PRF is absent, report unsupported and return a concrete alternative for review; do not silently enable another method.
4. Review same-account key binding, passkey loss/rotation, encrypted pending recovery, local-data migration/eviction and XSS/key exposure independently. Only then advance relevant EX-06 private implementation and EX-03/04 real transport work. Working acceptance, deployed source and security approval remain separate.

## Git/CI checkpoint

The approved register/reference and first key-readiness packet were committed/pushed as `19627d818e1427e0a62faf468c949ae59e0427c0`; both exact-source Foundation runs passed: [41608602900](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41608602900) and [41608593558](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41608593558). Those runs do not turn the intentionally nonzero failed-UV research probe into a pass. The later cancellation control and concrete diagnostic carry their own source-specific evidence. No promotion was requested or performed for these reference/diagnostic-only changes. The canonical online app release remains separately verified in EX-02.
