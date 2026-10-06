# OTA updates notes

> Gate record for the OTA redirect question: can a release-path NativeScript
> app boot its JS bundle from app-private storage instead of the embedded
> bundle, on iOS and Android, and can a swapped bundle be applied in-session?
>
> **Status: gate passed.** Release-path redirect proven on physical Android
> (release APK, OnePlus CPH2551 / Android 15 / ColorOS) and iOS simulator
> (Release-configuration build, iPhone 18 Pro Max / iOS 27). See "Runtime
> evidence" for run-by-run results. · **Probe sources:** `research/ota-gate/`
> (gitignored): `ota-redirect.ts` probe case, `driver.ts` standalone release
> driver, `release-gate.sh` orchestration.
>
> **Remaining gaps:** iOS release was unsigned simulator-only (no signed
> device run — no device available); Android self-restart is BAL-blocked on
> this ColorOS build; `reloadApplication` does not exist in shipped runtimes
> (see "In-session apply").

## Mechanisms

### Where each runtime reads the bundle

- **Android** (`@nativescript/android` 9.1.1): `RuntimeHelper.initRuntime`
  extracts `assets/app` into `getFilesDir()/app` on first boot, gated by
  `DefaultExtractPolicy` thumb (`lastUpdateTime-versionCode`).
  `AppConfig`/the runtime always executes from `files/app` — app-private
  storage is the normal boot path. The asset extraction consults
  `shouldExtract` (verified in the compiled `AssetExtractor`): the thumb is
  unchanged across restarts of the same install, so files written into
  `files/app` persist until the *native* package is updated.
- **iOS** (`@nativescript/ios` 9.1.0, runtime via SwiftPM `ios-spm`):
  generated `platforms/ios/internal/main.m` sets
  `config.BaseDir = [[NSBundle mainBundle] resourcePath]`; the runtime loads
  `<BaseDir>/app/<package.json main>.mjs`. No writable-dir fallback exists in
  the binary (no Documents/Library search strings; the only override is the
  DEBUG-only `TNSBaseDir` env var). Redirecting requires patching `main.m` —
  the same seam `nativescript-app-sync` used (`src/scripts/ios/appsync-ios.js`
  rewrote `baseDir` to `[TNSAppSync applicationPathWithDefault:]` via a
  prepare hook). `internal/main.m` survives `ns prepare`/`ns build`; it is
  regenerated only on platform add/update.

### Patch used by this probe (iOS)

```objc
// platforms/ios/internal/main.m, right after baseDir init
NSString* otaBase = [NSHomeDirectory() stringByAppendingPathComponent:
    @"Library/Application Support/ota"];
if ([[NSFileManager defaultManager]
        fileExistsAtPath:[otaBase stringByAppendingPathComponent:@"app/package.json"]]) {
    baseDir = otaBase;
}
```

Vite emits `app/bundle.mjs` + `vendor.mjs` + `rolldown-runtime-*.mjs` +
`package.json` (`"main": "bundle"`). The OTA payload is the whole `app/` dir;
metadata is compiled into the binary (`__TNSMetadata` section) and is *not*
part of the payload — OTA cannot change native surfaces.

### In-session apply

- `NativeScriptRuntime.reloadApplication(baseDir?)` — soft JS reboot, from
  open upstream PRs NativeScript/ios#384 and NativeScript/android#1963.
  **Not in any released runtime** (verified: absent from ios-spm 9.1.0
  framework binary, absent from android `libNativeScript.so` 9.1.1;
  `typeof globalThis.NativeScriptRuntime?.reloadApplication === 'undefined'`
  on both at runtime). Core 9.1.2 already carries the JS-side support
  (delegate reattach, `reloadCount`). iOS upstream review raises real
  delegate-lifetime concerns for production OTA; treat it as upcoming, not
  load-bearing.
- **Android in-session apply = process restart.** No runtime reload API
  exists. Self-restart via `AlarmManager` + `PendingIntent.getActivity` +
  `killProcess` is **BAL-blocked on ColorOS/Android 15+** even with the API-34
  `ActivityOptions.setPendingIntentCreatorBackgroundActivityStartMode(
  MODE_BACKGROUND_ACTIVITY_START_ALLOWED)` opt-in — the blocked launch log
  shows `balAllowedByPiCreator: ALLOW_BAL` but `balAllowedByPiSender: NONE →
  BAL_BLOCK`; the alarm is delivered by system_server which fails ColorOS's
  sender check. Production implication: schedule the restart best-effort and
  treat "applied on next launch" as the honest contract, or apply while
  foregrounded and let the user/system restart.
- **iOS in-session apply** on the shipping runtime: none — `restartWithConfig`
  is documented embedder-only (kills JS-backed delegates). Cold-boot apply
  (the App Store-safe default anyway) is what the redirect provides.

## Runtime evidence

### Android — debug build via probe runner (device 905d3a9e)

Probe case `research/ota-gate/ota-redirect.ts`, phase file in `files/`:

