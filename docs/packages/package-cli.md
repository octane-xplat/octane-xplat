# @octane-xplat/cli

> Run your app, inspect changes with your agent, and check builds for the
> targets you plan to ship.
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> Node, the installed NativeScript runtimes and official Vite package, plus
> Xcode for iOS or the Android SDK/JDK for Android.

For a new app, start with the [creator](https://octane-xplat.goddardai.org/package-create). The CLI runs
configured web, iOS, and Android targets, plus opt-in experimental macOS,
Windows, and Linux apps. Desktop setup and support depend on the selected
host; check [target support](https://octane-xplat.goddardai.org/spec#choose-your-targets)
before adding one to an app.

The `xplat` command is a native executable — it does not run under Node or
Bun. The app toolchain around it still needs Node >=22.22.2, the package
manager your starter selected (**Bun 1.4.4 or later** or pnpm), Vite, and the
platform toolchains for your targets; see [Native executable](#native-executable)
for how the binary is installed. For a Bun-managed app, install Bun using its
[installation guide](https://bun.sh/docs/installation), then check it before
adding the CLI to an existing app:

```sh
bun --version
bun add -D @octane-xplat/cli
```

```sh
bun run xplat dev          # pick available targets
bun run xplat dev macos    # single-target shorthand (kind or device id)
bun run xplat add ios      # enable a platform skipped at create time
bun run xplat build        # production builds
bun run xplat build -t macos # experimental AppKit .app + .dmg (universal: Apple Silicon and Intel)
bun run xplat build -t linux # experimental GTK/WebKit app directory + tar archive
bun run xplat doctor       # environment, installed versions, runtime copies + patches
bun run xplat upgrade --check # preview alignment to this CLI's compatibility set
bun run xplat upgrade      # align workspace versions and patches, then install
bun run xplat typecheck    # web + native tsconfigs
bun run xplat lint         # check JS/TS/JSX/TSX + .tsrx (--fix for safe fixes)
bun run xplat fmt          # format JS/TS/JSX/TSX + .tsrx and other Oxfmt languages in place (--check, --stdin-filepath)
bun run xplat patches apply  # install the framework's patch set into this app
bun run xplat patches check  # verify the patch set is registered and unmodified
bun run xplat fonts add ./Inter.ttf      # .ttf/.otf/.woff/.woff2 → src/fonts + fonts.css + --font-* token
bun run xplat fonts add @fontsource-variable/inter --install  # Fontsource package
```

Font registration keeps its saved family data in `src/fonts/fonts.json` (or the
configured app source directory). If that file contains invalid JSON, repair it
before retrying; keep its existing registrations rather than deleting the file.
Each input, converted font, or managed output is limited to 16 MiB; one
registration plan is limited to 32 MiB. Use smaller files or Fontsource subsets,
and split large collections across separate registrations.

```sh
bun run xplat fonts add ./Inter.ttf
```

The scaffolded app's `bun run dev` / `bun run build` / `bun run dev:ios` scripts drive
the supported targets directly; `xplat` is the multi-target front end. The
experimental macOS target is configured by the app and packaged by `xplat`.

```sh
bun run dev
bun run build
bun run dev:ios
```

With `xplat build --targets`, every requested kind must be available for that
app. A mixed selection such as `web,android` fails before route generation or
any build starts if Android is unavailable. The error lists the available kinds.
Without `--targets`, the interactive picker or noninteractive all-target
selection still applies.

```sh
bun run xplat build --targets web,android
```

Simulator/emulator development and debug iOS/Android builds use the reusable
NativeScript Go library inside `xplat`. Keep the app's installed `@nativescript/vite`,
platform runtime and Vite config. Development uses HMR by default. Use `--no-hmr`
when each source edit should restart the app instead of applying a live patch:

```sh
bun run xplat dev ios
bun run xplat dev android --no-hmr
bun run xplat build --targets ios
```

Release signing, device archives and `--copy-to` require the explicit upstream
engine and the project's installed `nativescript` package. This choice keeps
those existing workflows available while their embedded replacements remain
unqualified; a debug build failure never silently selects another engine.

```sh
XPLAT_NATIVE_ENGINE=upstream bun run xplat build --targets android --release
```

Phone targets accept the store-artifact options of the release workflow:
`--aab` and `--key-store-path`/`--key-store-alias` plus
`--key-store-password-env`/`--key-store-alias-password-env` for Android
(the password options name environment variables, never values; the same
fields can live in `xplat.targets.android.signing` in `package.json`), and
`--for-device`, `--provision`, `--team-id` for iOS. `--copy-to` copies the
produced artifact to a file or directory on a single-target build. The
command prints each produced `Artifact: <path> (<type>)`.

```sh
XPLAT_NATIVE_ENGINE=upstream bun run xplat build --targets android --release --aab \
  --key-store-path "$ANDROID_UPLOAD_KEYSTORE" --key-store-alias upload \
  --key-store-password-env ANDROID_KEYSTORE_PASSWORD \
  --key-store-alias-password-env ANDROID_KEY_PASSWORD \
  --copy-to dist/app-release.aab
XPLAT_NATIVE_ENGINE=upstream bun run xplat build --targets ios --release --for-device --copy-to dist/app.ipa
```

See [Release an iOS or Android app](https://octane-xplat.goddardai.org/native-release)
for signing setup and store distribution.

Linux packaging and its required manifest settings are documented in
[Package a Linux app](https://octane-xplat.goddardai.org/linux-package). The CLI ships the
GJS host; Linux users supply the GTK/WebKit system runtime.


[Generated API reference](https://octane-xplat.goddardai.org/api-cli).

## Single-file executable

The CLI executables workflow attaches native Go executables to
[GitHub Releases](https://github.com/octane-xplat/octane-xplat/releases), named `xplat-<platform>-<architecture>` (with
`.exe` on Windows), alongside SHA-256 checksums. The executable is a single
native binary — a much smaller download that needs no Bun payload or
extraction cache. App builds still need Node, Bun, and the toolchains for
their selected platforms.

For example, after downloading the macOS Apple Silicon executable, run from
its download folder:

```sh
chmod +x ./xplat-darwin-arm64
./xplat-darwin-arm64 --help
```

```sh
XPLAT_CLI_CACHE=./.xplat-cli-cache ./xplat-darwin-arm64 catalog --json
```

Repository contributors can build and check an executable for the current
host. Go 1.27.3 must be available; the build uses `GOTOOLCHAIN=local` and
keeps artifacts in the ignored `research/go-cli/` directory. These commands
build `research/go-cli/xplat-go-<platform>-<arch>-cli` (`-cli.exe` on
Windows) and run the native contract check:

```sh
bun run turbo run build:go --filter=@octane-xplat/cli
bun run turbo run test:go-cli --filter=@octane-xplat/cli
```

Build on each destination OS and architecture so the binary matches that
host. The CLI executables workflow does this for macOS and Linux arm64/x64
and Windows x64.

## Native executable

`xplat` is a native Go executable; the TypeScript and Nim implementations are
removed. When you install `@octane-xplat/cli` (directly or through the
`octane-xplat` package), its install script copies the executable for your
machine out of an optional payload package:
`@octane-xplat/cli-native-darwin-arm64`, `-darwin-x64`, `-linux-x64`,
`-linux-arm64` or `-win32-x64`.

The installed `xplat` command runs Go directly. Node runs during installation
and when a command needs a JavaScript tool, such as Vite or the upgrade worker.
The executable is named `bin/xplat.exe` on every host so Windows command links
also launch it directly. You still type `xplat`:

```sh
xplat --version
xplat --help
```

New starters allow both native installers. `xplat upgrade` adds these permissions
to Bun projects; preserve other entries already in your project:

```json
{ "trustedDependencies": ["octane-xplat", "@octane-xplat/cli"] }
```

For pnpm, allow the installers in `pnpm-workspace.yaml`. npm runs them unless
install scripts have been disabled:

```yaml
allowBuilds:
  octane-xplat: true
  '@octane-xplat/cli': true
```

If installation scripts were blocked, `xplat` fails. POSIX shells show a repair
message; Windows may report an invalid executable instead. Enable the permissions
above and reinstall, or run the installer explicitly from the project directory.
For an app using the `octane-xplat` umbrella, this repairs both command entries:

```sh
node node_modules/octane-xplat/install-native.mjs
xplat --version
```

For a project that declares `@octane-xplat/cli` directly, use its installer:

```sh
node node_modules/@octane-xplat/cli/install-native.mjs
xplat --version
```

Keep optional dependencies enabled: they contain the platform executable. On a
host outside the five platforms above, installation warns and succeeds so the
JavaScript exports remain usable, but the native command cannot run. Contributors
can prepare both local command entries with the host Go build:

```sh
turbo run build:go --filter=@octane-xplat/cli
bun run xplat catalog --json
```

Keep the project's Node >=22.22.2, Bun 1.4.4, Vite and matching `@octane-xplat/cli` package installed;
the native executable does not include those tools. A web build returns a job
that you can inspect and cancel:

```sh
xplat runtime build --platform web --json
# Replace JOB_ID with the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
xplat job cancel JOB_ID --json
```

The npm tarball keeps the small Vite plugins and worker alongside
the native binary. Projects using those JS exports install their engine packages
separately; a native-only installation does not download them. Native build commands resolve their worker and declarations from the selected
project's compatible CLI installation; no separate build package is required. For projects using the CLI Vite imports directly, install the
currently supported engines:

```sh
bun add --dev vite@8.3.0 @tsrx/core@0.5.5 @octane-xplat/lib@0.19.0 \
  postcss@8.5.32 postcss-load-config@6.0.1 marked@18.1.2 \
  @babel/core@8.0.9 @babel/plugin-transform-unicode-property-regex@8.0.1 \
  @babel/plugin-transform-unicode-sets-regex@8.0.1
```

Keep the existing Vite import when using the native package. The large macOS host
assets remain a separate optional installation:

```ts
import { css } from '@octane-xplat/cli/vite'

const cssPlugin = css('web')
```

Native `status` discovers apps, installed framework versions, project guidance,
source coverage and tools on your PATH without needing Node or Bun to run the
report. Missing tools are reported with installation hints. Use `capabilities`
to check which operations your native build provides; a tool being installed
does not mean an SDK, device or running app is ready:

```sh
xplat status --project "$PWD" --json
xplat capabilities --project "$PWD" --json
```

Native lint runs the project's installed lint engine on macOS Apple Silicon.
Install `@octane-xplat/lint` in that project and provide Node >=22.22.2 on PATH;
the native download includes neither. The engine keeps its regular-source and
TSRX rules, project ignores, and opt-in safe fixes. Help works without Node.

```sh
bun add --dev @octane-xplat/lint
xplat lint --help
xplat lint src
xplat lint --fix src
```

Native formatting on macOS Apple Silicon uses the project's installed
`@octane-xplat/fmt@0.3.0` and Node ^20.19.0 || >=22.12.0. Run from your app or library folder.
Check mode reports differences without writes; ordinary formatting updates the
selected files. Configuration or parse errors leave the entire batch unchanged.
Help works without Node, and the native download includes neither Node nor the
formatter engine:

```sh
bun add --dev @octane-xplat/fmt@0.3.0
xplat fmt --help
xplat fmt src --check
xplat fmt src
printf 'const x=1\n' | xplat fmt --stdin-filepath src/example.ts
```

Native docs search and reads work without Node or Bun on macOS Apple Silicon.
Search follows the selected app's installed versions, reports conflicts or missing
snapshots, and labels local project guidance separately. Start with lexical search
(matching words); use a returned `ref` to read the same versioned page:

```sh
# In this repository, select the web app; in another workspace, select its app id.
xplat docs search navigation --project "$PWD" --app apps/web --mode lexical --json
# Replace DOC_REF with a ref returned by the search.
xplat docs read --project "$PWD" --app apps/web --ref DOC_REF --json
```

For semantic search (matching meaning), explicitly prepare the optional native
model first. Its pinned model/runtime download is about 61 MB, with about 69 MB
retained locally, separately from the executable. Indexing and queries stay on
your computer. Ordinary search never downloads these assets and reports a lexical
fallback when embeddings are unavailable; re-index after editing linked docs:

```sh
xplat docs index --project "$PWD" --app apps/web --package @octane-xplat/ui --json
xplat docs search "remember input between pages" --project "$PWD" --app apps/web --json
```

The native docs cache lives in its own `XPLAT_MCP_CACHE` namespace. Optional
model files are retained separately from the executable. Searches reject
external symlink targets and bound traversal; docs larger than 4 MiB produce
an explicit error:

```sh
xplat docs index --project "$PWD" --app apps/web --package @octane-xplat/ui --json
```

Native action discovery reads the running app's development bridge without
starting Node itself. Start the app with its existing development workflow, then list its
instances and declared actions. An empty registry is different from an unreachable
bridge; use the returned instance and revision when invoking:

```sh
xplat actions list --project "$PWD" --app apps/web --json
```

Invocation requires Node >=22.22.2 and a compatible `@octane-xplat/cli` worker
installed in the selected project. Use the matching
release build package; an older worker reports an update requirement.
The worker checks JavaScript field contracts, including regexes and defaults.
Go owns permission checks, HTTP, bounded queues, jobs and cancellation. Follow
the returned job through completion and inspect reported effects before retrying:

```sh
# Replace these values with exact identities from the live listing.
xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key fixture-setup-1 --project "$PWD" --app apps/web --json
xplat actions status JOB_ID --project "$PWD" --json
xplat job cancel JOB_ID --project "$PWD" --json
```

Request keys recover live jobs within their app instance/action. Reusing a key
with different input or a changed revision fails explicitly. Outcome history is
bounded, so keys do not promise indefinite protection against reruns. Queued
cancellation prevents dispatch; cancellation after dispatch is best-effort and
does not undo changes. A result-contract failure also leaves completed effects
in place. Read the job's structured result or failure:

```sh
xplat job status JOB_ID --project "$PWD" --json
```

Native `typecheck` runs the selected project's installed TypeScript compiler
as `tsc --runExternalCode`. The project must already contain compatible
`@octane-xplat/cli` and TypeScript 7.1 packages — the `octane-xplat` umbrella
supplies both. From that project's directory,
invoke your built executable by its absolute path. A successful check prints
`Typecheck clean`; compiler errors exit with status 1. Route types are regenerated
without executing baked loaders:

```sh
# Replace /path/to/octane-xplat with your repository's absolute path.
xplat typecheck
```

Native `routes` generates route contracts and platform catalogs, and bakes loader
or Markdown data using the project's build package. Loader execution also needs
its installed Vite and Node. Run it once, or watch source/configuration edits.
A failed or obsolete bake leaves the previous generated files in place. Keep the
output path stable while watching; stop before moving generated files and update
client imports afterward. `--dir` and `--out` require a value; missing values fail
before generating files:

```sh
xplat routes
xplat routes --watch
```

Native session and job commands connect to a background owner for the workspace.
A read does not start that process. With no owner, session reads use retained
history when available; build-job state requires its live owner. Each CLI
implementation owns its runtime state. Web builds run on macOS and the qualified
Ubuntu x64 host; development sessions and native app builds require macOS.
Other engines remain migration work:

```sh
xplat session list --json
```

Native web builds use your project's installed Vite and package manager. The
Linux executable also needs the host's glibc, matching C++ runtime and
`libcurl.so.4`; other Linux distributions remain unqualified. Run
`build` from the app directory for foreground output, or use `runtime build` for
a background job. Poll its returned job id and read captured output. Job logs
are bounded and disappear when the background owner exits:

```sh
xplat build --targets web
xplat runtime build --platform web --json
# Replace JOB_ID with the returned id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
```

Native macOS builds use a separate [macOS build worker](package-macos-build.md).
Install it in an already configured macOS app, then build in the foreground or
start a job. Its host assets stay in the project toolchain:

```sh
bun add --dev @octane-xplat/macos-build @octane-xplat/cli
xplat build --targets macos
xplat runtime build --platform macos --json
```

For an app with macOS development configuration, start its installed development
engine and inspect the returned session. Go owns the session and process cleanup;
Vite and the native compiler handle rebuilds in the project toolchain. See the
[development workflow](package-macos-build.md#start-a-development-session) for
prerequisites and current limits. Retained session logs remain readable after
the native owner exits; build-job log captures still last only while it runs:

```sh
xplat targets --platform macos --json
xplat session start macos --json
xplat session status SESSION_ID --json
xplat diagnostics --session SESSION_ID --json
xplat session end SESSION_ID --json
```

If you already run a compatible macOS development engine from the app's directory,
attach without transferring ownership. The returned session describes inferred
process identity, not confirmed UI readiness. Only lifecycle events are captured;
app output stays in its existing terminal. Ending the attachment or shutting down
the native owner leaves the external engine and app running. If several engines
match, choose a returned candidate with `--target TARGET_ID`:

```sh
xplat session attach --platform macos --json
xplat diagnostics --session SESSION_ID --json
xplat session end SESSION_ID --json
```

Native macOS diagnostics also retain complete local crash reports separately
from logs. Read their availability and association in the diagnostic result, then
select a returned report id. See [macOS session diagnostics](package-macos-build.md#start-a-development-session)
for limits and interpretation:

```sh
xplat diagnostics --session SESSION_ID --json
xplat diagnostics --session SESSION_ID --report REPORT_ID --json
```

Inspect the native catalog before using another workflow:

```sh
xplat catalog --json
```

## App testing

Read output from an earlier `xplat dev` run, even after its process exits:

```sh
bun run xplat diagnostics --json                  # list this app's retained sessions
bun run xplat diagnostics --session SESSION_ID --json     # replace SESSION_ID with a returned sessionId
```

See [development diagnostics](https://octane-xplat.goddardai.org/diagnostics) for platform
coverage, browser forwarding, retention, and cursor-based reads.

New apps include test setup for their enabled platforms, with framework-managed
runner versions. Run the web tests from your app directory:

```sh
bun run test:web
```

Vitest, configuration, and sample tests are included by default.
Web includes jsdom and `test:web`; iOS/Android include NativeScript's test runner and
`test:ios`/`test:android`. Only scripts for enabled platforms are added. Run a
phone suite with an explicit device:

```sh
bun run test:ios -- --device DEVICE_UDID
bun run test:android -- --device DEVICE_SERIAL
```

Adding a platform later uses the Bun starter configuration and includes its test setup. Inside a Bun workspace (several
packages sharing one install), the command adds missing version pins and patch
settings to the owning workspace’s root `package.json`. Existing settings stay
intact, and the app stays in that workspace:

```sh
bun run xplat add ios
```

To review the file and workspace changes before installing dependencies, run
these commands from the app directory:

```sh
bun run xplat add ios --no-install
git diff
bun install
```

In a pnpm project the same command works — pins, patch registrations, and
`allowBuilds` approvals go into `pnpm-workspace.yaml`, and the install runs
`pnpm install`:

```sh
pnpm run xplat add ios --no-install
git diff
pnpm install
```

Existing files, dependency specifications, and scripts are preserved. Review
skipped-file warnings, reconcile custom configuration, and adapt the sample tests
to your app. Web tests match `src/**/*.web.test.{ts,tsx,tsrx}` through
`vitest.web.config.mts`; phone specs match `src/**/*.spec.{ts,tsx,tsrx}` through
`vitest.config.mts` and `src/test.ts`. See the
[testing guide](https://octane-xplat.goddardai.org/testing#add-automated-tests) for what each
test environment can verify.

## Compatible versions

Use one release's compatible package set. To adopt the latest published CLI's
set, run these from your app directory; a workspace upgrade covers all of its
packages, including when invoked inside one member:

```sh
bunx @octane-xplat/cli@latest upgrade --check
bunx @octane-xplat/cli@latest upgrade
bun run xplat doctor
```

`upgrade` uses the **executing CLI's release**, without a separate latest-version
lookup. Replace `latest` with an exact CLI version to select a release.
`--check` previews authored file changes, exits `1` when changes are needed,
and writes nothing. `--no-install` writes the plan for review and leaves the
install to you:

```sh
bun run xplat upgrade --no-install
bun install --no-frozen-lockfile
bun run xplat doctor
```

In a pnpm project, `pnpm dlx @octane-xplat/cli@latest upgrade` behaves the same
way and installs with pnpm. Upgrades write local `patches/` files like Bun,
unless the workspace already declares `@octane-xplat/patches` in
`configDependencies` — that existing opt-in keeps the config-package mode.

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --no-install
pnpm install --no-frozen-lockfile
pnpm run xplat doctor
```

The CLI publishes at the same lockstep version as every other package — the
`nim` channel is removed. The upgrade planner treats `@octane-xplat/cli`
like any managed pin.

| Managed together when declared                                      | Kept under application/library ownership                              |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Lockstep Xplat packages, Octane and NativeScript renderers          | App-specific libraries and plugins outside the compatibility manifest |
| TypeScript, TSRX compiler peer/editor plugin, declaration generator | Library consumer `peerDependencies` ranges                            |
| Vite and Octane/NativeScript Vite integrations                      | `workspace:`, `link:`, `file:` and `portal:` development dependencies |
| NativeScript CLI, platform runtimes/types, known starter plugins    | User catalogs, custom patch files, unrelated overrides and scripts    |
| Vitest, jsdom, and NativeScript's test runner, when enabled         | Application tests and platform qualification                          |

Mason core is the only supported iOS/Android layout engine; full MasonKit and
the legacy `@triniwiz` package were replaced. Scaffolded apps declare the core
beta in `catalog:xplat`; upgrade migrates replaced engine pins and doctor
rejects them until it runs. The Windows preview retains full MasonKit because
core ships no Windows artifacts. See the
[extraction design](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/design/mason-core-extraction.md) for
qualification limits.

```json
{
	"dependencies": {
		"@octane-xplat/nativescript-mason-core": "catalog:xplat"
	}
}
```

Dependencies remain declared in each package. Their exact build/runtime pins
move to `catalog:xplat` in root `package.json.workspaces.catalogs`; Windows preview packages use
`catalog:xplat-windows` so mobile pins cannot replace their snapshot URLs.
The command adds Octane's missing `@tsrx/oxc` compiler peer, but does not add
undeclared test tools or platform runtimes. The manifest also supplies Node's
minimum version and the Bun version; existing app Node engine restrictions
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
bun install --no-frozen-lockfile
bun run xplat doctor
```

`doctor` checks declarations and the reachable installed dependency graph,
including export-restricted packages. Managed version failures make it exit
`1`. A duplicate-runtime error lists physical paths, even when versions match;
use the package named in the report to find which dependency brought it in:

```sh
bun why octane
bun run xplat doctor
```

These are host checks; run your tests and relevant target builds after an
upgrade. The shared [compatibility manifest](https://github.com/octane-xplat/octane-xplat/blob/main/packages/create/compatibility.json)
defines the set. Leaf packages continue to own their internal engine/plugin
dependencies; those are not hidden in the CLI or indiscriminately overridden.

### Working against a local checkout

Point an app's `link:`, `file:` or `portal:` dependencies at a local checkout
of the framework to try unreleased changes. Prepare the checkout first —
`bun install` inside it, then the on-demand Turbo tasks for what the app
consumes: `turbo run build:go --filter=@octane-xplat/cli` produces the Go
executable that the checkout's `xplat` bin needs (`install-native.mjs`
reports a `build:go` instruction when it is absent), and `turbo run build`
or `turbo run typegen` with a `--filter` builds the dist output and generated
declarations of linked packages.

```sh
cd /path/to/octane-xplat
bun install
bun run turbo run build:go --filter=@octane-xplat/cli
bun run turbo run build --filter=@octane-xplat/ui   # only for linked packages
```

If a pnpm 11 install resolves the
link before its path exists, the `node_modules` entry appears without the
`.bin` shims (`xplat`/`xplat-lint` report `command not found`) — reinstall
once the path exists with the app's own package manager (`rm -rf node_modules
&& pnpm install`, or `bun install` in a Bun app) or wire the same reinstall
into the app's `postinstall`.

The checkout keeps its own
`node_modules`, so its packages can resolve a second physical copy of
`@nativescript/core` — same version or not — during typechecks. Two copies
give `View`, `Page` and `Color` two type identities, and a checker can reject
values passed between app code and linked framework source.

Generated native apps pin core to the app's own install in
`tsconfig.json` `compilerOptions.paths`, so every import in the program —
including files inside the linked checkout — resolves the same copy. Add the
pin to an existing app when it is missing:

```json
{
	"compilerOptions": {
		"paths": {
			"@nativescript/core": ["./node_modules/@nativescript/core"],
			"@nativescript/core/*": ["./node_modules/@nativescript/core/*"]
		}
	}
}
```

`xplat add` merges the pin when enabling iOS or Android without replacing
authored mappings. `doctor` counts only copies inside the app's install root
as duplicate runtimes — a checkout's private copies stay visible in the
report without failing the check — and warns when a linked native app lacks
the pin.

## Lint and format

Run from your app or library directory. Linting uses bundled Oxlint and Xplat
rules without extra setup; paths restrict both the regular-source and TSRX
passes. `--fix` applies safe Oxlint fixes to regular source and reports errors
that still need attention. Formatting is a separate step:

```sh
bun run xplat lint
bun run xplat lint src
bun run xplat lint --fix src
bun run xplat fmt
bun run xplat fmt --check
```

Lint exits `0` when no errors remain, `1` for lint errors, and `2` for command
or setup failures. Warnings are advisory. Both passes honor `.gitignore`
(including nested files), `.eslintignore`, and root config `ignorePatterns`,
skip build output, symlinks and nested repositories, and accept files or
directories. Shell-expanded file lists work too:

```sh
bun run xplat lint src/*.ts src/*.tsrx
```

TSRX runs the `xplat/*` rules through its own parser; Oxlint's built-in rules
and automatic fixes run on regular JS/TS/JSX/TSX source. A project-root
`.oxlintrc.json` replaces the bundled preset. See the
[lint package](https://octane-xplat.goddardai.org/package-lint#project-configuration) to retain the preset
and override individual rules. Existing `xplat-lint` scripts still work:

```sh
bun run xplat-lint --fix src
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

### Local documentation search

From the selected app's directory, prepare its versioned docs once, then ask
questions in ordinary language. Preparation downloads a pinned embedding model
from Hugging Face and writes a local cache. Document text and questions stay
on your machine; model inference runs on the CPU.

```sh
xplat docs index --json
xplat docs search "remember input when switching pages" --json
```

Search defaults to hybrid keyword/vector retrieval when embeddings are ready.
Otherwise `data.retrieval` reports `used: "lexical"` and `reason: "index-not-ready"`
or `"model-unavailable"`. Search never downloads a model or waits for indexing.
Repeat preparation after changing linked-checkout documentation or upgrading the
embedding backend. Cached release snapshots and the prepared model can serve
offline. The default cache lives at
`~/.cache/octane-xplat/mcp-docs`; `XPLAT_MCP_CACHE` overrides it.

```sh
xplat docs search "RouteOutlet" --mode lexical --json
xplat docs search "RouteOutlet" --mode exact --json
```

Guides are the default corpus, including package setup and usage. Choose
`readme` for the selected package's documentation links or `changelog` for
features, breaking changes, and fixes. A release hit's
`releaseVersion` and `releaseDate` describe the entry; its provenance describes
the snapshot containing it. Explicit comparison versions remain labeled outside
the installed binding. Open returned refs with `docs read` for the full page.

```sh
xplat docs search "route state" --corpus changelog --json
xplat docs search "documentation" --corpus readme --package @octane-xplat/ui --json
xplat docs index --package @octane-xplat/ui --version 0.19.0 --json
xplat docs search "navigation" --package @octane-xplat/ui --version 0.19.0 --json
```

### Select an app and operate it

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

The creator generates apps and libraries with local patch files for both
package managers. `xplat upgrade` aligns their catalogs and patches before
installing — for pnpm it writes the same local files unless the project already
declares `@octane-xplat/patches` in `configDependencies`.

The same canonical patch files work with **Bun 1.4.4 or later** and **pnpm**.
Run from your app directory. The CLI selects the workspace root and uses its
`packageManager` declaration first, then its lockfile. For a Bun project:

```sh
bun run xplat patches apply
bun install
bun run xplat patches check
```

Bun registers patches in the root `package.json` under `patchedDependencies`.
It reads default and named catalogs from that same manifest. For a pnpm project,
the command writes `pnpm-workspace.yaml`, creating it for a standalone app too:

```sh
pnpm run xplat patches apply
pnpm install
pnpm run xplat patches check
```

pnpm 11 ignores `package.json.pnpm.patchedDependencies`; rerun `apply` to move
framework registration into the YAML configuration. Existing pnpm projects can still
use the `@octane-xplat/patches` config dependency. If the package manager is not
yet declared, or both lockfiles remain during migration, select it explicitly:

```sh
xplat patches apply --package-manager bun
bun install
xplat patches check --package-manager bun
```

Patch files are copied into the workspace root's `patches/` directory. Existing
custom mappings and differing files are reported as conflicts; review them
before opting into replacement:

```sh
xplat patches apply --force
```

Bun inspection reads the text `bun.lock`, including transitive and URL-pinned
resolutions. Convert an older binary lockfile before checking patches:

```sh
bun install --save-text-lockfile --lockfile-only
xplat patches check
```

## Native Vite preset

Also exports the native vite preset — it absorbs the app-owned native config
(renderer rules, octane→universal alias, `.ios`/`.android` extension chain,
HMR watchdog, `px→dip` rewrite, `NS_VENDOR_EXCLUDE` entries for source-only
deps):

```ts
// vite.config.native.mts
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => native(mode))
```

The preset resolves the canonical renderer patch's MasonKit imports through
the app's declared layout engine, including the style subpath: Mason core on
iOS/Android, or full MasonKit in the repository's experimental Windows harness.
This also works with pnpm's isolated linker. Keep the canonical renderer patch;
no edited renderer copy is needed. Core and full MasonKit cannot share an app.
See [Windows support status](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md)
before choosing Windows; a downstream Windows setup is not documented yet.

```ts
// With the core dependency shown under Compatible versions:
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => native(mode))
```

## macOS AppKit preset

The experimental AppKit preset is exported separately from
`@octane-xplat/cli/macos/vite`:

```js
import { defineConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => macos(mode))
```

It resolves the app's `@octane-xplat/macos-appkit` package and installed
Octane compiler. See [AppKit renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit) for
application dependencies, root ownership, fonts, and development bundles.

```js
import { macos } from '@octane-xplat/cli/macos/vite'

export default await macos('production', { entry: 'src/main.mjs' })
```
