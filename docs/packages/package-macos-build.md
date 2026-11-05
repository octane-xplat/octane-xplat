# @octane-xplat/macos-build

> Build macOS app packages through project-installed tooling while keeping the
> standalone native CLI download small.

This project-installed tool builds macOS app packages for the experimental
[Nim CLI](package-cli.md#native-executable). It contains the packaging
and development workers and the verified JavaScriptCore host assets. Those assets stay out of the
standalone CLI download and out of web-only build installations.

## Build an existing macOS app

Start with a configured [AppKit app](../start/toolchain.md#experimental-appkit-target)
on a Mac with Xcode Command Line Tools and Node 22.22.2 or newer. Keep its existing
Octane, NativeScript macOS runtime and packaging configuration. Install the build
tools in the app's project, alongside its Vite configuration:

```sh
bun add --dev @octane-xplat/macos-build @octane-xplat/build vite@^8.3.0
```

The native CLI keeps small Vite and worker exports in its package. The macOS
engine and host assets stay in this optional project package. Keep the macOS
preset import in your app's Vite configuration:

```ts
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
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
Check the installed native build's platform support before running it:

```sh
xplat capabilities --platform macos --json
```

## Start a development session

For an app with `xplat.targets.macos.dev` configured, the native CLI can start
the installed development engine. Choose the macOS target, then poll the returned
session id. The engine watches JavaScript and native-leaf source and restarts the
app after a successful rebuild. A ready session confirms host startup; inspect
the app's output separately to verify its behavior:

```sh
xplat targets --platform macos --json
xplat session start macos --json
# Replace SESSION_ID with the returned session id:
xplat session status SESSION_ID --json
xplat diagnostics --session SESSION_ID --limit 100 --json
```

End the session to stop its engine and owned app processes. Retained diagnostics
remain readable after the native workspace host exits. The native cache keeps
the newest 20 historical sessions per app and two log segments of up to 512 KiB
per session; older output is dropped with an indication in the log cursor result:

```sh
xplat session end SESSION_ID --json
xplat diagnostics --session SESSION_ID --json
```

If the owner disappears before confirming cleanup, status reports historical
data with `cleanupConfirmed: false`. Ending that historical session cannot stop
its old processes or confirm their cleanup. Check the surviving app/tool processes
before starting another session. Attachment preserves existing engines and apps;
other launch platforms remain in migration:

```sh
xplat session status SESSION_ID --json
xplat session end SESSION_ID --json
xplat session attach --platform macos --json
```

Native diagnostics can find local macOS .ips crash reports and retain their complete
originals separately from rotating logs. A confirmed association matches an observed
app PID and launch time; a candidate matches only the bundle id and report window.
Reports may arrive after app exit, so retry diagnostics if none are found. Use a
returned report id to read the original, including after the workspace owner exits:

```sh
xplat diagnostics --session SESSION_ID --json
xplat diagnostics --session SESSION_ID --report REPORT_ID --json
```

Retention is limited to ten reports per session, at most 4 MiB each and 16 MiB
total. Oversized/excess reports are omitted intact with partial coverage; a report
lookup failure leaves captured logs readable. Other OS report sources remain in
migration. Inspect the reported coverage with the same command:

```sh
xplat diagnostics --session SESSION_ID --json
```

## Contributor boundary

The package compiles the existing TypeScript macOS packager and native-leaf
compiler without calling the old CLI. The worker resolves tools from the selected
project, uses a versioned JSON request/result and sends diagnostics separately.
Nim owns permissions, jobs/sessions, deadlines, process groups, staging and publication.
The package has no CLI runtime dependency; its CLI workspace dependency is used
only to build the shared source and host assets.

The worker subpath is an internal CLI/toolchain protocol. Application code should
not import it. Maintainers qualify the actual packed package through Turbo:

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"macOS worker qualification"}' -- bun run turbo run test:nim-macos-build test:nim-macos-dev test:nim-macos-publication --filter=@octane-xplat/cli
```

## Call the development engine from Node

A Node-based project tool can reuse the same engine without another worker
process or the old CLI host API. Run it from the configured app; its promise
settles after shutdown or failure. This API requires the app's installed Vite
and native toolchain, just like the development worker.

```ts
import { runMacOSDev } from '@octane-xplat/macos-build/dev-engine'

await runMacOSDev(process.cwd())
```

Callers running this inside a CLI worker own the outer process group, cancellation
and resource lifetime. Create a private `resourceRoot` before passing it to the engine; this keeps owned
temporary assets outside dependency caches. The callback reports host-process launch, which does not prove
that the app rendered or is ready for interaction.

```ts
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMacOSDev } from '@octane-xplat/macos-build/dev-engine'

const resourceRoot = await mkdtemp(join(tmpdir(), 'xplat-dev-'))
await runMacOSDev(process.cwd(), {
  resourceRoot,
  onReady: ({ pid }) => console.log(`Host process started: ${pid}`),
})
await rm(resourceRoot, { recursive: true })
```
