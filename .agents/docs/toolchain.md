# Builds, dependencies, patches, and lint

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Drive-by improvements to `packages/lint/` are allowed when they improve the
experience of agents writing Octane-xplat code effectively.

- **Task orchestration runs through Turborepo** (`turbo` 2.11.4 devDep,
  `turbo.json` at the root). `pnpm typegen`, `pnpm typecheck`, the
  `typecheck:{web,mobile,macos,linux,windows,docs}` filters,
  `pnpm build:packages`, `pnpm build:web`, `pnpm build:docs`, `pnpm check:pack`,
  `pnpm test:packed`, and the package-test half of `pnpm test`
  delegate to `turbo run`. Results cache locally under `.turbo/` (gitignored —
  shared across worktrees of this clone): unchanged tasks reuse cached results,
  and touching a leaf package invalidates its tasks and dependents.
  Common build, typecheck, and test tasks depend on `^typegen`, which both
  orders dependency declaration emit first and folds each dep's file hash into
  the dependent — the edge covers even script-less deps because turbo still
  hashes their files through the no-op task node. `apps/mobile` and
  `apps/windows` typecheck `../../packages/**/*` literally, so their
  `turbo.json` hashes all package sources directly (explicit input globs are
  filesystem walks, not git-aware — `node_modules` and `.turbo` logs are
  negated there). App packages order `@xplat/app#gen` (routes.gen +
  styled-system) ahead of `typecheck`/`build`/`test`. `test:packed`,
  `test:macos-runtime`, and `apps/linux`'s `build` are `cache: false` — their
  side effects land outside declared `outputs`. `lint` stays a single
  repo-wide pass; `turbo run lint` works via the `//#lint` root task but is
  uncached for the same reason. `pnpm typecheck` runs every declared workspace
  `typecheck`, including package-specific checks. `pnpm typecheck:apps` keeps
  the narrower harness-only scope; `pnpm typecheck:scripts` checks repository
  tooling separately. Use a touched-package/dependents filter for focused work.
