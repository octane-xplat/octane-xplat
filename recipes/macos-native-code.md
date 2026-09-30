# Ship native code in a macOS leaf

ID: macos-native-code
Targets: macos
Related APIs: platforms/macos, xplat.macos, xplat dev, xplat build, xplat doctor, xplat clean, runMacOSDev

## Starting point

An AppKit app with a working CommonJS Vite bundle and macOS package configuration.
The reader owns a leaf package and knows its intended C/ObjC public boundary.

## Requirements

- Publish native sources and public headers from a leaf, with JS/TS callers using matching declarations.
- Compile C, ObjC, Swift, and Zig through the platform toolchains, preserving SDK metadata and the prebuilt runtime boundary.
- Resolve transitive native dependencies without app loader glue.
- Rebuild safely during development and produce a relocatable, signed packaged app.
- Diagnose prerequisites and invalid inputs; clear generated outputs without deleting authored macOS sources.

## Acceptance criteria

- AC1: A source-shipped C leaf is installed as a runtime dependency and its header-declared function is callable from JS without rebuilding the host/framework.
- AC2: ObjC headers, generated public Swift ObjC headers, and Zig C ABI declarations produce callable JS APIs through the same workflow.
- AC3: Installed transitive dependencies and pnpm/workspace links compile and load in dependency order; a dependent ObjC leaf calls a C leaf.
- AC4: Source/header/configuration changes invalidate native artifacts; repeated builds reuse valid artifacts, concurrent builds publish complete results, and failed compilation/header validation preserves the last successful artifacts.
- AC5: Native edits restart the dev host after successful rebuild; a failed rebuild preserves the running app and fixing the input recovers automatically.
- AC6: A packed CLI consumer produces a relocated ad-hoc signed app that calls all native APIs; nested native binaries participate in the existing Developer ID/notarization flow with external validation limits stated.
- AC7: Doctor reports prerequisites and package input errors; clean preserves authored macOS sources; apps without native leaves retain shipped metadata without requiring native tools.
- AC8: The CLI ships pinned, checksum-verified metadata tooling, ordinary builds need no runtime source checkout, and generated metadata retains AppKit/sqlite globals while adding leaf APIs.

## Documentation

- AC1: [C leaf example](../docs/macos-native.md#write-and-install-a-c-leaf).
- AC2: [Language boundaries](../docs/macos-native.md#choose-a-language-and-public-boundary) and [language fixtures](../packages/cli/test/verify-macos-native.mjs).
- AC3: [Native inputs and dependencies](../docs/macos-native.md#declare-native-build-inputs) and [runtime verification](../packages/cli/test/verify-macos-native.mjs).
- AC4: [Rebuilds and cache behavior](../docs/macos-native.md#rebuild-package-and-diagnose) and [runtime verification](../packages/cli/test/verify-macos-native.mjs).
- AC5: [Development lifecycle](../docs/macos-native.md#rebuild-package-and-diagnose) and [consumer verification](../packages/cli/test/verify-macos-native-consumer.mjs).
- AC6: [Packaging and signing](../docs/macos-native.md#rebuild-package-and-diagnose) and [evidence boundaries](../docs/macos-native.md#evidence-and-maintainer-tooling).
- AC7: [Prerequisites](../docs/macos-native.md#prepare-the-app), [diagnostics and clean](../docs/macos-native.md#rebuild-package-and-diagnose), and [validation tests](../packages/cli/test/macos-native.test.mjs).
- AC8: [Maintainer tooling](../docs/macos-native.md#evidence-and-maintainer-tooling) and [runtime verification](../packages/cli/test/verify-macos-native.mjs).
