# create-octane-xplat

> Get a TypeScript app running, then build its first useful flow with your
> coding agent.

Xplat's target direction spans web, iOS, Android, macOS, Windows, and Linux.
This starter configures **web, iOS, and Android**. macOS, Windows, and Linux
are separate experiments — an AppKit host, a WinUI 3 scaffold with runtime
verification pending, and a WebKitGTK webview host. See
[target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).
The framework is `0.x` and its API surface is still changing.

With Node.js 22.22.2 or later, plus Bun 1.4.4 or pnpm 11.24 or later:

```sh
bun create octane-xplat my-app
```

```sh
pnpm create octane-xplat my-app
```

The command you launch through becomes the app's **package manager**: the tool
that downloads packages and runs project scripts. `bun create` makes a Bun
project; `pnpm create` makes a pnpm project. Other launchers such as
`npx create-octane-xplat` use whichever of the two is installed and ask when
both are; `--package-manager bun` or `--package-manager pnpm` overrides that
choice for any launcher. If neither is installed, the creator still writes a
Bun project, skips the install step, and explains what to install next.

Both kinds of app work the same way afterward — the project scripts in this
guide run under `bun run` or `pnpm run`. Two pnpm differences to know: a pnpm
app pins `pnpm@11.24.0` in its `packageManager` field, so a newer pnpm
switches to that version automatically, and `pnpm run` passes extra arguments
directly — write `pnpm run test:ios --device DEVICE_UDID`, not
`pnpm run test:ios -- --device` (pnpm forwards a `--` separator to the script
literally, where Bun removes it).

