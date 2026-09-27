# macOS experiment

This app-local spike uses `@nativescript/macos-node-api` to open AppKit windows
and an Octane universal host driver to mount the shared `View`, `Text`, and
`Pressable` implementations. `Add one` updates Octane state; `Open details
window` calls `openWindow({kind:'dialog', data})`, which presents a sheet on the
key window and mounts a second Octane root inside it — the app-installed
`setWindowContentResolver` maps `data` to a component that receives `{data,
controller}` as props. The sheet's `Close details` pressable calls
`controller.close()`. Open, render, interaction, and teardown were all verified
through AppKit accessibility actions. `kind:'regular'` and `kind:'popup'`
mappings exist but only the dialog path is exercised. Every window must resolve
to a component. Invalid kinds, missing parents, and synchronous resolver/render
setup errors now throw to the caller; failed setup removes the window registry
entry and closes the new window. The main window's `windowClosed` signal is
separate from `applicationClosed`, so its Octane root can unmount while a
secondary window keeps the app running.

The proof covers vertical `View` layout with `gap`, a small inline `style`
subset (`padding`, `fontSize`, `color`, `backgroundColor`, `borderRadius`), text
children, and `Pressable.onPress`. It does not implement NativeScript CSS or
`className`, flexbox layout generally, or the other `Pressable` gestures and
press-in/press-out callbacks.

`App.tsx` imports `View`, `Text`, and `Pressable` directly from
`@octane-xplat/ui`. The package's `macos` root condition selects
`src/index.macos.ts` and its narrow declaration file. That entry exposes only
these three components, reusing their native leaves; it does not imply that the
full NativeScript root barrel works on macOS. The AppKit Vite config compiles
those leaves with its renderer and still supplies app-local shims for the
NativeScript core and escape-prop helpers they import. The UI package includes
those leaf sources and their local helper files so the AppKit Vite build can
compile this bounded root surface. `tsconfig.json` sets the `macos` custom
condition so TypeScript selects the matching declarations.

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
and Apple Silicon only. Packaging compiles a small Mach-O launcher, so the host
also needs `clang` from Xcode Command Line Tools; `xplat doctor` checks for it.

With `OCTANE_MACOS_AUTOMATION=1`, the dev process accepts `snapshot` and
`tap <accessibility label>` on stdin. This CLI target does not add macOS to the
`create-octane-xplat` starter or the supported web/iOS/Android release contract.

## Packaging proof

`pnpm --filter @xplat/macos package` delegates to the CLI to build an Apple
Silicon `.app` and compressed `.dmg`. When it downloads Node 24.21.0 LTS, the
packager verifies the official arm64 archive against a pinned SHA-256 value.
Before embedding Node, every build checks the executable checksum and its
version and architecture, including when it reuses the extracted runtime cache.
The app also includes the NativeScript Node-API runtime and bundled Octane
component. Its Mach-O launcher lives in
`Contents/MacOS`; it starts Node from `Contents/Helpers` with
`Resources/app/main.cjs` as its entry script. The NativeScript framework lives
in `Contents/Frameworks` and is linked from its package-relative loader path.
The bundle targets macOS 13.5 or later, matching the minimum OS required by the
bundled Node runtime. Artifacts are written under
`apps/macos/artifacts/macos-arm64/` so dev builds do not clean them.

Set the optional `icon` package field to an app-root-relative `.icns` file to
include a custom app icon. The CLI validates the path, copies it to
`Contents/Resources/AppIcon.icns`, and sets `CFBundleIconFile` in `Info.plist`.

Without signing configuration, the app is ad-hoc signed for local use. Set
`MACOS_SIGNING_IDENTITY` to a Developer ID Application identity to sign the app
and disk image for distribution. The Node host is signed with the Hardened
Runtime JIT entitlement required for its JavaScript engine. For notarization,
save a credential profile in Keychain. Replace the sample Apple ID, Team ID,
and signing identity with your own; `notarytool` prompts for the app-specific
password:

```sh
APPLE_ID="you@example.com"
TEAM_ID="ABCDE12345"
xcrun notarytool store-credentials octane-notary --apple-id "$APPLE_ID" --team-id "$TEAM_ID"
unset APPLE_ID TEAM_ID
export MACOS_SIGNING_IDENTITY="Developer ID Application: Example Company (ABCDE12345)"
export MACOS_NOTARY_PROFILE=octane-notary
pnpm xplat build --targets macos
```

Run the build from `apps/macos`; the CLI signs and verifies the app and disk
image, submits the image, staples the ticket, and validates it. See
[Apple's notarytool credential guidance](https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool).

The packager runs its JavaScript bundle with a separate Node runtime instead of
embedding it with Node's Single Executable Applications feature, which remains
in active development. The AppKit target remains an experiment pending
validation across supported macOS versions and notarized distribution. See
[Node's SEA documentation](https://nodejs.org/api/single-executable-applications.html).
