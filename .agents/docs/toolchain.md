# Builds, dependencies, patches, and lint

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

## CLI runtime and executable packaging

The [Go implementation](../../packages/cli/go/README.md) is the sole CLI.
[Build tooling](../../tools/cli-go/README.md) owns pinned builds, runtime
snapshots, correctness checks and size/startup measurements; the package `bin`
dispatches to the platform binary. Node is an installed prerequisite for
explicit JavaScript workers; the executable does not bundle a JS runtime or
call a JavaScript CLI. Workspace matching supports literal paths, `*` within a path segment and
exclusions; advanced glob grammar is deliberately unsupported. Discovery and
package reads stay native.

The Go migration uses explicitly started foreground `dev` ownership. Humans or
instructed agents may start it; app-control clients normally attach to an existing
server and never implicitly launch a server/app/browser. Private discovery is
keyed by canonical app directory, outside tracked project files, with per-start
instance credentials and authenticated loopback requests. Client disconnect does
not stop apps. Target-scoped app WebSockets register actual action metadata;
observation and action listing are native. App proof is distinct from private CLI
RPC authorization. The maintained macOS gates exercise actual Chromium actions,
named-DOM inspection and programmatic handler dispatch, and actual AppKit action
registration/invocation through the host's Foundation WebSocket shim. These are
separate from OS-input or device qualification. The NativeScript preset now
supplies an experimental project-Vite WebSocket relay. Actual registration,
read-only action invocation/status and short-client lifetime pass on an API 35
ARM64 Android emulator and an iOS 27 arm64 simulator (`test:go-dev-ios-real`);
reconnect/HMR, physical devices and other runtimes remain pending. Direct loopback sockets require
same-host reachability and a runtime WebSocket implementation. Action invocation/status delegate JS field/default/RegExp and execution-policy
validation to the selected project worker, while foreground Go owns request
identity, deadlines, dedupe, outcomes and cleanup. Invocation never creates a
missing dev server. Retained engine logs, browser warnings/errors, scoped Apple
crash reports and text evidence have maintained gates; image capture and native
UI-inspection adapters remain pending. See the Go README for each provider's
scope and actual-target limits. Detached-owner
and browser-lifecycle experiments are preserved in checkpoint `14a7117c` and local
reports; they are superseded qualification scope, not active Go release gates.

The Go implementation in [packages/cli/go](../../packages/cli/go/README.md) is
the sole CLI; the TypeScript and Nim implementations were removed. Native
commands never execute a JavaScript CLI fallback; the package `bin` dispatches
to the platform binary built by [tools/cli-go](../../tools/cli-go/README.md).
See [CLI agent guidance](../../packages/cli/AGENTS.md) for ownership and
boundary rules.

Project-installed Vite presets are separately packaged as
[`@octane-xplat/build`](../../packages/build/README.md). Its build compiles the
plugin closure from the CLI package's TypeScript sources; it has no published
CLI runtime dependency. Keep JS compilation and development middleware in the
app's toolchain, and command/process/session orchestration in the native
executable. macOS packaging uses the separate
[`@octane-xplat/macos-build`](../../packages/macos-build/README.md) worker and
host assets in the selected project. Keep that platform cost out of the CLI
tarball and web-only build installations. Go owns staging and final
publication after the worker finishes.

The published tarball preserves the Vite exports and the bounded `./worker`
operation through the curated plugin closure; heavy engines are optional peers.
Native-only installs fetch none of those peers. Native worker/declaration lookup uses the selected project's compatible
`@octane-xplat/cli` installation. The separate build package is no longer a
native workflow prerequisite.
See the [build-plugin guide](../../docs/packages/package-build.md) for engine setup.

Repository installs and script dispatch use Bun 1.4.4; Node remains required
by app and repository tooling and by the CLI's explicit JavaScript workers.
Vite/MCP subpath exports retain per-module ESM for Node consumers.

In-repo `xplat` dispatches to the host's Go build at
`research/go-cli/xplat-go-<platform>-<arch>-cli`; build it with
`turbo run build:go --filter=@octane-xplat/cli` (Go 1.27.3,
`GOTOOLCHAIN=local`; artifacts stay in the ignored `research/go-cli`).
Only `xplat` invocations (dev, `routes:watch`) need that binary — install and
codegen do not: `@xplat/app#gen` runs `planRoutes` off the CLI sources via
`scripts/gen-routes.ts`, so `bun install` stays Node + Bun only. CI
provisions Go solely in the lanes that build or contract-check the native
executable (`ci.yml` `test:go-cli`, `cli-executables.yml`).

