# create-octane-xplat

> Get a TypeScript app running, then build its first useful flow with your
> coding agent.

Xplat's target direction spans web, iOS, Android, macOS, Windows, and Linux.
This starter configures **web, iOS, and Android**. macOS, Windows, and Linux
are separate experiments — an AppKit host, a WinUI 3 scaffold with runtime
verification pending, and a WebKitGTK webview host. See
[target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).
The framework is `0.x` and its API surface is still changing.

With Node.js and pnpm 11.24.0 installed:

```sh
pnpm create octane-xplat my-app
```

The starter's `tsconfig.json` selects the shared native JSX types from its
direct `@octane-xplat/jsx` dependency. Browser JSX leaves select DOM types on
their first line, as `src/main.web.tsrx` does:

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
export function BrowserMessage() {
	return <p>Ready</p>
}
```

See [platform files and JSX types](https://octane-xplat.goddardai.org/platform/module-resolution#typescript)
when adding a native or browser implementation.

## Start a library package

To start a reusable package instead of an app, select the library template:

```sh
pnpm create octane-xplat my-controls --template library
cd my-controls
pnpm typecheck
pnpm typegen
pnpm test:packed
```

The library starter publishes source for web, iOS, and Android, which the
consuming app compiles. It includes conditional exports, generated `.d.ts`
declarations, lint and unit-test
scripts, and a packed-consumer check. Pass `--name @acme/my-controls` to set a
scoped npm package name; otherwise the folder name becomes the package name.
Library creation installs dependencies but does not start an app dev server.
Desktop targets are not included in this starter.

The creator asks which platforms to target — web, iOS, and Android are all
pre-selected. Pass `--targets` to skip the prompt:

```sh
pnpm create octane-xplat my-app --targets web          # web only
pnpm create octane-xplat my-app --targets web,android  # web + Android
```

Platforms skipped here can be enabled later with `pnpm xplat add <platform>`
inside the app. (Non-interactive runs without `--targets` scaffold all
three.)

The creator copies the template, installs dependencies with pnpm, and starts
the web dev server when the web target is included. Open the printed URL and
open `my-app` in your agent.
Ask it to read `AGENTS.md` and `.agents/skills/xplat/SKILL.md`, then build a
packing checklist with add, pack, and remove actions using in-memory state.
Check the result before asking for the next feature: add “Passport” and
“Charger,” pack Passport, and confirm that one item remains. Reloading should
clear the list in this in-memory version. The
[first-flow guide](https://octane-xplat.goddardai.org/toolchain#build-and-check-your-first-flow)
includes the full prompt and failure checks.

The generated app pins pnpm 11.24.0. Its `pnpm-workspace.yaml` loads
`@octane-xplat/patches` as a `configDependencies` package, making the
framework patches available during the first install.

Apps start with the runtime, build packages, and tests their selected platforms
need. Feature packages are added when you use them.

## Run app tests

New apps include Vitest, configuration, sample tests, and scripts. From your
app's folder, run the command for a platform you enabled:

```sh
pnpm test:web            # when web is enabled
pnpm test:ios -- --device DEVICE_UDID  # when iOS is enabled
pnpm test:android -- --device DEVICE_SERIAL  # when Android is enabled
```

Web tests use jsdom, which simulates a browser's
document on your computer; phone tests use NativeScript's test runner on a
selected simulator or device. The runners are explicit development dependencies
with framework-managed versions in `catalog:xplat`. Adapt the sample tests to
your app as you replace the starter screen.

Platforms added later also receive their test setup. The library template
includes its component tests and publishing checks.
See [checking an app](../../docs/verify/testing.md#add-automated-tests) for the
commands, file conventions, and checks that still need a browser or phone.

## Keep compatible versions

App and library starters share the framework's compatible compiler, runtime,
and tool versions through `catalog:xplat`. To update an existing project,
preview and apply a published CLI release's set, then check the installed
packages:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm xplat doctor
```

An upgrade covers the workspace's managed dependencies and patches. Your
app-specific packages and library consumer peer ranges remain yours. See
[compatible versions](../cli/README.md#compatible-versions) for local links,
custom patches, deferred installs, and failure recovery.

Leave the server running while you edit. After stopping it, restart from the
app directory:

```sh
cd my-app
pnpm dev            # web
```

From that directory, these commands run other targets or check the app — the
`dev:*`/`build:*` entries exist only for platforms chosen at create time
(`pnpm xplat add` adds the rest later):

```sh
pnpm dev:ios        # needs macOS, Xcode, and NativeScript setup
pnpm dev:android    # needs Android SDK, compatible JDK, and NativeScript setup
pnpm lint
pnpm typecheck      # tsconfig.json + every declared environment
pnpm build          # web production bundle
```

[Get a working app and iterate](https://octane-xplat.goddardai.org/toolchain)
provides prerequisites, live-update boundaries, and version guidance. The
starter's Xplat skill is included; NativeScript's official skills are optional
and installed separately. Ask your agent to report checks and targets actually
run. [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the docs.
