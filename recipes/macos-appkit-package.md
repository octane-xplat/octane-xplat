# Package an experimental AppKit app

ID: macos-appkit-package
Targets: macos
Related APIs: xplat dev, xplat build, xplat doctor, xplat.targets.macos.package, @nativescript/macos-node-api

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

## Documentation

- AC1: [Experimental AppKit target](../docs/toolchain.md#experimental-appkit-target)
  and [macOS experiment notes](../apps/macos/README.md).
- AC2: [Experimental AppKit target](../docs/toolchain.md#experimental-appkit-target)
  and [macOS experiment notes](../apps/macos/README.md).
- AC3: [macOS signing and notarization notes](../apps/macos/README.md#packaging-proof).
- AC5: [App icon packaging](../apps/macos/README.md#packaging-proof) and
  [experimental AppKit target](../docs/toolchain.md#experimental-appkit-target).
- AC6: [macOS packaging proof](../apps/macos/README.md#packaging-proof).
- AC7: [macOS package-root boundary](../apps/macos/README.md#macos-experiment).
- AC8: [Packaged host API](../apps/macos/README.md#packaging-proof) and the
  [independent fixture check](../packages/cli/test/verify-macos-jsc.mjs).

- AC9: [macOS native leaf guide](../docs/macos-native.md) and the
  [native source recipe](macos-native-code.md).
