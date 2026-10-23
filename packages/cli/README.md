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
pnpm xplat doctor       # environment, installed versions, runtime copies + patches
pnpm xplat upgrade --check # preview alignment to this CLI's compatibility set
pnpm xplat upgrade      # align workspace versions and patches, then install
pnpm xplat typecheck    # web + native tsconfigs
pnpm xplat lint         # check JS/TS/JSX/TSX + .tsrx (--fix for safe fixes)
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

With `xplat build --targets`, every requested kind must be available for that
app. A mixed selection such as `web,android` fails before route generation or
any build starts if Android is unavailable. The error lists the available kinds.
Without `--targets`, the interactive picker or noninteractive all-target
selection still applies.

```sh
pnpm xplat build --targets web,android
```

Linux packaging and its required manifest settings are documented in
[Package a Linux app](../../docs/platform/linux-package.md). The CLI ships the
GJS host; Linux users supply the GTK/WebKit system runtime.

## App testing

Read output from an earlier `xplat dev` run, even after its process exits:

```sh
pnpm xplat diagnostics --json                  # list this app's retained sessions
pnpm xplat diagnostics --session SESSION_ID --json     # replace SESSION_ID with a returned sessionId
```

See [development diagnostics](../../docs/testing/diagnostics.md) for platform
coverage, browser forwarding, retention, and cursor-based reads.

New apps include test setup for their enabled platforms, with framework-managed
runner versions. Run the web tests from your app directory:

```sh
pnpm test:web
```

Vitest, configuration, and sample tests are included by default.
Web includes jsdom and `test:web`; iOS/Android include NativeScript's test runner and
`test:ios`/`test:android`. Only scripts for enabled platforms are added. Run a
phone suite with an explicit device:

```sh
pnpm test:ios -- --device DEVICE_UDID
pnpm test:android -- --device DEVICE_SERIAL
```

Adding a platform later includes its test setup. Inside a pnpm workspace (several
packages sharing one install), the command adds missing version pins and patch
settings to the nearest enclosing `pnpm-workspace.yaml`. Existing settings stay
intact, and the app stays in that workspace:

```sh
pnpm xplat add ios
```

To review the file and workspace changes before installing dependencies, run
these commands from the app directory:

```sh
pnpm xplat add ios --no-install
git diff
pnpm install
```

