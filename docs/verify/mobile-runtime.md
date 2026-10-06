# Mobile runtime qualification report

Runtime evidence for the representative mobile flow required by the
Coreframe xplat-prep audit (audit/05, item 5): navigation, hosted auth,
persistence, and upload on **both** mobile targets.

Evidence type: `lab-experiment`. Run 2026-10-05/06 on macOS arm64,
worktree `grand-hippo`, HEAD `d7ad1981` plus the two fixes listed below.

## What ran

One isolated probe case — `research/qual-mobile.tsrx` (temporary,
gitignored) — executed through `pnpm probe run` against the NativeScript
host app on a real simulator and a real emulator:

```sh
pnpm probe run research/qual-mobile.tsrx --target ios \
	--device CF4A9D5B-C905-4EB3-A3CE-EB6BAF30FC4B \
	--deps @octane-xplat/auth,@octane-xplat/files --timeout 60000
pnpm probe run research/qual-mobile.tsrx --target android \
	--device emulator-5556 \
	--deps @octane-xplat/auth,@octane-xplat/files --timeout 60000
```

| Target | Device | Result | Run ID |
| --- | --- | --- | --- |
| iOS | iPhone 17e simulator, iOS 27.0 (`CF4A9D5B-C905-4EB3-A3CE-EB6BAF30FC4B`) | PASS — 41/41 assertions | `d6750e1f-1129-4ca7-ad3d-f27af0e87f20` |
| Android | `octane-prime-larkspur` AVD, API 35 google_apis arm64 (`emulator-5556`) | PASS — 41/41 assertions | `d33e7911-ca45-4479-b397-105e9684ea6d` |

Raw runner output:
`docs/evidence/qual-mobile-ios-2026-10-06.json`,
`docs/evidence/qual-mobile-android-2026-10-06.json`.
Same case build (`06457573c40e7ebb`) produced both results.

## Matrix — what the case asserted per target

| Seam | Coverage | iOS | Android |
| --- | --- | --- | --- |
| Named route push with params | `pushRoute` on the root Frame; `routeFor`, `canGoBack` observed | PASS | PASS |
| Modal presentation | `presentation: 'modal'` → `currentModalRoute`; `popRoute` dismisses, pushed page survives | PASS | PASS |
| Pop to base | `popRoute('root')`; `routeFor` null, `canGoBack` false | PASS | PASS |
| Press → push | `Pressable.onPress` → `pushRoute` via gesture-observer-dispatch | PASS | PASS |
| Named-stack route store | unregistered `qual-tab` stack push/pop through `swapTabRoutes` | PASS | PASS |
| `platformQueryStorage` | set/get/remove JSON round-trip incl. non-ASCII | PASS (NSUserDefaults) | PASS (SharedPreferences) |
| `createHostedAuth` sign-in | stub `HostedAuthFlow` + stub `authSession`; real PKCE (`SecRandomCopyBytes`/`SecureRandom`), state check, `attempt.data` handoff | PASS | PASS |
| Credential persistence | second client instance restores session — **real** `secureStorage` (Keychain/Keystore plugin) | PASS | PASS |
| Bearer injection | `auth.fetch` adds `Bearer` on `/api/*`, omits on `/api/auth/*` and foreign origins | PASS | PASS |
| Refresh | near-expiry token mints once through `flow.refresh` | PASS | PASS |
| Sign-out | `flow.revoke` sees the session token; fresh client restores `unauthenticated` | PASS | PASS |
| File upload | `files.writeText` → `readText`/`readBytes` → POST body through authorized transport, byte-exact | PASS (Documents) | PASS (`/data/user/0` app files) |

## Boundaries — what this does **not** prove

- **Handler dispatch, not OS input.** `press`/`scrub` dispatch gesture
  observers directly; they do not exercise hit-testing, OS touch, keyboard,
  or accessibility navigation. A Maestro-level flow remains the remaining
  gap for OS-input proof (see `maestro.md`).
- **Auth ceremony is stubbed.** `HostedAuthFlow` (begin/complete/refresh/
  revoke) and `authSession` are injected stubs — no ASWebAuthenticationSession
  / Custom Tab, no live Coreframe Worker, no real backend. What ran natively:
  PKCE minting, callback `state` validation, credential parsing, storage
  round-trip, Bearer injection, refresh de-dup, revoke. The real `authSession`
  browser ceremony is separately unverified (`platform-service-breadth`
  experiment `4e9cf10a` remains queued).
- **Upload is sandbox-file → stub transport.** `files.pick`/`files.export`
  (system picker UIs) were not exercised; byte plumbing and authorized
  transport shape were.
- Simulator/emulator only — no physical-device run.

## Fixes landed during qualification

Two blockers surfaced and were fixed in scope (both committed):

1. `packages/files/src/files.ts` — Android `readBytes` passed a Java
   `byte[]` to `ArrayBuffer.from`, which requires `java.nio.ByteBuffer`
   ("Wrong type of argument"). Now wraps with `ByteBuffer.wrap`.
2. `scripts/probe/mobile-host.mobile.mjs` — the host module map lacked
   Android-only `@nativescript/core` subpaths (`application`,
   `application-settings`, `utils/lazy`) imported by plugin entries such as
   `@nativescript/google-signin/index.android.js`; case bundles crashed at
   require time. Mapped them with matching import shapes.

Silo: per-target `experiments` rows `1d21dcdf…` (ios) and `c190072e…`
(android) under `platform-service-breadth`; mismatch reports in
`feedback_observations` (`fa36891e…` files.readBytes Android,
`047ea8f6…` host module map).

## Not covered by this run

- The older `check-navigation.py` release-harness experiment
  (`bdb07830…`, status `failed` on a simulator launch blocker) is a
  different method — deep links, UITabBar/BottomNavigationView churn, OS
  back, and baked routes remain unverified.
- `apps/mobile` demo-app boot is source/build-verified elsewhere; this
  matrix used the isolated probe host, not the demo app.
