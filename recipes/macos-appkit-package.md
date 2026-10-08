# Package an experimental AppKit app

ID: macos-appkit-package
Targets: macos
Related APIs: xplat dev, xplat build, xplat doctor, xplat.targets.macos.package, @nativescript/macos-node-api, @octane-xplat/macos-renderer, xplatMacOS

## Starting point

An AppKit Node-API app running on an Apple Silicon Mac. The app already has a
production Vite config that emits one CommonJS host bundle.

## Requirements

- Declare the AppKit Node-API runtime and the app's bundle metadata in
  `package.json`.
- Optionally include a custom macOS app icon from an `.icns` file in the app
  project.
- Build on an Apple Silicon Mac with the macOS `codesign` and `hdiutil` tools.
- Set the package's minimum macOS version to 13.5 or later for the
  JavaScriptCore host.
- Bundle dependencies into the CommonJS entry and use only the documented
  AppKit host API. Unsupported external imports fail the build.
- Run and diagnose the app through the `xplat` CLI without an iOS or Android
  NativeScript toolchain.
- Produce a local `.app` and `.dmg`, with optional Developer ID signing and
  notarization.

## Acceptance criteria

- AC1: `xplat doctor` validates the AppKit runtime declaration, installed
  NativeScript declarations, pinned JavaScriptCore host and compatible addon,
  required package metadata, minimum macOS version, referenced Vite config, and local
  `codesign` and `hdiutil` tools.
- AC2: `xplat dev --targets macos` runs Vite's watcher in Node and the AppKit
  window in the JavaScriptCore host. A valid component edit hot updates the
  mounted root in that process without remounting it; a failed build leaves the
  last good component mounted. `xplat build --targets macos` validates the
  runtime package before the Vite build, then produces the configured `.app`
  and `.dmg`.
- AC3: Local packaging is ad-hoc signed; configured Developer ID credentials
  sign and verify the app and disk image, and a notary profile submits,
  staples, and validates the disk image.
- AC5: When an icon is configured, `xplat doctor` validates the `.icns` path
  and the packaged app includes its matching `Info.plist` icon entry.
- AC6: The packager verifies checksums of the pinned arm64 host, compatible
  NativeScript framework, and metadata before the Vite build. The resulting
  app bundles no Node executable or JavaScript engine binary; it loads system
  JavaScriptCore and rejects unsupported external imports with a diagnostic.
- AC9: Native macOS leaf libraries and extended metadata participate in packaging and nested signing; the native source workflow and verification limits are documented separately.
- AC7: `apps/macos` loads the shared `@xplat/app` harness through
  `@octane-xplat/ui`'s macOS package-root condition without a Vite alias; the
  adapted sweep mounts Home, Apps, Test/probes, and all nine app-gallery demos,
  checks representative interactions including the 500-row list update, and
  exposes missing AppKit services as unsupported or unavailable. The AppKit
  list fallback mounts all rows and does not validate virtualization or scale.
- AC8: An independent app using the public macOS package contract opens an
  AppKit window, uses the supported host API, and exits successfully from the
  packaged executable. An unsupported `node:` import or API member fails
  packaging with a diagnostic naming that import or member.

- AC10: AppKit text defaults to Apple's system font with the requested size and
  weight, without requiring custom font assets. An app can explicitly register
  and select its own weighted faces, including in a packaged build. The macOS
  harness opts into Geist rather than changing the renderer default.

- AC11: An independent app consumes the packed AppKit renderer, compiler
  preset, and JSX declarations through package exports, with no harness
  source paths. App startup, windows, and most host services remain app-owned; the renderer supplies app-wide effective appearance and its subscription lifecycle.

- AC12: Standalone appearance reads the initial effective light/dark state, notifies open consumers on changes, supplies current state to new/reopened consumers, respects an app override until system mode returns, and detaches observation after the last unsubscribe. Colors remain app-owned.

## Documentation

- AC12: [App-wide macOS appearance](../docs/app/styling.md#app-wide-macos-appearance).

- AC1: [Experimental AppKit target](../docs/start/toolchain.md#experimental-appkit-target)
  and [macOS experiment notes](../apps/macos/README.md).
- AC2: [Experimental AppKit target](../docs/start/toolchain.md#experimental-appkit-target)
  and [macOS experiment notes](../apps/macos/README.md).
- AC3: [macOS signing and notarization notes](../apps/macos/README.md#packaging-proof).
- AC5: [App icon packaging](../apps/macos/README.md#packaging-proof) and
  [experimental AppKit target](../docs/start/toolchain.md#experimental-appkit-target).
- AC6: [macOS packaging proof](../apps/macos/README.md#packaging-proof).
- AC7: [macOS package-root boundary](../apps/macos/README.md#macos-experiment).
  Maintained [non-visual smoke checks](../apps/macos/README.md#non-visual-smoke-checks)
  require the complete shared sweep and document unsupported leaf boundaries.
- AC8: [Packaged host API](../apps/macos/README.md#packaging-proof) and the
  [independent fixture check](../packages/cli/test/verify-macos-jsc.mjs).

- AC9: [macOS native leaf guide](../docs/platform/macos-native.md) and the
  [native source recipe](macos-native-code.md).

- AC10: [AppKit fonts](../docs/app/styling.md#appkit-fonts) and the
  [maintained harness font setup](../apps/macos/src/fonts.ts).

- AC11: [Renderer setup](../packages/macos-renderer/README.md) and the
  [packed renderer consumer](../packages/macos-renderer/test/packed-consumer.ts).

## Verification gaps

AC7 retains its all-rows fallback criterion. The current maintained sweep
instead checks bounded mounting for the 500-row collection and its update to
499 rows. That is runtime evidence for the current implementation, not a pass
for the all-rows criterion or proof of large-list performance. Reconcile this
with the VirtualList workflow separately; restoring the harness does not
change the criterion.

## Development app identity

- AC12: The development host launches from a real `.app` bundle with
  `CFBundleName` and `CFBundleDisplayName` from `dev.productName`, then
  `package.productName`, then the root package name. A configured `dev.icon`
  (or `package.icon`) is validated and copied as `AppIcon.icns`, with a matching
  `CFBundleIconFile`. Shutdown removes the temporary bundle.

Documentation: [Development app identity](../docs/start/toolchain.md#experimental-appkit-target).
Maintained coverage: [Development bundle tests](../packages/cli/test/macos-dev-bundle.test.mjs).
Visual Dock/Cmd-Tab appearance requires separate runtime verification.

AC12 regression checks: renderer `test/appearance.test.ts`, UI
`tests/color-scheme.macos.test.mjs`, and the maintained native case:

```sh
pnpm probe run examples/probes/appearance.macos.ts --target macos
```

The native case exercises real AppKit effective-appearance KVO and disposal by
changing only its own app override. OS Settings changes and visible window
chrome require separate runtime verification; the unit tests simulate system
changes and app-theme preference transitions.