| Step | Result |
| --- | --- |
| Embedded boot | `marker=null`, `currentApp=/data/data/<pkg>/files/app` — PASS |
| Install (copy `files/app` → staging, append `globalThis.__otaMarker='OTA-BUNDLE-V2'` to `bundle.mjs`, write back over `files/app`) + `killProcess` after alarm | PASS; alarm relaunch BAL-blocked, manual `am start` relaunched |
| Rebooted process | `__otaMarker === 'OTA-BUNDLE-V2'`, `ota-marker.txt` in live `files/app` — PASS (new code executed from app-private storage) |
| Second reboot | marker still v2 — payload survives restarts (no re-extract) — PASS |
| Rollback (restore backup over `files/app`, restart) | `marker=null` on next boot — embedded payload restored — PASS |

All three phase runs reported `status: pass` from the probe runner on device
`905d3a9e` (final embedded-restored run `7a5ff0f0`).

### Android — release APK

`ns build android --release` (throwaway keystore), installed on device
905d3a9e replacing the debug-signed probe; `research/ota-gate/driver.ts`
embedded as the app entry. Release mutes JS console → verification read from
the on-screen status Label via `uiautomator dump`. Full arc completed:

| Boot | UI state |
| --- | --- |
| 1 (embedded) | driver copied `files/app` → staging, appended marker, wrote back over `files/app`, armed restart alarm, `killProcess` |
| 2 | alarm relaunch BAL-blocked (even with API-34 opt-in) → external `am start` → `expect-ota` verified, `__otaMarker=OTA-BUNDLE-V2` |
| 3+ (repeated) | `expect-ota-persist` — OTA payload survives restarts |
| after rollback | `done phase=done marker=null` — backup restored over `files/app`, embedded bundle running again |

Note: release builds cannot be seeded via `run-as` — the OTA write must be
performed by app code (as production OTA does); external verification uses the
UI tree or a private HTTP/marker channel.

### iOS — debug build via probe runner (sim B27CF707, iOS 27)

| Step | Result |
| --- | --- |
| Embedded boot | `marker=null`, `currentApp=…/Bundle/Application/…/build67061d080a5f6dec.app/app` — PASS (run `f1fcd453`) |
| Install to `~/Library/Application Support/ota/app` (in-app file copy) | PASS (run `f1fcd453`) |
| Relaunch with patched `main.m` | `exists=1` → `booting OTA bundle` (main.m NSLog); `CONSOLE LOG: [ota-gate] OTA-BUNDLE-V2 bundle executed`; run `e2a887be` PASS: `currentApp=…/Library/Application Support/ota/app`, marker v2, `booted from app-private dir` |
| Second reboot (persist) | run `aa976767` PASS — still v2 from `Application Support/ota` |
| Rollback (delete payload) + relaunch | run `4d82b6cd` PASS — `marker=null`, `currentApp` back to embedded `.app/app` |

One failed intermediate run (`21942ca1`) is explained by a data-container
rotation between runs on the shared sim: the payload+state lived in a stale
container UUID, so `main.m` saw `exists=0`. Not a mechanism failure —
re-running after the container settled passed cleanly. Worth noting for OTA
itself: `main.m` checks a container-relative path, so the payload directory is
always resolved against whatever container the app actually boots in.

### iOS — release .app (simulator, unsigned Release config)

`xcodebuild -configuration Release -sdk iphonesimulator
CODE_SIGNING_ALLOWED=NO` on the patched project; driver entry via
`ns prepare ios --release` (production vite bundle — a **dev-mode** bundle
crashes release with `__registerDomainDispatcher is not defined`, because the
development module graph includes the inspector backend that release binaries
don't register). Driver logs state files since release mutes NSLog from JS.
Full arc, all on the release binary:

| Boot | Evidence |
| --- | --- |
| 1 | main.m: `exists=0` → embedded path; driver installed payload → `expect-ota` |
| 2 | `exists=1` → `booting OTA bundle`; `ota-gate-boot.txt: phase=expect-ota marker=OTA-BUNDLE-V2 appDir=…/Application Support/ota/app` |
| 3 | `exists=1` → OTA again; `phase=expect-ota-persist marker=OTA-BUNDLE-V2` — payload persisted |
| 4 | `exists=0` (payload deleted at 3) → embedded; `marker=null appDir=…/Bundle/…/app` → `done` |

So a **release-configuration** iOS app boots the swapped vite bundle from
app-private storage, persists it, and falls back when removed — the redirect
mechanism is release-viable.

## Plugin-vs-custom survey

- `nativescript-app-sync` (NativeScript org / eddyverbruggen, v2.0.0): last
  pushed 2023-06; AppSync server retired; webpack-era file layout
  (`bundle.js`, not `.mjs`); its iOS side is exactly the `main.m` rewrite this
  probe replicates plus a binary `AppSync.xcframework` for download/install.
  Not viable as an engine for NS 9 + vite.
- No other maintained NS OTA plugin exists on npm.

## Recommendation

Thin custom layer, not a plugin:

- ~15 lines of ObjC in `main.m`/`NativeScriptStart.m` (or a prepare-time
  patch like app-sync's hook) for the iOS redirect.
- Android needs **no native redirect** — `files/app` is already the boot
  source; the OTA layer is pure JS (download → stage → swap → restart).
- Apply contract: install-when-restarting on both OSes; `reloadApplication`
  is the designed soft-apply API once upstream lands — gate iOS in-session
  apply on `typeof NativeScriptRuntime?.reloadApplication === 'function'`.
