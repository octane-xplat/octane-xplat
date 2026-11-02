# @octane-xplat/macos-build

> Build macOS app packages through project-installed tooling while keeping the
> experimental Nim CLI download small.

This project-installed tool builds macOS app packages for the experimental
[Nim CLI](package-cli.md#experimental-nim-executable). It contains the packaging
worker and the verified JavaScriptCore host assets. Those assets stay out of the
standalone CLI download and out of web-only build installations.

## Build an existing macOS app

Start with a configured [AppKit app](../start/toolchain.md#experimental-appkit-target)
on a Mac with Xcode Command Line Tools and Node 22.22.2 or newer. Keep its existing
Octane, NativeScript macOS runtime and packaging configuration. Install the build
tools in the app's project, alongside its Vite configuration:

```sh
bun add --dev @octane-xplat/macos-build @octane-xplat/build vite@^8.3.0
```

The Nim tarball does not include the old CLI's JavaScript exports. In the existing
macOS Vite configuration, replace the preset import from
`@octane-xplat/cli/macos/vite` with the shared build package. Keep the preset call,
its options and other plugins unchanged. The [build-plugin guide](package-build.md)
explains the migration; that package also supplies route planning and baking:

```ts
import { xplatMacOS } from '@octane-xplat/build/macos/vite'
```

Run the native `xplat` executable from the app directory. A foreground build
prints compiler output and produces an app and DMG in
`artifacts/macos-universal/`. Signing and notarization still use your project's
[packaging configuration](../start/toolchain.md#experimental-appkit-target).
Without a distribution signing identity, the build signs the app for local use:

```sh
xplat build --targets macos
```

To run a background build, start a job, then use its returned id to inspect
progress or read output. Cancelling the job releases the worker and its owned
compiler processes:

```sh
xplat runtime build --platform macos --json
# Replace JOB_ID with the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
xplat job cancel JOB_ID --json
```

The worker constructs and signs new artifacts in a separate staging directory.
Nim validates the result and publishes it after the worker finishes. Cancellation
before publication leaves the previous app and DMG in place. Builds for one app
are serialized; an overlapping native build reports that the target is busy.
These commands build packages; native development sessions remain in migration:

```sh
xplat capabilities --platform macos --json
```

## Contributor boundary

The package compiles the existing TypeScript macOS packager and native-leaf
compiler without calling the old CLI. The worker resolves tools from the selected
project, uses a versioned JSON request/result and sends diagnostics separately.
Nim owns permissions, jobs, deadlines, process groups, staging and publication.
The package has no CLI runtime dependency; its CLI workspace dependency is used
only to build the shared source and host assets.

The worker subpath is an internal CLI/toolchain protocol. Application code should
not import it. Maintainers qualify the actual packed package through Turbo:

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"macOS build worker qualification"}' -- bun run turbo run test:nim-macos-build test:nim-macos-publication --filter=@octane-xplat/cli
```