Existing files, dependency specifications, and scripts are preserved. Review
skipped-file warnings, reconcile custom configuration, and adapt the sample tests
to your app. Web tests match `src/**/*.web.test.{ts,tsx,tsrx}` through
`vitest.web.config.mts`; phone specs match `src/**/*.spec.{ts,tsx,tsrx}` through
`vitest.config.mts` and `src/test.ts`. See the
[testing guide](../../docs/testing/testing.md#add-automated-tests) for what each
test environment can verify.

## Compatible versions

Use one release's compatible package set. To adopt the latest published CLI's
set, run these from your app directory; a workspace upgrade covers all of its
packages, including when invoked inside one member:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm xplat doctor
```

`upgrade` uses the **executing CLI's release**, without a separate latest-version
lookup. Replace `latest` with an exact CLI version to select a release.
`--check` previews authored file changes, exits `1` when changes are needed,
and writes nothing. `--no-install` writes the plan for review and leaves the
install to you:

```sh
pnpm xplat upgrade --no-install
pnpm install --no-frozen-lockfile
pnpm xplat doctor
```

| Managed together when declared                                      | Kept under application/library ownership                              |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Lockstep Xplat packages, Octane and NativeScript renderers          | App-specific libraries and plugins outside the compatibility manifest |
| TypeScript, TSRX compiler peer/editor plugin, declaration generator | Library consumer `peerDependencies` ranges                            |
| Vite and Octane/NativeScript Vite integrations                      | `workspace:`, `link:`, `file:` and `portal:` development dependencies |
| NativeScript CLI, platform runtimes/types, known starter plugins    | User catalogs, custom patch files, unrelated overrides and scripts    |
| Vitest, jsdom, and NativeScript's test runner, when enabled         | Application tests and platform qualification                          |

New scaffolded apps default to full MasonKit. To try the published Mason core
beta in an isolated iOS/Android app, declare only core. Upgrade preserves that
choice and its version or local specifier. Doctor rejects core alongside full
MasonKit, duplicate installed core copies, and Windows use. The repository's
mobile proving harnesses use core; Windows retains full MasonKit. See the
[extraction design](../../.agents/design/mason-core-extraction.md) for
qualification limits.

```json
{
	"dependencies": {
		"@octane-xplat/nativescript-mason-core": "1.0.0-beta.0"
	}
}
```

Dependencies remain declared in each package. Their exact build/runtime pins
move to `catalog:xplat` in `pnpm-workspace.yaml`; Windows preview packages use
`catalog:xplat-windows` so mobile pins cannot replace their snapshot URLs.
The command adds Octane's missing `@tsrx/oxc` compiler peer, but does not add
undeclared test tools or platform runtimes. The manifest also supplies Node's
minimum version and the pnpm version; existing app Node engine restrictions
are preserved.

```json
{
	"dependencies": { "octane": "catalog:xplat" },
	"devDependencies": { "@tsrx/oxc": "catalog:xplat" }
}
```

Matching patches come from the same release's `@octane-xplat/patches` config
package. Custom patches and conflicting overrides must be reconciled before
the plan writes any files. Old user-owned patch mappings remain intact; old
framework config-package mappings are replaced. A failed install leaves the
updated files available for review. Fix its error and repeat the install:

```sh
pnpm install --no-frozen-lockfile
pnpm xplat doctor
```

`doctor` checks declarations and the reachable installed dependency graph,
including export-restricted packages. Managed version failures make it exit
`1`. A duplicate-runtime error lists physical paths, even when versions match;
use the package named in the report to find which dependency brought it in:

```sh
pnpm why octane
pnpm xplat doctor
```

These are host checks; run your tests and relevant target builds after an
upgrade. The shared [compatibility manifest](../create/compatibility.json)
defines the set. Leaf packages continue to own their internal engine/plugin
dependencies; those are not hidden in the CLI or indiscriminately overridden.

## Lint and format

Run from your app or library directory. Linting uses bundled Oxlint and Xplat
rules without extra setup; paths restrict both the regular-source and TSRX
passes. `--fix` applies safe Oxlint fixes to regular source and reports errors
that still need attention. Formatting is a separate step:

```sh
pnpm exec xplat lint
pnpm exec xplat lint src
pnpm exec xplat lint --fix src
pnpm exec xplat fmt
pnpm exec xplat fmt --check
```

Lint exits `0` when no errors remain, `1` for lint errors, and `2` for command
or setup failures. Warnings are advisory. Both passes honor `.gitignore`
(including nested files), `.eslintignore`, and root config `ignorePatterns`,
skip build output, symlinks and nested repositories, and accept files or
directories. Shell-expanded file lists work too:

```sh
pnpm exec xplat lint src/*.ts src/*.tsrx
```

TSRX runs the `xplat/*` rules through its own parser; Oxlint's built-in rules
and automatic fixes run on regular JS/TS/JSX/TSX source. A project-root
`.oxlintrc.json` replaces the bundled preset. See the
[lint package](../lint/README.md#project-configuration) to retain the preset
and override individual rules. Existing `xplat-lint` scripts still work:

```sh
pnpm exec xplat-lint --fix src
```

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
log buffers, and evidence store that one-shot invocations cannot. Session list/status and diagnostics read durable session records even after
the owner exits. Other reads use the live host and otherwise report absence
honestly (`not_found`, or an empty list with `host.state: "absent"`); a read
never leaves a daemon behind. The host exits on its own once no live
session or job remains, with the same ownership-safe teardown the MCP
server runs. Extra permission scopes pass per invocation through
`XPLAT_PERMISSIONS` (e.g. `visual-capture`).

```sh
xplat runtime build --platform web --json   # a job — poll job status, read logs
xplat session start web --json   # owned dev session + browser; poll session status for readiness
xplat session attach --platform web --json  # bind a dev session you already run — preserved on end
xplat session list --json                   # retained owned and attached sessions
xplat session status <sess_…> --json
xplat session end <sess_…> --json           # ownership-safe cleanup; attached apps keep running
xplat job status <job_…> --json
xplat job cancel <job_…> --json             # cooperative — never kills another user's process
xplat diagnostics --session <sess_…> --json        # cursor-paginated; --job works too
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
HMR watchdog, `px→dip` rewrite, `NS_VENDOR_EXCLUDE` entries for source-only
deps):

```ts
// vite.config.native.mts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

When the app explicitly declares the Mason core package, this same
preset resolves the canonical renderer patch's MasonKit imports to that app's
core installation, including the style subpath. Keep the canonical renderer
patch; no edited renderer copy is needed. Core and full MasonKit cannot share
an app. This opt-in applies to iOS/Android; it does not change starter defaults.

```ts
// With the core dependency shown under Compatible versions:
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
