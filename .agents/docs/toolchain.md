# Builds, dependencies, patches, and lint

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Drive-by improvements to `packages/lint/` are allowed when they improve the
experience of agents writing Octane-xplat code effectively.

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
  both yaml blocks and the config package files from the manifest —
  `pnpm check:patches` fails on drift. Regenerate a patch via
  `pnpm patch`/`pnpm patch-commit` (writes to the configured path, i.e. the
  canonical dir), then sync + update the manifest entry. Each patch is pinned
  to an exact version; remove it when upstream ships its fix. esbuild is
  pinned to 0.27.7 — vite 8's peer range admits 0.28.x and the vendor bundler
  dies on the host/binary mismatch.
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
- lib builds: `dist/native` must never import bare `octane` (the DOM entry) —
  rollup `external` matches raw specifiers before `resolve.alias`, so the alias
  is dead code there; each package's `vite.config` rewrites it via
  `output.paths` at emit time and `scripts/check-native-dist.mjs` gates the
  build. Sources keep importing `'octane'` — the compiler retargets `.tsrx`
  hook imports to `@nativescript-community/octane` itself.
- Lint: `pnpm lint` = oxlint (JS plugin in `scripts/oxlint-plugin.mjs`) + a
  `@tsrx/core` companion pass for `.tsrx` (`scripts/lint-tsrx.mjs`) — oxlint
  can't load custom parsers. Rule checks live once in
  `scripts/xplat-rules.mjs` and run in both passes; severities/options come
  from `.oxlintrc.json`. The `xplat/*` set enforces the platform-suffix
  boundaries (DOM globals, web-only octane APIs, element vocabularies,
  `@nativescript` imports, NS-dead `style` props, signal naming/runtime) —
  the silent-failure half of the invariants. `check:no-dom` is the older
  standalone regex sweep; `xplat/no-dom-globals` covers it at lint time.
  tsrx suppressions: `xplat-disable[-line|-next-line]` comments.
