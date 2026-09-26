# macOS experiment

This app-local spike uses `@nativescript/macos-node-api` to open an AppKit
window and an Octane universal host driver to mount one native text view.
Vite rebuilds the component on edits; the running Node process imports the new
component and re-renders the existing root. This uses Vite's bundle watcher,
not NativeScript's `/ns-hmr` transport.

The stable `@nativescript/macos-node-api@0.4.0` loader points at an architecture
path missing from that published artifact, so this spike pins the matching
`0.4.4-next` preview.

Run `pnpm --filter @xplat/macos dev` to launch it, or
`pnpm --filter @xplat/macos build` to compile the component bundle. This is an
experiment only; it does not add a macOS target to `@octane-xplat/cli`.

## Packaging proof

`pnpm --filter @xplat/macos package` builds an Apple Silicon `.app` and
compressed `.dmg`. It embeds Node 26.7.0 from the official arm64 distribution,
verifies the published SHA-256, and includes the NativeScript Node-API runtime
and bundled Octane component. The bundle targets macOS 13.5 or later. Artifacts
are written under `apps/macos/artifacts/macos-arm64/` so dev builds do not clean
them.

Without signing configuration, the app is ad-hoc signed for local use. Set
`MACOS_SIGNING_IDENTITY` to a Developer ID Application identity to sign the app
and disk image for distribution. The Node host is signed with the Hardened
Runtime JIT entitlement required for its JavaScript engine. For notarization,
first save a credential profile with `xcrun notarytool store-credentials`,
then set `MACOS_NOTARY_PROFILE` to that profile name. The package script submits
and staples the disk image when that variable is set.

The bundle builder uses Node's Single Executable Applications feature to make
Node the app's executable. Node currently marks this feature as active
development, so this is a packaging experiment rather than a settled release
contract.
