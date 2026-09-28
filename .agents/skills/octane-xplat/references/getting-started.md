# Getting started

## Layout

| Path             | What                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`    | The framework — primitives, styled(), stacks, routes, theme. Published as `@octane-xplat/ui`.                                          |
| `packages/app`   | Harness app exercising every seam (screens, nav, overlays, probes). Not a product.                                                     |
| `packages/demos` | Familiar mini-apps and seam-proof demos used as navigation and store payloads. |
| `apps/web`       | Web entry — vite + `@octanejs/vite-plugin`, `resolve.conditions:['web']`, port 5200.                                                   |
| `apps/mobile`    | NativeScript entry — `ns build/run`, Vite configured with `xplatNative()`, `resolve.conditions:['native']`.                              |
| `docs/`          | Design record: decisions ledger, per-domain specs, exploration notes.                                                                  |
| `scripts/`       | `check-no-dom.mjs` (seam lint).                                                                                                        |

## Commands

```sh
pnpm install                                    # never npm

# typecheck (tsrx-tsc, per target)
pnpm exec tsrx-tsc --noEmit -p apps/web/tsconfig.json
pnpm exec tsrx-tsc --noEmit -p apps/mobile/tsconfig.json

# tests + seam lint
pnpm test                                       # vitest
node scripts/check-no-dom.mjs                   # no DOM globals in native/shared files

# web
cd apps/web && pnpm dev                         # dev server :5200
cd apps/web && pnpm smoke                       # vite build + Playwright smoke

# native (iOS — needs a booted sim)
cd apps/mobile && pnpm exec ns build ios        # debug build
xcrun simctl install <UDID> platforms/ios/build/Debug-iphonesimulator/native.app
xcrun simctl launch <UDID> org.nativescript.xplat

# native (Android — emulator + ANDROID_HOME + JDK17)
cd apps/mobile && pnpm exec ns build android
adb -s emulator-5554 install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell am start -n org.nativescript.xplat/com.tns.NativeScriptActivity
```

## Environment gotchas (all real, all hit)

- `pnpm-workspace.yaml` uses `nodeLinker: isolated` —
  `@nativescript/vite` reads app-root package manifests for vendor bundling;
  declare each imported dependency in the package/app that uses it.
- Workspace deps are `"workspace:*"` — bare `*` resolves to the registry → 404.
- iOS build needs the `xcodeproj` Ruby gem on PATH ruby.
- `ns run ios` re-boots the sim and errors — use `simctl install/launch`
  against the existing `.app` instead.
- JDK 25 breaks the Android toolchain; JDK 17 works.
- Android AVD `xplat` (API 35, Google APIs arm64) is the expected emulator.

## Reading logs

- iOS: `xcrun simctl spawn <UDID> log show --last 110s --predicate 'process == "native"' --style compact | grep -oE 'CONSOLE (LOG|WARN|ERROR)[^$]*'`
- Android: `adb -s emulator-5554 logcat -d | grep "I JS"`
- Harness output prefixes: `[harness]` boot, `[probe]` probe step,
  `[assert]` pass/fail, `[sweep]` the demo-catalog navigation sweep,
  `[diag]` one-off diagnostics.
