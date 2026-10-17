# @octane-xplat/cli

> Run your app, inspect changes with your agent, and check builds for the
> targets you plan to ship.
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> the NativeScript toolchain (Xcode/JDK + `ns`).

For a new app, start with the [creator](../create/README.md). The CLI runs
configured web, iOS, and Android targets, plus opt-in experimental macOS,
Windows, and Linux apps. The Windows scaffold has passed bundle generation
only; launch and runtime behavior remain unverified. See [target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).

For an existing app:

```sh
pnpm add -D @octane-xplat/cli
```

```sh
pnpm xplat dev          # pick available targets
pnpm xplat dev macos    # single-target shorthand (kind or device id)
pnpm xplat add ios      # enable a platform skipped at create time
pnpm xplat build        # production builds
pnpm xplat build -t macos # experimental AppKit .app + .dmg (Apple Silicon)
pnpm xplat build -t linux # experimental GTK/WebKit app directory + tar archive
pnpm xplat doctor       # environment + framework patch check
pnpm xplat typecheck    # web + native tsconfigs
pnpm xplat fmt          # format JS/TS/JSX/TSX + .tsrx in place (--check, --stdin-filepath)
pnpm xplat patches apply  # install the framework's pnpm patch set into this app
pnpm xplat patches check  # verify the patch set is registered and unmodified
pnpm xplat fonts add ./Inter.ttf      # .ttf/.otf/.woff/.woff2 → src/fonts + fonts.css + --font-* token
pnpm xplat fonts add @fontsource-variable/inter --install  # Fontsource package
```

The scaffolded app's `pnpm dev` / `pnpm build` / `pnpm dev:ios` scripts drive
the supported targets directly; `xplat` is the multi-target front end. The
experimental macOS target is configured by the app and packaged by `xplat`.

```sh
pnpm dev
pnpm build
pnpm dev:ios
```

Linux packaging and its required manifest settings are documented in
[Package a Linux app](../../docs/platform/linux-package.md). The CLI ships the
GJS host; Linux users supply the GTK/WebKit system runtime.

## Agents

The same `xplat` binary is the agent-facing interface. Discovery and
retrieval commands emit one versioned JSON envelope to stdout with `--json`
(`{ contractVersion, ok, requestId, context, data | error }`), send
diagnostics to stderr, and use stable exit groups — `2` invalid or ambiguous
input, `3` unavailable prerequisite, `4` permission denied. None of them
start an app, target, or prompt.

```sh
xplat catalog --json      # every command: effects, permissions, input/output schemas
xplat status --json       # app selection, installed framework versions, prerequisites
xplat app select <id>     # bind an app for this client/workspace — never a global default
xplat capabilities --json # per-platform rows: build, launch, inspection, actions, capture
xplat permissions --json  # grant states — discovery never creates a grant
xplat targets --json      # launchable targets with exact ids and missing-toolchain reasons
xplat docs search <query> # the bound app's installed-version docs — never a latest fallback
xplat docs read --ref <ref>
xplat guidance            # guidance tailored to the installed versions
xplat code search <query> # current source: app corpus and framework corpus stay labeled
xplat code read --ref <ref>
```

`xplat <command> --schema` describes a command's inputs, outputs, and error
codes without running it; `xplat docs --help` works outside a project.
Selection precedence is `--app` for one invocation, then the `app select`
client/workspace preference (`--client` or `XPLAT_AGENT_CLIENT`), then unique
cwd discovery. Several detected apps report candidates and refuse silently
picking one.

The runtime surface runs through a per-workspace agent host the stateful
commands spawn on demand — it owns the dev servers, browsers, job registry,
log buffers, and evidence store that one-shot invocations cannot. Commands
that only read state connect when a host is live and otherwise report
absence honestly (`not_found`, or an empty list with `host.state: "absent"`);
a read never leaves a daemon behind. The host exits on its own once no live
session or job remains, with the same ownership-safe teardown the MCP
server runs. Extra permission scopes pass per invocation through
`XPLAT_PERMISSIONS` (e.g. `visual-capture`).

```sh
xplat runtime build --platform web --json   # a job — poll job status, read logs
xplat session start --platform web --json   # owned dev session + browser; readiness is a job
xplat session attach --platform web --json  # bind a dev session you already run — preserved on end
xplat session list --json                   # host-owned and attached sessions
xplat session status <sess_…> --json
xplat session end <sess_…> --json           # ownership-safe cleanup; attached apps keep running
xplat job status <job_…> --json
xplat job cancel <job_…> --json             # cooperative — never kills another user's process
xplat logs --session <sess_…> --json        # cursor-paginated; --job works too
xplat inspect <sess_…> --testid <name> --json   # bounded named hosts, redacted private values
xplat interact <sess_…> --document <id> --testid <name> --mechanism dom-event --json
xplat capture <sess_…> --json               # needs XPLAT_PERMISSIONS=visual-capture
xplat actions list --json                   # the dev app's declared action registry
xplat actions invoke --action <id> --json   # returns a job; --revision guards staleness
xplat actions status <job_…> --json
xplat evidence list --json                  # job/inspection/capture artifacts; retain/delete by id
```

The MCP transport (`xplat-mcp` from `@octane-xplat/mcp`) exposes the same
service contract to MCP clients — one implementation, two transports. Each
owns its own session state: a session started through `xplat-mcp` lives in
that server, not in the CLI's runtime host.

Docs: [Get a working app and iterate](https://octane-xplat.goddardai.org/toolchain)
— agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt)

## Framework patches

The framework carries a small set of upstream fixes as pnpm
`patchedDependencies` (`packages/cli/patches/` + manifest in the published
package). pnpm only honors them at an app's workspace root. For existing apps,
`xplat patches apply` copies the `.patch` files into `<app>/patches/` and merges
the block into the app's `pnpm-workspace.yaml` (or `pnpm.patchedDependencies`
in package.json). Fresh apps from `create-octane-xplat` fetch the
dependency-free `@octane-xplat/patches` package through pnpm
`configDependencies`; their patch paths point into
`node_modules/.pnpm-config/`.

## Working against a local checkout

Developing an app against a local checkout
(`"@octane-xplat/cli": "link:../octane-xplat/packages/cli"`)? pnpm 11 reads a
`link:` dep's manifest while resolving — before `preinstall` hooks run — so a
linked path that only appears mid-install (for example a symlink a hook
creates) installs without its `node_modules/.bin` shims: `xplat` and
`xplat-lint` come back `command not found`, and later installs report
"Already up to date" without re-linking. Restore the shims with:

```sh
node node_modules/@octane-xplat/cli/src/link-bins.ts
```

Run it from the app's `postinstall` (after the hook that creates the link
path) so the first install lands them, or reinstall with the path already
present. pnpm 12 links these bins normally.

## Native Vite preset

Also exports the native vite preset — it absorbs the app-owned native config
(renderer rules, octane→universal alias, `.ios`/`.android` extension chain,
HMR watchdog, `px→dip` rewrite):

```ts
// vite.config.native.mts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

## macOS AppKit preset

The experimental AppKit preset is exported separately from
`@octane-xplat/cli/macos/vite`:

```js
import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => xplatMacOS(mode))
```

It resolves the app's `@octane-xplat/macos-renderer` package and installed
Octane compiler. See [AppKit renderer setup](../macos-renderer/README.md) for
application dependencies, root ownership, fonts, and development bundles.

```js
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default await xplatMacOS('production', { entry: 'src/main.mjs' })
```