The starter's `tsconfig.json` selects the shared native JSX types from its
direct `@octane-xplat/jsx` dependency. Browser JSX leaves select DOM types on
their first line, as `src/main.web.tsrx` does:

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
export function BrowserMessage() {
  return <p>Ready</p>
}
```

See [platform files and JSX types](https://octane-xplat.goddardai.org/module-resolution#typescript)
when adding a native or browser implementation.


[Generated API reference](https://octane-xplat.goddardai.org/api-create).

## Start a library package

To start a reusable package instead of an app, select the library template:

```sh
bun create octane-xplat my-controls --template library
cd my-controls
bun run typecheck
bun run typegen
bun run test:packed
```

`pnpm create` and `--package-manager` choose the library's manager the same
way; run the same scripts as `pnpm run …` in a pnpm project.

The library starter publishes source for web, iOS, and Android, which the
consuming app compiles. It includes conditional exports, generated `.d.ts`
declarations, lint and unit-test
scripts, and a packed-consumer check. Pass `--name @acme/my-controls` to set a
scoped npm package name; otherwise the folder name becomes the package name.
Library creation installs dependencies but does not start an app dev server.
Desktop targets are not included in this starter.
Follow [Publish a reusable component library](../app/component-libraries.md)
for app-based development, generated types, packed consumers, assets and npm
publication.

The creator asks which platforms to target — web, iOS, and Android are all
pre-selected. Pass `--targets` to skip the prompt:

```sh
bun create octane-xplat my-app --targets web          # web only
bun create octane-xplat my-app --targets web,android  # web + Android
```

Platforms skipped here can be enabled later with `bun run xplat add <platform>`
inside the app. (Non-interactive runs without `--targets` scaffold all
three.)

The creator copies the template, installs dependencies with Bun, and starts
the web dev server when the web target is included. Open the printed URL and
open `my-app` in your agent.
Ask it to read `AGENTS.md` and `.agents/skills/xplat/SKILL.md`, then build a
packing checklist with add, pack, and remove actions using in-memory state.
Check the result before asking for the next feature: add “Passport” and
“Charger,” pack Passport, and confirm that one item remains. Reloading should
clear the list in this in-memory version. The
[first-flow guide](https://octane-xplat.goddardai.org/toolchain#build-and-check-your-first-flow)
includes the full prompt and failure checks.

A Bun app pins `bun@1.4.4` and keeps its named catalogs, overrides, and patch
registrations in `package.json`; `bun.lock` records what Bun installed, and
`bunfig.toml` selects the flat dependency layout NativeScript needs. A pnpm app
pins `pnpm@11.24.0` and keeps the same settings in `pnpm-workspace.yaml`
instead — `catalogs.xplat`, `overrides`, `patchedDependencies`,
`allowUnusedPatches`, `allowBuilds` (the approved and denied install-time build
scripts), `nodeLinker: hoisted` (the same flat-tree requirement), and
`saveExact` — plus `pnpm-lock.yaml` instead of `bun.lock`. There is no
`bunfig.toml` in a pnpm app. Either way, local `patches/` files are available
before the first install; keep them and the lockfile in Git.

**Apps created with 0.19.0 through `bun create` are missing `bunfig.toml`** —
the published tarball dropped it. If your Bun app's root has
no `bunfig.toml`, add one, then reinstall:

```toml
[install]
linker = "hoisted"
exact = true
```

```sh
bun install
```

pnpm 11 holds back package versions published in the last 24 hours by default
(a supply-chain safeguard called
[`minimumReleaseAge`](https://pnpm.io/settings#minimumreleaseage)). Right after
a framework release, `pnpm install` may hold back or adjust a just-published
version and add a `minimumReleaseAgeExclude` line to `pnpm-workspace.yaml`.
Waiting a day is the simplest fix; adding an exclusion for a package you trust
is your choice to make.

Apps start with the runtime, build packages, and tests their selected platforms
need. Feature packages are added when you use them.

## Run app tests

New apps include Vitest, configuration, sample tests, and scripts. From your
app's folder, run the command for a platform you enabled:

```sh
bun run test:web            # when web is enabled
bun run test:ios -- --device DEVICE_UDID  # when iOS is enabled
bun run test:android -- --device DEVICE_SERIAL  # when Android is enabled
```

In a pnpm app the same scripts run without the `--` separator:

```sh
pnpm run test:web
pnpm run test:ios --device DEVICE_UDID
pnpm run test:android --device DEVICE_SERIAL
```

Web tests use jsdom, which simulates a browser's
document on your computer; phone tests use NativeScript's test runner on a
selected simulator or device. The runners are explicit development dependencies
with framework-managed versions in `catalog:xplat`. Adapt the sample tests to
your app as you replace the starter screen.

Platforms added later also receive their test setup. The library template
includes its component tests and publishing checks.
See [checking an app](https://octane-xplat.goddardai.org/testing#add-automated-tests) for the
commands, file conventions, and checks that still need a browser or phone.

## Keep compatible versions

App and library starters share the framework's compatible compiler, runtime,
and tool versions through `catalog:xplat`. To update an existing project,
preview and apply a published CLI release's set, then check the installed
packages:

```sh
bunx @octane-xplat/cli@latest upgrade --check
bunx @octane-xplat/cli@latest upgrade
bun run xplat doctor
```

The pnpm form uses `pnpm dlx`:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm run xplat doctor
```

An upgrade covers the workspace's managed dependencies and patches. Your
app-specific packages and library consumer peer ranges remain yours. See
[compatible versions](https://octane-xplat.goddardai.org/package-cli#compatible-versions) for local links,
custom patches, deferred installs, and failure recovery.

Leave the server running while you edit. After stopping it, restart from the
app directory:

```sh
cd my-app
bun run dev            # web
# pnpm app: pnpm run dev
```

From that directory, these commands run other targets or check the app — the
`dev:*`/`build:*` entries exist only for platforms chosen at create time
(`bun run xplat add` adds the rest later):

```sh
bun run dev:ios        # needs macOS, Xcode, and NativeScript setup
bun run dev:android    # needs Android SDK, compatible JDK, and NativeScript setup
bun run lint
bun run typecheck      # tsconfig.json + every declared environment
bun run build          # web production bundle
```

[Get a working app and iterate](https://octane-xplat.goddardai.org/toolchain)
provides prerequisites, live-update boundaries, and version guidance. The
starter's Xplat skill is included; NativeScript's official skills are optional
and installed separately. Ask your agent to report checks and targets actually
run. [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the docs.
