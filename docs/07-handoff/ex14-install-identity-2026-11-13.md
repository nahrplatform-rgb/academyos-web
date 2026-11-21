# EX-14 installation identity and stable launch checkpoint

13 November 2026 · EX-14 / PW-01/PW-02 · supporting MP-B01 work

## Outcome

AcademyOS now has a staging-only install identity built from the existing public locale bootstrap:

- `apps/web/src/app/manifest.ts` serves a stable manifest with `id: /en`, `start_url: /en`, root scope and standalone presentation.
- The manifest name is **AcademyOS Staging** and contains no subject, academy UUID, email, bearer token or tracking identifier.
- `apps/web/public/icons/academyos-192.png` and `academyos-512.png` provide the required PNG sizes.
- Matching maskable icon assets are provided for install surfaces.
- `apps/web/src/app/apple-icon.png` provides the Apple touch icon through the existing Next convention.
- `/en` remains the existing public sign-in/bootstrap page; no new `/app` route, private task URL or second worker was introduced.

The icons reuse the existing AcademyOS mark treatment and staging-safe dark window surface. This is installation metadata and public launch readiness only. It does not establish installed OS launch, authentication in a separate container, offline coverage, worker update compatibility, storage persistence or Owner acceptance.

## Evidence

- `npm test --workspace @academyos/web` — 106 tests passed, including the manifest identity and asset test.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; Next emitted `/manifest.webmanifest` and `/apple-icon.png` routes.
- Built-server smoke check — `/manifest.webmanifest`, `/icons/academyos-512.png` and `/en` returned successfully; manifest `start_url` was `/en` and the icon content type was `image/png`.

The local build and smoke check are not hosted or installed-device evidence. Future EX-16 cases must pin the actual OS/browser/device/container and verify launch/authentication separately. EX-15 worker/storage compatibility remains open; existing worker ownership and public-only cache boundaries are unchanged.
