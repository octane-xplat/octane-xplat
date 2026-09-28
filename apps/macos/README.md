# macOS experiment

This experimental AppKit host runs the shared `@xplat/app` harness: its Home
shell, Apps gallery, all nine shared demos, and the Test tab with probes and
services. The adapted sweep drives the Home counter, routes into each demo,
checks representative state changes, and visits the Test surface.

`apps/macos` imports `App` from `@xplat/app`, and the app imports UI components
from `@octane-xplat/ui` without a Vite alias for the package root. The package's
`macos` condition selects `src/index.macos.ts` and matching declarations. This
is an explicit experimental AppKit surface: components without a host
implementation use visible unsupported leaves, and platform services without
an AppKit implementation report `unsupported` or `unavailable` rather than
simulating success. The renderer maps a curated set of `className` tokens to
AppKit views; it does not load CSS stylesheets or promise general NativeScript
or web style parity. In particular, this harness does not validate every
exported component or every service. AppKit's shared `VirtualList` fallback
keeps keyed rows and scrolling but mounts every row at once; the 500-row demo
checks rendering and updates, not virtualization or large-list performance.

The AppKit Vite config compiles the UI package's macOS leaves with its renderer
and still supplies app-local shims for NativeScript core and escape-prop
helpers. The UI package includes the leaf sources and local helpers needed by
the bounded root surface. `tsconfig.json` sets the `macos` custom condition so
TypeScript selects the matching declarations.

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

With `OCTANE_MACOS_AUTOMATION=1`, the dev host runs the adapted macOS harness
sweep through the AppKit renderer's debug interface. It reports route and
interaction assertions in the process log; it does not accept stdin commands.
This CLI target does not add macOS to the `create-octane-xplat` starter or the
supported web/iOS/Android release contract.

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
