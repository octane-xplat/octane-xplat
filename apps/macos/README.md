# macOS experiment

This app-local spike uses `@nativescript/macos-node-api` to open AppKit windows
and an Octane universal host driver to mount the shared `View`, `Text`, and
`Pressable` implementations. `Add one` updates Octane state; `Open details
window` opens a second AppKit window with the current count. Both actions were
verified through AppKit accessibility actions.

The proof covers vertical `View` layout with `gap`, a small inline `style`
subset (`padding`, `fontSize`, `color`, `backgroundColor`, `borderRadius`), text
children, and `Pressable.onPress`. It does not implement NativeScript CSS or
`className`, flexbox layout generally, or the other `Pressable` gestures and
press-in/press-out callbacks.

`App.tsx` imports from `@octane-xplat/ui`, but Vite redirects that specifier to
`src/renderer/shared-ui.ts`, which re-exports the same `View`, `Text`, and
`Pressable` native leaf implementations exposed by the package's native index.
The full native root barrel also re-exports unrelated NativeScript components;
bundling it pulls in `@nativescript/core` platform imports that have no macOS
resolver. App-local shims replace the leaves' iOS/Android escape-prop helper
and the eagerly imported NativeScript pan utility. This proves those component
implementations with the AppKit host, but it does not prove direct loading of
the package root entry. Both dev and packaged builds depend on this app-local
Vite boundary; a reusable macOS integration still needs an intentional package
export and resolver boundary.

In development, Vite rebuilds edited components and the running Node process
passes the replacement through Octane's universal HMR wrapper. This preserves
component state across successful edits. A compile error reports the failure
and leaves the last good component mounted; a later valid edit recovers without
restarting the process. This uses Vite's bundle watcher and Octane's component
HMR API, not NativeScript's `/ns-hmr` transport. That transport also depends on
NativeScript's HTTP-ESM bootstrap and runtime loader, which this AppKit host does
not use.

The stable `@nativescript/macos-node-api@0.4.0` loader points at an architecture
path missing from that published artifact, so this spike pins the matching
`0.4.4-next` preview.

Run `pnpm xplat dev --targets macos` to launch it, or
`pnpm xplat build --targets macos` to create the `.app` and `.dmg`. The app's
`package.json` opts in with `xplat.targets.macos.runtime: "appkit-node-api"`
and supplies product/package metadata under `xplat.targets.macos.package`.
The CLI forwards dev to this app's `dev` script; `xplat build` owns the shared
`.app`/`.dmg` packaging, signing, and optional notarization flow. The local
`package` script is only an alias for `xplat build --targets macos`.
`xplat doctor` checks the AppKit host, Apple Silicon architecture, package
metadata, declared runtime dependency, and packaging tools without requiring
the NativeScript CLI, iOS simulator, or Android SDK. This target is experimental
and Apple Silicon only.

With `OCTANE_MACOS_AUTOMATION=1`, the dev process accepts `snapshot` and
`tap <accessibility label>` on stdin. This CLI target does not add macOS to the
`create-octane-xplat` starter or the supported web/iOS/Android release contract.

## Packaging proof

`pnpm --filter @xplat/macos package` delegates to the CLI to build an Apple
Silicon `.app` and compressed `.dmg`. The packager embeds Node 26.7.0 from the
official arm64 distribution, verifies the published SHA-256, and includes the
NativeScript Node-API runtime and bundled Octane component. The bundle targets
macOS 13.5 or later. Artifacts are written under
`apps/macos/artifacts/macos-arm64/` so dev builds do not clean them.

Without signing configuration, the app is ad-hoc signed for local use. Set
`MACOS_SIGNING_IDENTITY` to a Developer ID Application identity to sign the app
and disk image for distribution. The Node host is signed with the Hardened
Runtime JIT entitlement required for its JavaScript engine. For notarization,
first save a credential profile with `xcrun notarytool store-credentials`,
then set `MACOS_NOTARY_PROFILE` to that profile name. The CLI packager submits,
staples, and validates the disk image when that variable is set.

The bundle builder uses Node's Single Executable Applications feature to make
Node the app's executable. Node currently marks this feature as active
development, so this is a packaging experiment rather than a settled release
contract.
