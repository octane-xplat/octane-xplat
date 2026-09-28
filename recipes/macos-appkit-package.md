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

- AC1: `xplat doctor` validates the AppKit runtime declaration, required package
  metadata, minimum macOS version, referenced Vite config, and local macOS
  packaging tools, including `clang`, `codesign`, and `hdiutil`.
- AC2: `xplat dev --targets macos` runs the app host, and
  `xplat build --targets macos` produces the configured `.app` and `.dmg`.
- AC3: Local packaging is ad-hoc signed; configured Developer ID credentials
  sign and verify the app and disk image, and a notary profile submits,
  staples, and validates the disk image.
- AC5: When an icon is configured, `xplat doctor` validates the `.icns` path
  and the packaged app includes its matching `Info.plist` icon entry.

## Documentation

- AC1: [Experimental AppKit target](../docs/toolchain.md#experimental-appkit-target)
  and [macOS experiment notes](../apps/macos/README.md).
- AC2: [Experimental AppKit target](../docs/toolchain.md#experimental-appkit-target)
  and [macOS experiment notes](../apps/macos/README.md).
- AC3: [macOS signing and notarization notes](../apps/macos/README.md#packaging-proof).
- AC5: [App icon packaging](../apps/macos/README.md#packaging-proof) and
  [experimental AppKit target](../docs/toolchain.md#experimental-appkit-target).