`test:go-cli` is the contract gate for the built executable and the primitive
probe. `cli-executables.yml` builds and checks on each destination host —
macOS and Linux arm64/x64 and Windows x64 — then attaches
`xplat-<platform>-<arch>` executables and SHA-256 checksums to published
releases. Published `@octane-xplat/cli` resolves the matching platform
binary; Vite and MCP exports remain per-module ESM.

### Go Windows junction identity

Go 1.27.3 follows the [Go 1.23 Windows symlink behavior](https://go.dev/doc/godebug#go-123):
`filepath.EvalSymlinks` does not resolve mount-point reparse points, including
directory junctions. Workspace package links use these on Windows. Treating the
lexical link as a physical package root makes checkout docs discovery walk the
consumer's `node_modules` instead of the framework repository. The
[Windows canonical-path adapter](../../packages/cli/go/canonical_windows.go)
opens the target and uses `GetFinalPathNameByHandle`, handling extended DOS and
UNC names. Keep this local to physical identity instead of changing the process's
global `GODEBUG` behavior. The [native index gate](../../tools/cli-go/docs-index.test.mjs)
checks linked checkout discovery and rejects an external docs junction; build
success alone does not establish either runtime property.

Windows Git object paths can exceed `MAX_PATH` even when the owned staging
directory fits. An actual bare fetch at a 216-character staging path failed with
`Filename too long`; process-local `-c core.longpaths=true` succeeded. The native
snapshot service passes that flag on Windows and qualifies a long-cache-path
fixture. Do not shorten a failing fixture or change the user's global Git config
to hide this boundary.

## Runtime dependency compatibility

The content-mapper protocol is file-keyed, not specifier-keyed
(typescript 7.1.0-beta, verified by probe for octane-xplat#93):
`transform` receives `fileName` and on-disk `content`, and the RPC surface
(initialize/openProject/closeProject/transform) has no module-resolution or
virtual-file hook — upstream states the mapper plays no part in resolution
([microsoft/TypeScript#64549](https://github.com/microsoft/TypeScript/issues/64549)).
A specifier like `icons:heroicons/x-mark` must therefore resolve to a real
file with a registered extension before the mapper runs: `paths` wildcards
do reach mapped extensions, but a missing target file is TS2307.
`@octane-xplat/icons` ships the `.icon` mapper (its own
`typescript.contentMapper` manifest, `dist/mapper/server.js`) plus
`syncIconStubs`, which writes one stub per collection icon under `.icons/`;
`xplatIcons` syncs at `configResolved` unless `stubs: false`. Consumers wire
`"paths": { "icons:*": ["./.icons/*.icon"] }` and register `.icon` in
`contentMappers`; each stub's transform emits the icon's `IconifyIcon`
literal, so names compile-check per specifier. The ambient `icons.d.ts`
`declare module 'icons:*'` wildcard remains in the package as an opt-in
fallback for classic TypeScript, but must not be included alongside the
mapper setup — it matches specifiers the stub tree would have rejected.


The workspace uses Octane 0.16.3 with `@tsrx/oxc` 0.20.0 and
`@octanejs/vite-plugin` 0.5.0. The parser pin is explicit at the root so a
hoisted installation cannot select the older optional peer from another
Octane context. These compiler dependencies must move together. Octane now
requires Node 22.22.2 or newer; starters and doctor share that minimum in
`packages/create/compatibility.json`.

The Octane 0.16.3 patch preserves upstream universal `Children`,
`descriptorChildren`, compiler allowlist entries, and compiler-owned binding
bags. It retains the local signal ownership, imperative-ref, event-error,
descriptor-reader, and transparent keyed-root fixes described in the patch
manifest. Patch applicability and host tests do not establish device behavior.

`@octanejs/tiptap` 0.0.62 peers Tiptap `^3.28.0` and
`@octanejs/lexical` 0.2.12 still pins Lexical 0.51.0. Overrides align their
complete engine families with our direct imports at 3.32.2 and 0.53.0,
respectively — including the tiptap adapter's optional bubble/floating-menu
extensions so a floating `^3.28.0` range cannot pull a newer minor than the
managed family. Keep each family aligned to avoid missing core symbols or
separate editor registries. Reassess these overrides when the adapters adopt
the corresponding engines. The compatibility manifest supplies these overrides
to starters and `xplat upgrade`, so consumer installs share the same alignment.

Bamboo's runtime preset/types and `@bamboocss/dev` must also stay aligned at
1.60.1: mixing the older dev package with the new preset makes mobile and
Windows configuration typechecks fail on the added `Mask` utility group.

`oxlint-tsgolint` must stay compatible with the Oxlint version
`@octane-xplat/lint` installs: 1.90.0's optional checker peer wants >=7.0.2005
while unmodified registry resolution picked 7.0.2002, failing `pnpm peers check`
in an isolated consumer ([#76](https://github.com/octane-xplat/octane-xplat/issues/76)).
The compatibility manifest ships the `7.0.2005` override to starters and
`xplat upgrade`; reassess the pin when the lint package's Oxlint moves. Ordinary
lint passed at 7.0.2002 — do not infer a type-aware lint crash or UI runtime
defect from that dependency finding.

Keep `regenerate` at one version across `regexpu-core` and
`regenerate-unicode-properties`. Babel 8 resolved 1.5.0 for the former and
1.4.2 for the latter; their `instanceof` checks then rejected each other's
sets with `symbol.charCodeAt is not a function`. The 1.5.0 override satisfies
both dependency ranges and also ships through the compatibility manifest.
The CLI's real Unicode-property and `v`-mode regex
transform tests pass with it. Reassess the override when upstream accepts
sets across constructor copies or guarantees one copy itself.

The Windows preview retains its commit-pinned NativeScript core and
FontManager 1.0.18. macOS keeps its newer `next` runtime rather than
downgrading to the registry's older `latest` tag.

The Windows CLI preview `nativescript@9.1.2-dev.2026-09-24-36031892256`
imports `fast-glob` from `lib/services/ios-project-service.js` and `glob` from
`lib/controllers/migrate-controller.js` during startup, but omits both from
its published dependencies. With the isolated linker, the Windows build exits
with `Cannot find module 'fast-glob'` or `'glob'` before
compilation.
The exact-version `packageExtensions` entry in `package.json` supplies
`fast-glob@3.3.3` and `glob@10.5.0`; it does not change other NativeScript
versions. The package import audit found these two omissions; `ns --version`
then passed on windy. This establishes CLI startup, not app runtime behavior.
Remove the extension when a replacement CLI declares the import itself.

```json
{
  "packageExtensions": {
    "nativescript@9.1.2-dev.2026-09-24-36031892256": {
      "dependencies": { "fast-glob": "3.3.3", "glob": "10.5.0" }
    }
  }
}
```

`@nativescript/firebase-analytics@5.0.2` requires `@nativescript/hook` in
its postinstall but omits the dependency. A fresh Bun 1.4.4 isolated install
failed with `Cannot find module '@nativescript/hook'` from that hook. Root
`packageExtensions` adds `@nativescript/hook@3.0.5` for this exact plugin
version. The subsequent install completed its allowed hooks and generated the
workspace declarations/app files. Remove the extension when the plugin declares
its hook dependency. This establishes host installation only.

Sentry CLI 3.8.2 resolves its binary from the matching optional platform package
at runtime. Its [install script](https://github.com/getsentry/sentry-cli/blob/3.8.2/scripts/install.js)
exits when that package is present and otherwise downloads a fallback from its
CDN. The repository omits `@sentry/cli` from Bun's explicit `trustedDependencies`
to skip that fallback. Keep optional dependencies enabled. Recheck the policy when updating
Sentry's binary-distribution mechanism. The installed macOS platform binary
reports `sentry-cli 3.8.2` without running the install script.

The root manifest owns the allowlist; do not trust this install script merely
to silence a blocked-script notice.

Drive-by improvements to `packages/lint/` are allowed when they improve the
experience of agents writing Octane-xplat code effectively.

- **Typegen emits declarations per file and does not type-check.** `tsrx-typegen` transpiles each source's declarations with `isolatedDeclarations` and no TypeScript program, so every exported function, method and variable needs an explicit type. In this repository, native tsrx components use `): unknown @{` and DOM components use `): JSX.Element @{` with `import type { JSX } from 'octane/jsx-runtime'`. Type errors surface only in `typecheck` tasks. `ui` and `lottie` keep `isolatedDeclarations` off their tsconfigs because their vendored submodule sources cannot carry annotations. Those files' declarations come from `types/overrides/` through `tsrx-typegen.json` overrides; update them by hand when the vendored submodule changes. Leaf packages generate their declarations with `tsrx-typegen` into `types/generated/` and must not commit hand-written declaration facades under `types/`; signatures the emitter cannot express go in `types/overrides/`.
- **Task orchestration runs through Turborepo** (`turbo` 2.11.4 devDep,
  `turbo.json` at the root). `bun run typegen`, `bun run typecheck`, the
  filtered workspace builds and typechecks, `bun run build:packages`,
  `bun run check:pack`, `bun run test:packed`, and the package-test half of `bun run test`
  delegate to `turbo run`. Results cache locally under `.turbo/` (gitignored —
  shared across worktrees of this clone): unchanged tasks reuse cached results,
  and touching a leaf package invalidates its tasks and dependents.
  Common build, typecheck, and test tasks depend on `^typegen`, which both
  orders dependency declaration emit first and folds each dep's file hash into
  the dependent — the edge covers even script-less deps because turbo still
  hashes their files through the no-op task node. `apps/mobile` includes
  `../../packages/**/*` as roots; `apps/windows` checks app roots and their
  imported Windows/native package graph. Both apps' `turbo.json` files hash
  all package sources directly so path-mapped imports outside the workspace
  dependency edges still invalidate the check (explicit input globs are
  filesystem walks, not git-aware — `node_modules` and `.turbo` logs are
  negated there). App packages order `@xplat/app#gen` (routes.gen +
  styled-system) ahead of `typecheck`/`build`/`test`. `test:packed`,
  `test:macos-runtime`, and `apps/linux`'s `build` are `cache: false` — their
  side effects land outside declared `outputs`. `lint` stays a single
  repo-wide pass; `turbo run lint` works via the `//#lint` root task but is
  uncached for the same reason. `bun run typecheck` runs every declared workspace
  `typecheck`, including package-specific checks. `bun run typecheck:apps` keeps
  the narrower harness-only scope; `bun run typecheck:scripts` checks repository
  tooling separately. Use a touched-package/dependents filter for focused work.
- **Package typechecks use one `tsconfig.envs.json` per package** — never
  `tsconfig.<platform>.json`. The manifest declares the checked surface once
  (`environments.<env>.files|include|exclude`); `scripts/typecheck.ts`
  expands the declared environments into **one combined program** using the
  shared presets in `packages/cli/src/tsconfig-envs.ts` (lib / ambient /
  types merged; `jsxImportSource` defaults to `@octane-xplat/jsx` (`/dom` for browser) with per-file pragmas
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
- **Bun owns repository installation.** `package.json.workspaces` owns the
  workspace list and catalogs; `bun.lock` owns resolved versions. Keep
  `catalog:` references in member manifests. `bunfig.toml` selects the
  isolated linker, and root `trustedDependencies` permits only the intended
  install hooks. Explicit root `tslib` replaces the former public hoist.
  Every workspace must still declare what it imports. Bun packs publishable
  packages; npm uploads the tarballs with trusted publishing and provenance.
  pnpm is optional for `test:patches-pnpm`, a manual compatibility check.
- **Starters are package-manager selectable.** `bun create` produces a Bun
  project; `pnpm create` produces a pnpm project; other launchers probe
  installed managers and `--package-manager` overrides. Bun config lives in
  `package.json` (`workspaces.catalogs`, `overrides`, `patchedDependencies`,
  `trustedDependencies`); the pnpm variant moves the same fields to
  `pnpm-workspace.yaml` (`catalogs`, `overrides`, `patchedDependencies`,
  `allowUnusedPatches`, `allowBuilds`, `nodeLinker: hoisted`, `saveExact`)
  plus `packageManager: pnpm@<pin>`. That YAML shape is what `xplat upgrade`
  and `xplat patches apply` also write. `allowBuilds` membership comes from
  real pnpm install reports per target set — Bun `trustedDependencies` is not
  evidence of the full list (pnpm additionally reported `@nativescript/core`
  and `protobufjs`, denied `false`). `bun pm pack` drops `bunfig.toml`
  (packaging ignore rules), so templates carry it renamed to `bunfig` and the
  creator restores the name on copy.
- **Keep patch source identities exact.** Bun keys tarball patches by URL,
  while pnpm keys the Windows previews by the package version. The canonical
  manifest's `bunSpecifiers` records the verified URL identities; it does not
  change patch bytes. `bun run sync:patches` updates root Bun registrations,
  the patch package, and starter-local patch files and Bun registrations. `xplat patches`
  accepts either manager and checks its own selected lockfile/configuration.
  pnpm 11 ignores `package.json.pnpm`, so standalone applications also need
  a `pnpm-workspace.yaml`; do not restore the old JSON fallback.
- **Bun 1.4.4 is the install minimum.** On macOS arm64, 1.4.3 failed the
  canonical `@nativescript/vite@8.0.21` patch with `EINVAL (fstatat)` in both
  an isolated dependency and the full workspace. The identical patch applied
  with 1.4.4. Retain the patch; retest before lowering this requirement.
  This is host installation evidence, not native/device qualification. Failed 1.4.3 attempts left a
  cached patched Vite 8.0.20 artifact that Node rejected with `Illegal return
  statement`; the same patch installed with 1.4.4 and a separate cold cache
  parsed correctly and passed the native-Vite regressions. If an earlier
  attempt left corrupt cached output, reinstall with `bun install --force
  --cache-dir <temporary-cache>` rather than changing the canonical patch.

- **Mobile and Windows Vite patches have separate qualification contexts.**
  Registry Vite 8.0.21 includes the aliased-default-export link check and
  package-import vendor fixes, but does not include the full mobile 8.0.20
  patch. Rebase all mobile hunks against its official tarball; keep the
  upstream `hasEsmDefaultExport` implementation, rebase the re-export collector
  around that new helper, and account for the source-map trailer newline.
  The smaller Windows 8.0.21 patch cannot replace the mobile patch. Before
  accepting a mobile version change, compare patch-touched installed files
  against the expected tarball plus patch using a cold Bun cache, then qualify
  startup, HMR, production builds and on-device tests on both mobile targets.
  CLI 9.1.2 still depends on doctor 2.0.18, whose catalog runtime resolution
  needs our patch. Its Xcode 27 launcher update alone does not qualify removal
  of the simulator pre-boot workaround.

- **Publishing uses Bun tarballs and npm trusted publishing.** Creator exports
  point explicitly at built JavaScript in `package.json`; do not reintroduce
  `publishConfig.exports`, which Bun 1.4.4 does not remap. Bun resolves
  workspace/catalog references during packing. `scripts/publish-release.ts`
  packs all pending packages before uploading any, fails registry lookups other
  than E404, and skips exact versions already published when retrying. npm
  generates provenance; Bun does not support it yet. Never use `bun publish`
  for this release contract. See [Bun publishing](https://bun.com/docs/pm/cli/publish).
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
  bun run turbo run test:postcss-consumer --filter=@octane-xplat/cli
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

  The [upstream source repair and tests](../../tools/platform-qualification/patches/native-vendor-entry-source.patch)
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
- **NativeScript Vite 8.0.20 can miss core's `source-map-js` under Bun's
  isolated layout.** The device loader requests
  `/ns/m/node_modules/source-map-js/lib/source-map-generator.js`, whose URL
  has lost the importing core package's location. The HTTP route returns
  404 in both `apps/mobile` and a small linked fixture, and an actual Android
  app fails before its entry runs. The file exists and resolves from core's
  canonical package path. `xplatNative` narrowly aliases this SDK-emitted
  HTTP prefix to core's installed dependency; ordinary bare app imports are
  unchanged. The host regression is `test:go-dev-android-http`, with the
  selected project in `XPLAT_GO_ANDROID_HTTP_APP`; device qualification is a
  separate `test:go-dev-android-real` gate. Revisit this alias when an adopted
  upstream release resolves HTTP module paths through the importing SDK's
  transitive dependency context. Do not hoist or add undeclared app dependencies
  merely to make this route pass.
- **NativeScript iOS cannot build an app whose directory is named `app`.**
  NativeScript 9.1 names the generated Xcode project and executable after the
  app directory, and its JS bundle folder is always `app`. Xcode then fails with
  `Multiple commands produce '…/app.app/app'`; pinning simulator architectures
  does not help. Name disposable fixture directories something else (the iOS
  relay gate uses `relay-fixture`).
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

- **TSRX computed-tag parser limitation (2026-10-28).** With the installed
  `octane@0.14.0` compiler and `@tsrx/oxc@0.16.0`, compiling Heading's
  `<{tag}>…</{tag}>` fails with `unsupported TSRX parser shape: reachable
  synthetic ESTree span`. A compiler-only reduction retained the failure after
  removing the style spread or ref, and passed after replacing the computed tag.
  Heading uses a capitalized `Tag` variable and `<Tag>…</Tag>` instead;
  this keeps the selected HTML heading level. The maintained DOM regression is
  `packages/ui/src/components/forms/text-scale.web.test.tsrx`; table and motion tests also compile
  Heading through the UI barrel. This is source/compiler evidence, not native
  device evidence. No dependency or parser patch was added. Recheck computed
  tags when upgrading the [Octane compiler](https://github.com/octanejs/octane/tree/octane%400.14.0/packages/octane/src/compiler)
  or its TSRX parser, and remove the workaround once that form compiles.

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
- **TSRX `const` type-parameter limitation in type-literal signatures
  (observed 2026-10-30, `@sveltejs/acorn-typescript@1.0.13` via `@tsrx/core`
  0.5.5).** Function declarations accept `<const T>` — acorn-typescript wires
  `tsParseConstModifier` for them — but `tsFillSignature` calls
  `tsTryParseTypeParameters()` without it, so `const` type parameters fail
  with `Unexpected keyword 'const'` inside call signatures
  (`{ <const T>(x): R }`), method signatures, and function-type expressions
  (`type F = <const T>(x) => y`). Every type-literal generic form routes
  through `tsFillSignature`, so no equivalent spelling keeps the modifier;
  dropping it loses literal inference the typed-router contract relies on.
  Trigger: the explicit-types refactor moved group definer generics into the
  `RouteGroupDefiner` call signature in `packages/ui/src/routing/define-route.ts`;
  `ui:test:native` (`vitest.native.config.mts`, nativescript renderer parses all
  `.ts/.tsrx`) then fails transform in 10 mobile test files, including three
  `.mobile.test.tsrx` whose own code uses `<const`. Web lane unaffected —
  it doesn't route `.ts` through TSRXParser. **Patched locally (2026-10-31):**
  `packages/cli/patches/@sveltejs__acorn-typescript@1.0.13.patch` passes
  `tsParseConstModifier` through `tsFillSignature`, matching function-declaration
  handling — the upstream gap remains; the patch only repairs it locally.
  Drop the patch when upstream wires `const` modifiers in type-literal
  signatures; recheck when upgrading `@sveltejs/acorn-typescript` or
  `@tsrx/core`.
- **TSRX `@{` inline function-expression limitation (observed 2026-11-06,
  octane 0.16.3 nativescript renderer).** A named function expression with an
  `@{` template body in argument position — `root.render(function Bare() @{
  return <x/> })` — miscompiles: the emitter drops the braces, producing
  `function Bare() __octaneUniversalValue(...)`, which the bundler rejects as
  a parse error. Top-level `@{` function declarations and arrow-function
  arguments compile correctly; hoist the component instead of inlining it.
  The maintained workaround is `packages/ui/src/components/layout/pinch.mobile.test.tsrx`.
  Source/compiler evidence only — recheck the inline form when upgrading the
  octane compiler.
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
  `bun run sync:compatibility` generates `catalog:xplat` starter references and
  exact pins, and `bun run check:compatibility` rejects drift. Existing apps use
  `bunx @octane-xplat/cli@<release> upgrade` to adopt that release's pins
  and patch config package together. Library consumer peer ranges and local
  workspace/link/file dependencies stay under their owner's control. Windows
  preview specs use the manifest's Windows profile, never the mobile pins.
  Doctor inspects the app's reachable installed graph and reports duplicate
  singleton paths even when their versions agree; these are host checks,
  not device-runtime qualification. Managed-singleton copies under a linked
  (`link:`/`file:`/`portal:`) checkout's own node_modules are that checkout's
  private install — the preset dedups singletons to the app copy — so the
  `compatibility singleton` row counts only copies inside the workspace root
  and lists external ones without failing ([#66](https://github.com/octane-xplat/octane-xplat/issues/66)).
  The dual type identity behind that report: TypeScript unifies same-packageId
  (name+version+file) declaration copies, so two physical core copies conflict
  only when versions/identity differ (e.g. a checkout store's canary build);
  the fix pins `@nativescript/core` in the app's tsconfig `paths`, which
  forces every import in the program — including files inside linked
  checkouts — onto the app copy. Generated native apps carry the pin
  (`nativeCorePaths` in `packages/create/scaffold.ts`, template tsconfig is
  the source of truth); doctor warns when a linked native app lacks it.
  Verified host-level with classic tsc 5.9.3 (dual `View`/`Page` identity
  errors reproduce when the linked copy's packageId differs; paths removes
  all of them) and reporter-verified on the consumer build in the issue.
- pnpm 11 resolves `link:` dep manifests before the app's `preinstall` hooks
  run: a spec pointing through a path created mid-install (e.g. a consumer's
  sibling-checkout symlink) yields the `node_modules` symlink but no
  `node_modules/.bin` shims — `xplat`/`xplat-lint` come back `command not
found` — and reinstalls stay "Already up to date" (GH#16). Heal by
  reinstalling once the path exists (`rm -rf node_modules && bun install`)
  or by running `node node_modules/@octane-xplat/cli/src/link-bins.ts` from
  the app root; wiring that into the consumer's `postinstall` covers fresh
  installs. pnpm 12 re-resolves and is unaffected. `xplat-lint` resolves
  its owned `oxlint` dependency, so invoking `bin/lint.mjs` with `node`
  directly no longer needs `.bin` on PATH.
- Canonical framework patch files live in `packages/cli/patches/` and ship
  with the CLI. Root Bun registration and consumer pnpm configuration are
  synchronized from that manifest; see the package-manager contract above and
  [the patch workflow](../../docs/packages/package-cli.md#framework-patches).
  The patch package's prepack uses `sync-patches.ts --package-only`, refreshing
  only its generated files. Root configuration and starter changes belong to
  the explicit `bun run sync:patches` command. Remove a patch when upstream
  ships the fix, preserving exact source/version identity until then.
- To develop against a local checkout of the `octane-xplat/nativescript-mason`
  fork, see [links/README.md](../../links/README.md) (`bun run dev:masonkit`
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
- Lint: `bun run lint [paths...]` and `bun run lint:fix [paths...]` use the same
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
  CI invokes `bun run lint` so error-level code rules block releases while
  warning-level findings remain advisory. `bun run check` composes lint with
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
  [consumer contract](../../docs/packages/package-lint.md).
- Format: `bun run format` delegates to `xplat fmt`
  (`packages/cli/go/internal/commands/format/format.go`, engine
  `@octane-xplat/fmt` — in-process
  safe lint fixes → Oxfmt → statement spacing over the pinned tsrx-org/oxc
  Rust libraries; JS/TS/JSX/TSX and `.tsrx`). Since 0.2.0 the engine also
  routes the rest of the Oxfmt language inventory (JSON/JSONC, CSS, YAML,
  HTML/Vue/Svelte, Markdown/MDX, GraphQL, TOML, and more) through Oxfmt;
  the Octane lint and spacing stages stay in the JS/TS/TSRX lane. The
  formatter owns blank-line
  spacing, so `xplat/spacing` is no longer a lint rule — lint and fmt do not
  compete. `xplat fmt` writes atomically per file after the batch transforms;
  `--check` exits 1 without writes, `--stdin-filepath` pipes stdin to stdout.

```sh
bun run lint packages/ui
bun run lint:fix packages/lint/src
bun run check:css
bun run check:recipes
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
bun run xplat build --targets '' # exits with an unavailable/empty target error
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
bun run --filter @xplat/web smoke:routing-watch
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

## TSRX JSX initializers in the formatter

`@octane-xplat/fmt` (0.1.1+, still present in 0.2.0) fixes ambient declaration
parsing (`.d.ts`, `.d.mts`, `.d.cts`), but rejects an unparenthesized JSX
initializer inside an `@{}`
function when the initializer stays multiline after formatting and a TSRX
control statement (`@if`, `@for`, `@switch`, `@try`) follows it — reporting
`TSRX_LIFT: formatted TSRX structure differs from the input`. Elements and
fragments both trigger it; comments and blank lines between the statements do
not prevent it, but an intervening non-TSRX statement does. Parenthesizing the
initializer lets the same source format successfully — verified against
elements and fragments through the formatter's Node API and `bun run format`,
not a renderer runtime test. One residual edge: if the parenthesized
initializer collapses to a single line when formatted, `TSRX_LIFT` still
fires.
`packages/ui/src/components/overlays/modal-focus.web.test.tsrx` and the five
`.macos.tsrx` components `ActivityIndicator`, `CheckboxGroup`, `PinInput`,
`RadioGroup`, and `Select` use this workaround; keep it until the formatter
accepts the unparenthesized form.

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

`packages/ui/src/components/collections/Tabs.tsrx` retains that return layout with `prettier-ignore`.
The formatter still handles the rest of the file. Remove the directive when
the compiler accepts the formatted keyed loops; do not remove the loop keys
or widen component props to hide the generated diagnostic.

## Native host names need literal JSX tags

With Octane 0.16.3's universal renderer, `<Tag />` with a string-valued `Tag`
compiles as `universalComponent(renderer, Tag, props)`. That path requires a
compiler-defined function component; a native host name such as `'label'`
fails with `Universal roots accept only compiler-defined universal components.`
Typechecking and bundling do not catch this mismatch. The
[upstream component contract](https://github.com/octanejs/octane/blob/octane%400.16.3/packages/octane/src/universal-core.ts)
and `packages/ui/tests/windows-pressable.test.mjs` establish the boundary.

Use literal native tags in conditional branches. Variables holding compiled
function components, including Link's router adapter, remain a separate path.

```tsrx
/** @jsxImportSource @octane-xplat/jsx */
export function Caption(props: { compact: boolean; text: string }) @{
  @if (props.compact) {
    <label text={props.text} />
  } @else {
    <masonview><label text={props.text} /></masonview>
  }
}
```

The compiled Windows leaf regressions preserve this boundary. Keep literal
native host tags until the compiler/runtime supports string-valued variable
host tags. Packaged scenario results and artifact identities belong in Silo.

## UI Heading parser failure in browser compilation

On 2026-10-28, the lightbox repair fixture failed through the normal public UI
barrel with @tsrx/oxc 0.16.0 and octane 0.14.0: `packages/ui/src/components/content/Heading.web.tsrx`
raised `unsupported TSRX parser shape: reachable synthetic ESTree span` in the
Octane Vite transform. Declaration generation and the required source checks
still passed; they are not evidence that this browser compilation works.
The failure reproduced locally in component tests and remotely in WebKit
2359/Playwright 1.63.0 before the fixture mounted. No visual analysis was used.

```sh
XPLAT_WEB_BROWSER=webkit bun run turbo run test:e2e --filter=@octane-xplat/lightbox -- --audit
```

The lightbox fixture has an explicit `--audit --isolate-ui` mode that imports
only its required real UI leaves, bypassing unrelated barrel exports. Its unit
tests keep the real Overlay and substitute small Text/Icon test hosts. These
are test-isolation measures, not a production workaround or consumer-import
qualification. The production dependency and normal fixture remain unchanged.

```sh
XPLAT_WEB_BROWSER=webkit bun run turbo run test:e2e --filter=@octane-xplat/lightbox -- --audit --isolate-ui
```

Recheck the normal fixture after the parser/compiler or Heading syntax changes.
Remove this isolation when the ordinary public-barrel path compiles again.
Raw remote failure evidence: `/tmp/lightbox-audit-webkit-debug.log` on the
isolated andromeda.local test checkout. Local feedback observation:
`c1ba3022-51ad-4f95-bd9e-d1bd470f3fc4`. No upstream issue or root cause beyond
the failing compiler stage was established during this repair.

## Bamboo standalone scanning of TSRX templates

With `@bamboocss/dev` 1.60.1, `bamboo cssgen` rejects a `.tsrx` file containing
`export function Example() @{ ... }` with `ERR_BAMBOO_EXTRACT_FAILED` and
`Expected a semicolon or an implicit semicolon after a statement, but found none`.
The failing source was:

```tsrx
/** @jsxImportSource @octane-xplat/jsx/dom */
// src/Example.web.tsrx
import { css } from './styled-system/css'
export function Example() @{
	<div className={css({ padding: '8' })}>TSRX</div>
}
```

The probe ran `bamboo cssgen` with the package README config and `.tsrx` added
to `include`; plain `.ts` and `.tsx` fixtures extracted successfully. This is standalone
CLI extraction evidence, not a qualification of Vite's transformed-module path.

The [Bamboo README](../../docs/packages/package-bamboo.md) therefore scans `.ts`/`.tsx`
and keeps shared `css()` calls in a `.ts` module that TSRX components can import.
No dependency patch was added. Recheck raw template extraction when upgrading
Bamboo before adding `.tsrx` to this scan. Retained reproduction, versions and
logs: `~/dev/reports/octane-xplat/package-readme-api-audit-20261031.md`.