- **Package typechecks use one `tsconfig.envs.json` per package** — never
  `tsconfig.<platform>.json`. The manifest declares the checked surface once
  (`environments.<env>.files|include|exclude`); `scripts/typecheck.ts`
  expands the declared environments into **one combined program** using the
  shared presets in `packages/cli/src/tsconfig-envs.ts` (lib / ambient /
  types merged; `jsxImportSource` defaults to `octane` with per-file pragmas
  on native/macOS leaves) and runs `tsrx-tsc --noEmit` on it under
  `node_modules/.cache/xplat-typecheck/`. Every program resolves under the
  fixed `moduleSuffixes` order `["" , ".web", ".ios", ".android", ".mobile",
".native", ".macos", ".linux", ".windows"]` — extensionless first — with no
  platform `customConditions` (package boundaries resolve the default export
  surface). Per-environment `compilerOptions` are rejected except `types`.
  Every platform is meant to expose the same API surface at the type level, so
  a `src/index.<platform>.ts` barrel that no declared environment checks fails
  the run. `xplat typecheck` applies the same expansion to app manifests and
  still honors a legacy `tsconfig.native.json` in older scaffolds. New app
  and library templates explicitly select `@octane-xplat/jsx` for shared
  native typing and `@octane-xplat/jsx/dom` in browser-file pragmas. Their
  combined programs have opaque native host handles; target conditions bind
  concrete hosts without changing intrinsic membership. See
  [the app JSX setup](../../docs/platform/module-resolution.md#typescript).
- NativeScript Vite 8.0.20's delegated checker narrows module suffixes to the
  phone target but filters only iOS/Android/visionOS file tags. The mobile
  harness deliberately includes desktop source too, so its iOS build can report
  unresolved `./focus-clock` in macOS keyboard files and `./bridge` in Linux
  platform files. The standalone combined package/harness typechecks pass;
  the iOS runtime suite also passes. This is a checker-context limitation,
  not runtime qualification for those desktop files. Keep the combined
  typecheck gate and assess actual mobile diagnostics separately. Source:
  [upstream checker at the 8.0.20 publish commit](https://github.com/NativeScript/NativeScript/blob/1fe745085ed609783355c51488ddc236aef0c0e1/packages/vite/helpers/typescript-check.ts).
  Recheck when upstream filters desktop roots or supports their resolver context.
- **pnpm, not npm** (user preference). `pnpm-workspace.yaml` carries
  `nodeLinker: isolated` — `@nativescript/vite`'s vendor-manifest code needs it.
  Consequence: every package must declare what it imports (no transitive-dep
  leakage). Apps declare the `@nativescript/*` plugins they import directly;
  plugins that a leaf package owns (e.g. `@octane-xplat/gif`'s
  `ui-image`) travel as that package's real `dependency` — `ns prepare` BFSes
  transitive deps, and a patched `/ns/m` routing serves them per-module in dev
  (decision #51).
  `minimumReleaseAgeExclude` covers the octane packages — they're newer than
  the supply-chain cutoff.
  Versions that must stay aligned across packages live once in the yaml's
  `catalog:` (runtime singletons: `octane`, `@nativescript-community/octane`,
  `@nativescript/core`/`types*`; toolchain: `typescript`, `vite`, `vitest`,
  `@octanejs/vite-plugin`, `@tsrx/typescript-plugin`) — dep fields read them
  via `"catalog:"`. `vitest` stays on 4 repo-wide: `platform` peers pin
  `vitest <5` for `@nativescript/unit-test-runner` and `visual`'s
  `@vitest/browser` family must match. Peers keep ranges since consumers
  supply the version. A second
  copy of the community renderer breaks type-level augmentations — e.g.
  `ui/type-support/svg-element.d.ts` only extends the `intrinsics` module it
  resolves.
- Keep the CLI's public Vite declarations independent of its PostCSS
  implementation. With TypeScript 5.9.3, CLI PostCSS 8.5.28 and Vite 8.3.0
  resolving PostCSS 8.5.31, re-exporting `xplatCss` from `css-platform.ts`
  causes TS2321/TS2322 while comparing recursive PostCSS types. This is
  consumer typecheck evidence, not evidence of a runtime API difference.
  `src/vite.d.ts` declares the public function and shares only `CssPlatform`
  with the implementation through `css-platform.types.ts`. Keep the small function
  declaration explicit rather than re-exporting the implementation. The focused
  [consumer regression](../../packages/cli/test/postcss-consumer.mjs) installs
  both patches, checks the real public declaration entry with
  `skipLibCheck: false`, and verifies that the implementation stays outside the program.
  Reassess the compiler limitation when upgrading TypeScript or PostCSS;
  the declaration boundary remains appropriate even if the comparison improves.

  ```sh
  pnpm exec turbo run test:postcss-consumer --filter=@octane-xplat/cli
  ```

- MCP's source shims import the CLI's `mcp/*` exports from `dist/`, so its
  typecheck depends on upstream builds as well as declaration generation.
  Keep the `^build` edge in `packages/mcp/turbo.json`: a combined test and
  typecheck run can otherwise check MCP while the CLI clears and replaces
  those exported files, producing transient TS2307 errors.

- Native dev CSS imports from linked checkouts need their workspace in Vite's
  `server.fs.allow`. `linkedDepFsRoots` inspects installed external source
  directories as well as explicit `link:`/`file:`/`portal:` specs: pnpm
  `readPackage` hooks can link a checkout while the app manifest keeps semver.
  Registry-store directories and undeclared links do not widen access. Without
  this discovery, the native CSS route fails with `ERR_DENIED_ID` for `?inline`
  (observed with Vite 8.3.0 and NativeScript Vite 8.0.17). The native HTTP regression
  in `packages/cli/test/vite-fs-allow.test.mjs` checks stylesheet registration and
  rejection of unrelated files. This fixes preset discovery, without disabling
  Vite's filesystem boundary.
  NativeScript Vite 8.0.20 now discovers installed source links for nested
  `/ns/m/node_modules/` requests and anchors transforms to the file found
  ([NativeScript#11559](https://github.com/NativeScript/NativeScript/pull/11559)).
  The local patch retains the separate app-local pnpm virtual-store fallback.
- NativeScript Vite 8.0.20 excludes source-only packages from its HMR vendor
  bundle regardless of dependency spec
  ([NativeScript#11560](https://github.com/NativeScript/NativeScript/pull/11560)).
  Xplat no longer duplicates that detection. Its `NS_VENDOR_EXCLUDE` merge
  retains only packages with subpath-only exports and no root entry: upstream
  can still vendor those, but the generated bare import has no root to load.
  Evidence: the published 8.0.20 collector and
  `packages/cli/test/vite-vendor-exclude.test.mjs`; this is host evidence,
  not device verification.

  ```json
  { "exports": { "./feature": "./dist/feature.js" } }
  ```
- **Mixed exports need the canonical collector patch on NativeScript Vite
  8.0.20 and 8.0.21.** Their source-only check flattens every export, so a compiled
  `./parity` subpath incorrectly makes a TypeScript root vendorable. In a
  linked consumer, Android's actual dev vendor build failed with 160 esbuild
  resolution errors for extensionless `.tsrx` and `.mobile.ts` leaves. This
  follows [NativeScript#11560](https://github.com/NativeScript/NativeScript/pull/11560);
  the consumer report is tracked by relay retryKey
  `upstream-xplat-linked-ios-vendor-tsrx-mixed-exports-android`.

  ```json
  { "exports": { ".": "./src/index.ts", "./parity": "./dist/parity/index.js" } }
  ```

  The canonical patch classifies the requested root/subpath under the native
  vendor build's `module`, `react-native`, `import`, `browser`, and `default`
  conditions in export-map order. Inactive conditions, sibling exports, and
  legacy entry fields cannot override the selected export. Platform plugin
  probing and rootless compiled subpaths remain supported; source peers are
  excluded too. Xplat retains only its rootless-package fallback. The repair
  leaves source in the framework's Vite transform pipeline and does not add
  esbuild loaders or another runtime realm.

  The [upstream source repair and tests](../patches/native-vendor-entry-source.patch)
  are retained locally against NativeScript Vite 8.0.20 and 8.0.21; no follow-up PR has
  been submitted from this task. The installed-patch regressions live in
  `packages/cli/test/vite-vendor-exclude.test.mjs`, including the Android dev
  vendor build hook. Remove this hunk when an adopted upstream release
  classifies the requested entry under the same conditions as its bundler.
  The patched Android dev vendor hook and first-boot deps bundle (188 modules)
  pass against the linked consumer; the unpatched vendor hook reproduces the
  160 errors. These host checks do not establish device startup.

  [Issue #51](https://github.com/octane-xplat/octane-xplat/issues/51) used
  8.0.21, whose separate patch initially omitted the collector repair from
  8.0.20. Both canonical patches now carry it. The maintained regression runs
  against both installed versions and builds Android's vendor payload with a
  semver dependency symlinked to an external checkout containing extensionless
  `.tsrx`/`.mobile.ts` imports, without `NS_VENDOR_EXCLUDE`. This repairs the
  vendor pass; it does not qualify HMR delivery or device startup on 8.0.21.

- NativeScript Vite 8.0.20's dev link check rejects valid named-to-default
  exports and can mistake comments or strings for exports
  ([NativeScript#11566](https://github.com/NativeScript/NativeScript/issues/11566)).
  The canonical Vite patch now uses its existing Babel parser to inspect
  default declarations and exported specifier names. It retains missing-default
  rejection and the existing CJS handling; it does not change app source or
  disable link checking. Remove this hunk when an adopted upstream release
  recognizes these exports. The real HTTP regression in
  `packages/cli/test/vite-default-export.test.mjs` compares the link check with
  Node's ESM namespace and exercises target edits, including loss of a default.
  HTTP checks alone do not qualify device startup or HMR.

  ```js
  const Screen = () => null
  export { Screen as default }
  ```
- **Hoisted workspaces need the canonical exports-reverse-map fix on
  NativeScript Vite 8.0.20.** Its runtime-plugin bare-specifier fold reads
  `projectRoot/node_modules/<pkg>/package.json` literally, so in a
  `nodeLinker: hoisted` workspace (the app's `node_modules` is empty and
  packages live at the workspace root) the exports reverse map comes out
  empty. A deep vendor specifier such as
  `@nativescript-community/octane/dist/index.js` then fails to fold back to
  the bare id, misses every `__nsVendorRegistry` key and alias, and device
  `require` resolves a module without the vendored exports — the app
  boot-crashes inside the first served UI module
  (`TypeError: __octaneUniversalPlan is not a function`). The canonical
  patch locates the package's `package.json` through Node's `node_modules`
  ancestor chain instead. The installed-patch regression lives in
  `packages/cli/test/vite-vendor-specifier-fold.test.mjs`; device evidence
  is the hoisted-workspace iOS boot. Remove this hunk when an adopted
  upstream release resolves installed package metadata through ancestor
  `node_modules`.
- **Vite aliases need the canonical esbuild replay on NativeScript Vite
  8.0.20.** Its deps and vendor esbuild passes ignore `resolve.alias`. The
  canonical patch replays aliases there for packages that are not installed
  for the importer. Packages found only in pnpm's hidden hoist
  (`node_modules/.pnpm/node_modules/`) do not count as installed. Without that
  exclusion, `apps/windows`' full MasonKit disabled the mobile
  MasonKit-to-core alias, and iOS dev boot threw
  `MasonListDelegate is not defined`. The regressions live in
  `packages/cli/test/vite-deps-alias.test.mjs`. Remove this hunk when upstream
  esbuild dev passes honor Vite aliases.
- **Two more pnpm-layout fixes live in the canonical 8.0.20 patch.**
  - **Bare imports from packages.** In upstream, `rewriteImports` sends a
    bare import found inside a package to `/ns/m/node_modules/<spec>`, which
    only resolves from the app root. Under pnpm's isolated layout, a
    dependency the app does not declare then returns 404. Example: storybook
    imports its sibling `@storybook/global`. The patch looks the package up
    from the importing file and serves it through `/ns/m/@fs/<package dir>`.
    Regression: `packages/cli/test/vite-rewrite-imports-fallback.test.mjs`.
  - **`stacktrace-js` force-include.** Upstream adds `stacktrace-js` to the
    vendor bundle when `require.resolve` can find it. That check honors
    `NODE_PATH`, and pnpm's bin shims add `node_modules/.pnpm/node_modules`
    to `NODE_PATH`. So a copy only another workspace package uses gets
    added, and esbuild then cannot resolve it. The patch checks the project's
    `node_modules` folders on disk instead and skips pnpm's hidden hoist.
    Regression: `packages/cli/test/vite-vendor-always-include.test.mjs`.

  Both are upstream bugs that have not been reported yet.

- NativeScript Vite 8.0.20 collapses unrelated paths containing `/src/` in
  its HMR graph ([NativeScript#11569](https://github.com/NativeScript/NativeScript/issues/11569)).
  Its extensionless workspace-module fetch also returns 404 although the same
  `.tsx` URL serves successfully
  ([NativeScript#11570](https://github.com/NativeScript/NativeScript/issues/11570)).
  The canonical patch aligns graph and hot-context IDs with existing static
  device URLs (app-relative, workspace-relative, or explicit `/@fs`), and
  probes filesystem-anchored extension/platform candidates for shared requests.
  The Octane strategy patch uses the source file for graph identity, a Vite
  filesystem URL to retransform external sources, and includes shared scripts
  in transaction ordering while excluding dependencies, tests and declarations.
  Remove these hunks when the adopted upstream releases preserve those IDs and
  serve shared hot reimports. The maintained real-HTTP/Octane-strategy regression
  is `packages/cli/test/vite-shared-hmr.test.mjs`; it covers native-host,
  workspace-shared and external-source edits. Host checks do not establish
  device HMR or qualify route creation/removal watching.

- **TSRX generic syntax limitation (observed with the installed, locally patched
  `@tsrx/typescript-plugin@0.4.11`).** The valid TSX generic arrow
  `const identity = <Value,>(value: Value): Value => value` fails `tsrx-tsc`
  in a `.tsrx` file with TS17008, while stock TypeScript accepts the equivalent
  `.tsx` probe. In the native authentication fixture, an optional generic method
  in an object type (`run?<Value>(value: Value): Value`) also failed the CLI lint
  parser with `Unexpected token`; this is a separate observed lint limitation,
  not an isolated checker diagnosis. Use a named generic function and a generic
  callable type alias for an optional field. The rewritten fixture passes the
  checker, lint, universal compilation and actual native hosts. This is a
  source-tooling workaround, not a routing API restriction or runtime feature.
  No upstream parser patch was added. Recheck both forms when upgrading TSRX.

  ```ts
  function identity<Value>(value: Value): Value { return value }
  type Operation = <Value>(value: Value) => Value
  type Options = { run?: Operation }
  ```

  Reproduction: `packages/ui/node_modules/.cache/native-auth-syntax/`;
  captured stock/checker output: `research/routing-cutover/native-auth-syntax-{tsx,tsrx}.log`.
  The maintained workaround is in `packages/ui/tests/authentication-native-example.tsrx`.
- App starters include runtime/build dependencies and testing for their selected
  platforms by default. Platform fragments own their test files, scripts, and
  managed development dependencies, including when a platform is added later.
  The web setup uses jsdom's own `localStorage` through the exposed `jsdom`
  instance: on Node 26, the host's `window.localStorage` alias returned
  `undefined` without `--localstorage-file`, breaking the starter's theme
  preference read. The generated component test passes with the explicit
  jsdom storage binding; this is host-test setup, not browser runtime evidence.
- `@octane-xplat/platform` uses `@nativescript/macos-node-api` only as a
  development dependency to generate/check the macOS SDK declarations. Its
  published platform sources do not import that package. Actual AppKit hosts
  own their SDK/runtime dependency; web/mobile consumers must not acquire it
  through the shared platform package. The platform packed-consumer check
  asserts that it is absent from the installed graph.
- Published app/library starters and `xplat doctor`/`upgrade` share
  `packages/create/compatibility.json`. Edit supported external pins there;
  `pnpm sync:compatibility` generates `catalog:xplat` starter references and
  exact pins, and `pnpm check:compatibility` rejects drift. Existing apps use
  `pnpm dlx @octane-xplat/cli@<release> upgrade` to adopt that release's pins
  and patch config package together. Library consumer peer ranges and local
  workspace/link/file dependencies stay under their owner's control. Windows
  preview specs use the manifest's Windows profile, never the mobile pins.
  Doctor inspects the app's reachable installed graph and reports duplicate
  singleton paths even when their versions agree; these are host checks,
  not device-runtime qualification.
- pnpm 11 resolves `link:` dep manifests before the app's `preinstall` hooks
  run: a spec pointing through a path created mid-install (e.g. a consumer's
  sibling-checkout symlink) yields the `node_modules` symlink but no
  `node_modules/.bin` shims — `xplat`/`xplat-lint` come back `command not
found` — and reinstalls stay "Already up to date" (GH#16). Heal by
  reinstalling once the path exists (`rm -rf node_modules && pnpm install`)
  or by running `node node_modules/@octane-xplat/cli/src/link-bins.ts` from
  the app root; wiring that into the consumer's `postinstall` covers fresh
  installs. pnpm 12 re-resolves and is unaffected. `xplat-lint` resolves
  its owned `oxlint` dependency, so invoking `bin/lint.mjs` with `node`
  directly no longer needs `.bin` on PATH.
- The framework patch set lives canonically in `packages/cli/patches/`
  (`manifest.json` carries specifier/scope/why/dropWhen per patch) and ships
  inside `@octane-xplat/cli`. Existing apps materialize it with
  `xplat patches apply` (copies files into `<app>/patches/` + merges the yaml
  block; `--force` takes the framework copy over a divergent one) and verify
  with `xplat patches check` / `xplat doctor`. Fresh create templates instead
  declare `@octane-xplat/patches` as a pnpm `configDependencies` package and
  point patched files into `node_modules/.pnpm-config/`, so the first install
  has the patches without template copies. The root `pnpm-workspace.yaml`
  references `packages/cli/patches/` directly. `pnpm sync:patches` regenerates
  root and both starter yaml blocks and the config package files from the manifest —
  `pnpm check:patches` fails on drift. Regenerate a patch via
  `pnpm patch`/`pnpm patch-commit` (writes to the configured path, i.e. the
  canonical dir), then sync + update the manifest entry. Each patch is pinned
  to an exact version; remove it when upstream ships its fix. esbuild is
  pinned to 0.27.7 — vite 8's peer range admits 0.28.x and the vendor bundler
  dies on the host/binary mismatch.
  The patch package's `prepack` uses `sync-patches.ts --package-only`: it
  refreshes only its own generated patch files. Root and starter YAML changes
  belong to the explicit `pnpm sync:patches` command.
- To develop against a local checkout of the `octane-xplat/nativescript-mason`
  fork, see [links/README.md](../../links/README.md) (`pnpm dev:masonkit`
  links the built dist package without touching the lockfile).
- `packages/*/src/vendor/*` dirs are **git submodules** of forks in the
  `octane-xplat` org, each pinned to a `xplat-vendored` branch
  (`octane-xplat/ui-lottie` = `xplat-fixes` + vendoring-compat markers;
  `octane-xplat/ui-svg` = the reduced SVGView-only subset). Fresh clones
  need `git submodule update --init` (CI checkouts carry
  `submodules: true`). Sync fork changes with
  `git submodule update --remote` then commit the gitlink bump.
  `platforms/` artifacts (Podfile, gradle, java) stay copies at the
  package root — `ns prepare` needs them there.
- Workspace deps use `"workspace:*"` (pnpm auto-install-peers fetches bare `*`
  from the registry → 404).
- `apps/mobile` needs `@valor/nativescript-websockets` — the on-device HMR
  transport that `virtual:entry-with-polyfills` imports in dev.
- iOS native build needs the `xcodeproj` Ruby gem visible to the `ruby` on PATH
  (`gem install --user-install xcodeproj`). `ns doctor` can report OK while the
  hook still fails — verify with `ruby -e 'require "xcodeproj"'`.
- Android harness builds use Temurin JDK 21, matching [NativeScript's macOS
  recommendation](https://docs.nativescript.org/setup/macos). Gradle 8.14.3
  supports JDKs through 24; Java 25 fails with
  `Unsupported class file major version 69`. Install with
  `brew install --cask temurin@21` and set `JAVA_HOME` per build; on macOS,
  resolve it with `/usr/libexec/java_home -v 21`. Android Studio's JBR is 25
  on this machine, so do not rely on its default.
- Keep checked-in Android AARs aligned with their Java sources. The audio
  prepack hook does not rebuild its AAR; an Android harness build regenerates
  it. A build-produced binary diff can therefore contain missing source fixes,
  not just timestamps. Its packed-consumer check verifies the compiled command
  validator and queue-handoff references without requiring an Android SDK.
- Verified: `vite build` + dev transform on web; `ns build ios` + app boots on
  iPhone 17 Pro sim (`running-active-Visible`, no JS errors); `ns run android`
  on physical device — HTTP-ESM boot, `.tsrx` edits apply in place via
  `/ns-hmr` ws, `.ts` entry edits trigger in-process full reload via
  `Application.resetRootView` (same pid).
- `ns run ios` re-boots the sim even when already booted and errors — the
  workaround is `xcrun simctl install/launch` against the existing `.app`.
- Physical-device HMR quirks: `ns run` sets `adb reverse tcp:<port>` itself,
  but the mapping dies if adbd restarts — re-run `adb reverse tcp:5173
tcp:5173`. Dev-session mode is activated only by `ns run`'s livesync launch;
  a manual `monkey`/`am start` boots the _inlined bundle_ (no HTTP, no ws,
  looks like a silent HMR failure but isn't). The `ns-hmr-client-watchdog`
  plugin in the native vite config warns when a session was fetched but no
  ws client attaches.
- Runtime packages publish authored source plus `.d.ts` entry points. App
  bundlers own platform resolution, renderer selection, and Octane runtime
  retargeting for installed packages. `prepack` prepares declarations;
  Node tooling and embedded browser documents retain asset builds. See the
  [publish model](notes/toolchain-notes.md#shared-packages-publish-model).
- Lint: `pnpm lint [paths...]` and `pnpm lint:fix [paths...]` use the same
  `@octane-xplat/lint` runner as consumer apps. Oxlint handles regular source;
  a `@tsrx/core` companion pass handles `.tsrx`. Rule checks live once in
  `packages/lint/src/xplat-rules.ts`; severities/options come from
  `.oxlintrc.json`. Paths constrain both passes; unknown flags fail before
  any fixes. The `xplat/*` set enforces the platform-suffix
  boundaries (DOM globals, web-only octane APIs, element vocabularies,
  `@nativescript` imports, NS-dead `style` props, signal naming/runtime) —
  the silent-failure half of the invariants. `xplat/no-dom-globals` enforces
  DOM boundaries; the older standalone regex sweep has been removed.
  tsrx suppressions: `xplat-disable[-line|-next-line]` comments.
  CI invokes `pnpm lint` so error-level code rules block releases while
  warning-level findings remain advisory. `pnpm check` composes lint with
  `check:css`, `check:recipes`, and repository integrity checks. CSS stays a
  separate blocking CI check; recipe structure runs in the PR hygiene job.
  Consumer apps and libraries use `xplat lint [paths...] [--fix]`; the CLI
  depends on `@octane-xplat/lint`, which owns Oxlint and the shared file
  selector for regular source and TSRX. `xplat-lint` is a compatible bin.
  Starters use the bundled preset without a config or separate lint deps;
  a root strict-JSON `.oxlintrc.json` replaces it, or extends the package's
  `config.json` to retain defaults. Both passes use root ignorePatterns,
  Git/eslint ignores, JSON extends, rule options and file overrides. Config
  selection is rooted at cwd; nested configs and JS/TS/JSONC configs are
  unsupported. TSRX checks only `xplat/*` and has no lint autofixes. See the
  [consumer contract](../../packages/lint/README.md).
- Format: `pnpm format` delegates to `xplat fmt`
  (`packages/cli/src/commands/fmt.ts`, engine `@octane-xplat/fmt` — in-process
  safe lint fixes → Oxfmt → statement spacing over the pinned tsrx-org/oxc
  Rust libraries; JS/TS/JSX/TSX and `.tsrx`). The formatter owns blank-line
  spacing, so `xplat/spacing` is no longer a lint rule — lint and fmt do not
  compete. `xplat fmt` writes atomically per file after the batch transforms;
  `--check` exits 1 without writes, `--stdin-filepath` pipes stdin to stdout.

```sh
pnpm lint packages/ui
pnpm lint:fix packages/lint/src
pnpm check:css
pnpm check:recipes
```

## Portable source configuration

`packages/ui/src/tsconfig.json` ships with raw source. Its transform options
must be self-contained; extending the repository's base config breaks installed
Vite consumers before routing code can execute. Preserve legacy decorator
emission for vendored native classes, JSX preservation and the ES2020 target.
The routing platform-contract fixture can build catalogs against an extracted
UI tarball; a workspace-only check cannot catch this missing-parent failure.

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"jsx": "preserve",
		"verbatimModuleSyntax": true,
		"experimentalDecorators": true,
		"emitDecoratorMetadata": true,
		"noEmitHelpers": true
	}
}
```

## Empty build target arguments (`@alloc/cmd-ts` 0.17.1)

The upstream tokenizer emits characters and argument dividers, so an empty
argv string has no value token. With a defaulted option, `--targets ''` was
therefore indistinguishable from omission at the build handler and selected
every target. This is verified by the real CLI subprocess regression and by
the [v0.17.1 tokenizer](https://github.com/alloc/cmd-ts/blob/v0.17.1/src/newparser/tokenizer.ts)
and [option parser](https://github.com/alloc/cmd-ts/blob/v0.17.1/src/option.ts).

The build command uses the documented `implicitValue: ''` option to preserve
explicit presence, then rejects the empty selection before side effects. The
workaround is limited to `build --targets`; it neither patches the dependency
nor changes other commands. Recheck it when cmd-ts retains empty argv values
or distinguishes an option without a value from an absent option.

```sh
pnpm xplat build --targets '' # exits with an unavailable/empty target error
```

## TSX dependency-scan warning

**Observed, unresolved.** The live routing-watch fixture uses Vite 8.3.0,
`@octanejs/vite-plugin` 0.1.61, patched Octane 0.11.0 and the workspace JSX facade.
During dependency scanning, Vite tried to resolve
`@octane-xplat/jsx/dom/jsx-dev-runtime` with runtime `web`/`import` conditions.
That facade intentionally exports types; it does not supply a second JSX runtime.
Vite printed a scan failure and skipped dependency pre-bundling. The ordinary
Octane transforms still rendered the app, and all seven route edit/add/rename/remove,
configured-context and manifest DOM assertions passed without browser errors.

```sh
pnpm --filter @xplat/web smoke:routing-watch
```

Evidence is the maintained temporary TSX fixture in
`apps/web/scripts/routing-watch.mjs`, its local run and the public JSX export map
in `packages/jsx/package.json`. This establishes the narrow warning; it does not
establish a general failure of web development or attribute a defect to a specific
upstream implementation. No dependency-discovery disabling, runtime facade shim
or upstream patch was added. A follow-up should qualify scanner configuration or
an upstream plugin correction while preserving the facade's type-only contract.
The routing check must not be described as warning-free until that is resolved.

## Dev `define` delivery is runtime plumbing, not substitution (`vite` 8.3.0, `@nativescript/vite` 8.0.20)

**Verified upstream behavior, not a defect.** In unbundled dev (the default;
`experimental.bundledDev` opts into the bundled pipeline) Vite's `vite:define`
transform returns early for `consumer: 'client'`, so served module source
keeps every `define` key verbatim — inspecting transformed output suggests
`define` "doesn't reach the dev client". The values still arrive: `@vite/env`
(imported first by `@vite/client`, which the dev HTML transform injects ahead
of the app entry, and injected into module workers) evaluates a serialized
`define` map once and assigns each key on `globalThis`, splitting dotted keys
into nested objects. A bare `__FOO__` read resolves through the global scope
chain; `process.env.X` reads resolve through the created
`globalThis.process.env`. `process.env.NODE_ENV` is additionally substituted
statically per-module by `vite:client-inject`, and `import.meta.env.X` by
`vite:import-analysis`. Runtime-verified on vite 8.3.0 + Chromium: bare
`__FOO__` reads, plugin `config`-hook defines, and modules outside the Vite
root all resolve. Builds and bundled dev substitute statically through the
bundler `transform.define` option, so production output is unaffected.

On NativeScript dev targets the same coverage comes from upstream
`@nativescript/vite` (≥8.0.17): `setUserDefineEntries` captures `config.define`
in `configResolved`, and `process-code-for-device` prepends per-module
`const __FOO__ = globalThis.__FOO__ !== undefined ? globalThis.__FOO__ : (expr)`
shims to every device-served module, with esbuild `define` covering the deps
bundle. Runtime-verified transitively: `__XPLAT_DEV_BRIDGE__` arrived on
Android as a module-scope const (dd5c2c779's fix was the const-vs-global read,
not delivery).

Constraints this creates:

- Marker-style defines stay verbatim in dev-served source. A plugin that
  needs a literal in the emitted module (as `@octane-xplat/tweaks` does for
  its connection marker) must substitute in `transform`; `config.define`
  alone only plants the global. Define values are also evaluated once inside
  `env.mjs` — an expression referencing module-local bindings throws for the
  whole client at boot.
- The NativeScript capture only admits `__FOO__`-pattern keys and
  `process.env.*` (`USER_DEFINE_IDENTIFIER_RE`/`USER_PROCESS_ENV_DEFINE_RE`).
  A define like `API_URL` receives no device shim: the production bundle
  substitutes it statically while the dev-served module leaves a free
  identifier that throws at eval. Keep app-facing dev defines to the
  `__FOO__` form or record a need to widen the upstream capture.
- Read dev defines portably — bare identifier first, `globalThis` fallback —
  the shape `packages/platform/src/dev-bridge.ts` adopted after a
  `globalThis`-only read stayed undefined on NativeScript (device shims are
  module-scope consts, not globals).

## TSRX fragment initializers in the formatter

`@octane-xplat/fmt` 0.1.1 fixes ambient declaration parsing (`.d.ts`, `.d.mts`,
`.d.cts`), but rejects an unparenthesized multiline fragment initializer inside
an `@{}` function followed by `@if`, reporting `TSRX_LIFT: formatted TSRX
structure differs from the input`. Parenthesizing the initializer lets the same
source format successfully. `packages/ui/src/modal-focus.web.test.tsrx` uses
this workaround; keep it until the formatter accepts the unparenthesized form.
This was verified through the formatter's Node API and `pnpm format`, not a
renderer runtime test.

```tsrx
function Example(props: { visible: boolean }) @{
	const content = (
		<>
			<button>Choose</button>
		</>
	)

	@if (props.visible) {
		<div>{content}</div>
	} @else {
		<p>Hidden</p>
	}
}
```

## Formatting can expose synthetic TSRX key diagnostics

With `@tsrx/typescript-plugin` 0.4.11, formatting the native `Tabs.tsrx` return
block makes UI declaration generation report TS2322 for synthetic `key` props
on `Tab` and `RoutePane`. The authored source only supplies `@for` keys, not
component `key` props. Restoring the original return layout passes
`turbo run typegen --filter=@octane-xplat/ui` with the rest of the repository
still formatted. This is compiler evidence, not a renderer behavior change.

`packages/ui/src/Tabs.tsrx` retains that return layout with `prettier-ignore`.
The formatter still handles the rest of the file. Remove the directive when
the compiler accepts the formatted keyed loops; do not remove the loop keys
or widen component props to hide the generated diagnostic.
