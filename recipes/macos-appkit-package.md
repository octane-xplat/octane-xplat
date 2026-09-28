# Package an experimental AppKit app

ID: macos-appkit-package
Targets: macos
Related APIs: xplat dev, xplat build, xplat doctor, xplat.targets.macos.package, @nativescript/macos-node-api

## Starting point

An AppKit Node-API app running on an Apple Silicon Mac. The app already has a
production Vite config that emits its CommonJS host bundle.

## Requirements

- Declare the AppKit Node-API runtime and the app's bundle metadata in
  `package.json`.
- Optionally include a custom macOS app icon from an `.icns` file in the app
  project.
- Build on an Apple Silicon Mac with Xcode Command Line Tools (`clang`); the
  package also uses the macOS `codesign` and `hdiutil` tools.
- Set the package's minimum macOS version to 13.5 or later for the bundled Node
  runtime.
- Run and diagnose the app through the `xplat` CLI without an iOS or Android
  NativeScript toolchain.
- Produce a local `.app` and `.dmg`, with optional Developer ID signing and
  notarization.

## Acceptance criteria

- AC1: `xplat doctor` validates the AppKit runtime declaration, installed JS
  entry points and ARM64 framework binary, required package metadata, minimum
  macOS version, referenced Vite config, and local macOS packaging tools,
  including `clang`, `codesign`, and `hdiutil`.
- AC2: `xplat dev --targets macos` runs the app host, and
  `xplat build --targets macos` validates the runtime package before the Vite
  build, then produces the configured `.app` and `.dmg`.
- AC3: Local packaging is ad-hoc signed; configured Developer ID credentials
  sign and verify the app and disk image, and a notary profile submits,
  staples, and validates the disk image.
- AC5: When an icon is configured, `xplat doctor` validates the `.icns` path
  and the packaged app includes its matching `Info.plist` icon entry.
- AC6: The packager verifies a downloaded Node 24.21.0 arm64 archive against a
  checksum pinned to that release and fails if it differs.
- AC7: `apps/macos` loads the shared `@xplat/app` harness through
  `@octane-xplat/ui`'s macOS package-root condition without a Vite alias; the
  adapted sweep mounts Home, Apps, Test/probes, and all nine app-gallery demos,
  checks representative interactions including the 500-row list update, and
  exposes missing AppKit services as unsupported or unavailable. The AppKit
  list fallback mounts all rows and does not validate virtualization or scale.

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
