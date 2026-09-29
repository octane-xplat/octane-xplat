# AGENTS.md

Working agreements for this repo.

## What this is

A single [Octane](https://github.com/octanejs/octane) codebase targeting web
(DOM renderer) + iOS/Android
([`@nativescript-community/octane`](https://github.com/nativescript-community/octane),
the universal-runtime driver over `@nativescript/core`).

The framework exists and is published: `packages/ui` ships as
`@octane-xplat/ui` on npm, `packages/cli` as `@octane-xplat/cli` (dev/build/
doctor/typecheck). `packages/app` + `apps/web` + `apps/mobile` are the probe
harness; `packages/demos` the seam-by-seam demo screens. `docs/` remains the
design record. The real-app proving ground is `~/dev/ns/text-coral-ns` —
its `.agents/docs/` notes record which framework seams still leak.

## Layout

| Path                                   | What it is                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/`                                | Our plan + status. `docs/README.md` is the index; `docs/status.md` the dashboard — seven owned problems, each with a status header (Owns / Status / Blocks on / Decisions / Validated by).        |
| `packages/ui`                          | The framework — `@octane-xplat/ui` on npm. Primitives, styled(), stacks, routes, theme. Prop types in `src/props.ts`.                                                                             |
| `packages/cli`                         | `@octane-xplat/cli` — `xplat` dev/build/doctor/typecheck/clean commands.                                                                                                                          |
| `packages/app`, `packages/demos`       | Probe harness app + seam-by-seam demo screens.                                                                                                                                                    |
| `apps/web`, `apps/mobile`              | Entry shells + vite configs for the harness.                                                                                                                                                      |
| `packages/create`, `packages/platform` | Project scaffolder; platform services seam.                                                                                                                                                       |
| `packages/gif`, `packages/canvas`, `packages/effects` | Leaf packages — features that need a NativeScript plugin ship here, declaring the plugin as a real `dependency` (decision #51).                                        |
| `.agents/references/`                 | Agent-facing index of external implementations to compare against; patterns are references, not adoption or dependency decisions.                                                              |
| `prior-art/`                           | Other people's systems — substrate (`octane`, `nativescript-octane`, `nativescript-core`) and precedents (`one`, `tamagui`, `react-native-web`, `flutter`). Documents here are never commitments. |
| `docs/decisions.md`                    | Decision ledger, `#`-numbered, statuses: forced / decided / provisional / rejected. Reversals get dated notes, not edits.                                                                         |
| `docs/open-questions.md`               | Unverified seams, `Q`-numbered, ranked by blast radius.                                                                                                                                           |
| `research/`                            | Gitignored clones of upstream repos for source interrogation. Not shipped, not authoritative — cite upstream files in docs instead.                                                               |
| Silo                                   | Git-scoped SQLite tracking the exploration state (see below).                                                                                                                                     |

## Task-based documentation coverage

[Recipes](recipes/README.md) define the non-trivial developer workflows that
need documentation and the criteria for complete coverage. Before changing
public behavior, setup, or a supported workflow, inspect recipes by outcome and
related API name. Add or update the affected recipe, supporting docs, and
maintained examples in the same change; pure refactors ordinarily need none.
Do not weaken criteria to hide an implementation limitation.

Record criterion coverage and verification evidence separately in Silo's
`recipe_audit` table, following the recipe guide. Run `pnpm check:recipes`.
At handoff, identify affected recipes and remaining gaps, or briefly explain
why no recipe is affected. A public workflow change is not finished until its
recipe and documentation are reconciled and any remaining gap is explicit.

`packages/ui` takes **no new dependencies and no new peers** — a feature
needing a NativeScript plugin ships as its own leaf package instead
(decision #53). `octane` is the only required peer; the remaining peers
are optional, and `ui` has zero `dependencies` — the svg plugin is
vendored into `src/vendor/ui-svg` with its `platforms/` config carried
on the package (#62).

## The exploration loop

Per Silo topic, in phase order (see `docs/exploration-path.md` or
`docs/README.md`):

**question → hypotheses → evidence (source read or experiment) → decision →
spec delta in the domain doc → ledger updates → commit.**

Rules of the road:

- **Desk before lab.** Answer by reading upstream source first. Experiments
  needing a running app stay queued until the prototype harness exists — the
  probe app is most of the prototype anyway.
- **Docs carry conclusions; Silo carries state.** A Silo row is
  statement+rationale+refs, not narrative. The design lives in `docs/`.
- **Commit frequently** — after each resolved-question batch or topic
  completion. Commits are the rewind points. Conventional Commits (`docs:`,
  `silo:`-adjacent state is external — repo commits cover doc changes only).
- **Proceed autonomously.** Don't stop for input unless a decision is truly
  critical and has lasting consequences. Course-correct freely mid-process —
  the goal is a stellar framework, not adherence to the outline.
- **Mark confidence honestly.** A decision reached by source-reading is
  different from one verified on-device; the ledger and question rows carry
  evidence type (`desk-source` vs `lab-experiment`) so we know what's proven vs
  inferred.

## Silo conventions

Database is git-scoped to this workspace (stored under Silo's app-data dir;
nothing to commit) and **shared across every worktree of this repo** — writes
here are visible to parallel agents immediately. Tables:

| Table          | One row =                                | Status values                                         |
| -------------- | ---------------------------------------- | ----------------------------------------------------- |
| `topics`       | an area of interrogation                 | `queued` → `exploring` → `resolved` / `parked`        |
| `questions`    | a specific unknown                       | `open` → `answered` / `parked`                        |
| `decisions`    | a commitment (mirrors decisions.md `#`s) | `forced` / `decided` / `provisional` / `rejected`     |
| `experiments`  | a validation to run                      | `queued` → `running` → `passed` / `failed` / `parked` |
| `docs_audit`   | an audited user-facing docs page         | `queued` → `auditing` → `clean` / `fixed` / `verified` |
| `recipe_audit` | a per-criterion recipe assessment        | per-recipe state; `optimistic_revision` enforced      |

- Natural keys: topic `slug`, decision `num`. Update rows in place; don't
  duplicate.
- **Silo allocates decision numbers.** For a new decision, insert the
  `decisions` row first (`num` = `max(num) + 1`; on a primary-key conflict
  another worktree won the number — retry with the next). Then write the
  `decisions.md` row using the allocated `num` in the same commit. Never pick
  a `#` in the doc before the Silo row exists.
- `pnpm check:decisions` verifies the mirror: doc `#`s missing from Silo and
  status mismatches are errors; Silo `num`s ahead of the local doc are
  warnings (in-flight work in other worktrees — do not delete or renumber
  them to satisfy the check).
- Saved queries: `silo query open-questions`, `silo query work-queue`,
  `silo query topic-decisions <slug>`.
- `questions.evidence`: `desk-source` (upstream code/doc read) or
  `lab-experiment` (needs the running app).
- `experiments.targets`: `web` | `native` | `both`.

## Toolchain notes (prototype harness — verified)

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
  inside `@octane-xplat/cli` — pnpm only honors `patchedDependencies` at the
  app root, so downstream apps materialize it with `xplat patches apply`
  (copies files into `<app>/patches/` + merges the yaml block; `--force`
  takes the framework copy over a divergent one) and verify with
  `xplat patches check` / `xplat doctor`. The root `pnpm-workspace.yaml`
  references `packages/cli/patches/` directly; the create template carries
  generated self-contained copies. `pnpm sync:patches` regenerates both yaml
  blocks + template files from the manifest — `pnpm check:patches` fails on
  drift. Regenerate a patch via `pnpm patch`/`pnpm patch-commit` (writes to
  the configured path, i.e. the canonical dir), then sync + update the
  manifest entry. Each patch is pinned to an exact version; remove it when
  upstream ships its fix. esbuild is pinned to 0.27.7 — vite 8's
  peer range admits 0.28.x and the vendor bundler dies on the host/binary
  mismatch.
- Workspace deps use `"workspace:*"` (pnpm auto-install-peers fetches bare `*`
  from the registry → 404).
- `apps/mobile` needs `@valor/nativescript-websockets` — the on-device HMR
  transport that `virtual:entry-with-polyfills` imports in dev.
- iOS native build needs the `xcodeproj` Ruby gem visible to the `ruby` on PATH
  (`gem install --user-install xcodeproj`). `ns doctor` can report OK while the
  hook still fails — verify with `ruby -e 'require "xcodeproj"'`.
- Android build needs JDK ≤ 24 — gradle 8.14.3 fails on Java 25
  (`Unsupported class file major version 69`). `brew install openjdk@17` and
  `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
  works; Android Studio's JBR is 25 too.
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

## Changelog

`CHANGELOG.md` is generated in one pass before a version ships — it is
not maintained incrementally.

- **Do not edit it as part of feature/fix work.** Only touch
  `CHANGELOG.md` when the task explicitly says to. Many agents appending
  to one file is a merge-conflict farm; a single generation pass before
  release avoids that.
- **Range:** everything since the last _published_ release — check
  `npm view @octane-xplat/ui versions` and the
  `chore(release): align packages at X.Y.Z` commits; git tags lag the
  registry.
- **Audience:** app developers, not framework maintainers. What they can
  now do, what behavior changed, what to watch for when upgrading. Verify
  the public surface from `index.*.ts` export diffs, not commit messages.
  Plain language — explain or drop internals.
- **Shape:** group by theme (navigation, components, layout, toolchain,
  state), then a Fixed list, then Upgrading — new peer deps, behavior
  changes that could surprise, opt-ins.
- **Exclude repo-internal work:** docs site, harness apps
  (`packages/app`, `packages/demos`, `apps/*`), repo tooling that doesn't
  ship in a package.
- **The docs sweep rides the same pass.** Before a version ships:
  re-verify `docs/known-limits.md` entries stamped older than the
  releasing version and fix what moved, then `pnpm -C apps/docs build`
  (regenerates `llms.txt`/`llms-full.txt` from the guides).
- **Doc examples stay tiny.** Reserve code fences for conventions types
  can't express (file suffixes, `.tsrx` imports, specifiers like
  `theme/tokens.css`); the `create-octane-xplat` template is the
  canonical large example — point at its real files instead of
  duplicating snippets.

## Invariants (the short list — full set in docs/architecture.md)

1. One element vocabulary per file; platform divergence at file boundaries:
   `.web` for browser code, `.mobile` for shared iOS/Android variants, and
   unsuffixed files as the native default; OS suffixes such as `.ios`,
   `.android`, and `.macos` override for one platform.
2. Hook-calling code only in `.tsx`/`.tsrx` inside the renderer include glob.
3. One copy of `octane` per app.
4. No DOM globals in shared code.
5. Universal-runtime APIs only in shared code (allowlist produced by Phase 1).
6. Static styles = CSS/`className`; dynamic = `style` objects.
7. Module-level `signal$`/`query$` `.get()` reads subscribe and re-render on
   native too (universal signal reads, octane universal-signals build).
   Non-signal module state still needs `useStore` per reader — the universal
   renderer retains unchanged-prop children on parent re-render, so bare
   reads go stale on native (web re-invokes them; decision #27).
8. Shared `@octane-xplat/ui` delivers same props → same pixels. Every
   shared component carries a normalization class (see
   `docs/architecture.md`): `self-drawn` (`Switch`, `Slider`,
   `ActivityIndicator`, `Tabs`, `Drawer`, `SegmentedControl`),
   `chrome-reset` OS controls (`TextInput`, `TextArea`, `ScrollView`,
   `SearchInput`), or `hosted` OS surfaces (`WebView`, `Video`,
   `CameraView`) where the parity claim covers the frame plus whatever
   chrome we draw — never the interior content. Platform-authentic
   widgets live behind `@octane-xplat/ui/{ios,android,web}` under OS
   names (`UISwitch`, `MaterialSwitch`, `UITableView`, `RecyclerView`,
   `UIModal`, `MaterialDialog`, `UITabBar`, `BottomNavigationView`,
   `SideDrawer`, `DrawerLayout`, `LiquidGlass`, `Hoverable`) — each
   subpath resolves only on its platform, and
   `xplat/platform-subpath-import` requires a matching file suffix. An
   idiom may ship in two classes at once (shared `refreshing`/`onRefresh`
   vs a subpath `UIRefreshControl`) — as separate components, never a
   mode prop. There is no shared `List`, `Modal`, `openModal`,
   `PlatformBadge`, or `glass` prop; `KeyboardAvoiding` is native-only.
   (decisions #44–46, #50)

## Companion libraries (used by apps built on this stack)

- **Octane signals** (`octane/signals`, `octane/signals/client`) — the
  framework's reactive state engine. `signal$(initial)` for module-level
  shared state (document-local on web), `useSignal$` for component-local,
  `derived$` for computed values, `query$(select, load)` for async data
  (return `skip` from the selector for "no request"; read via
  `.snapshot()`/`.get()` under `@try`/`@pending`/`@catch`). Native `.get()`
  reads in render subscribe automatically — no compiler flags needed. Every
  consuming module needs a runtime import of `octane/signals` (or /client).
  `$`-suffix naming (`count$`, `user$`) tells the compiler to preserve native
  reads through caches and props. `query$` is the default data-fetching path
  — see `docs/data.md`. `@octanejs/tanstack-query` is a supported opt-in for
  apps that want TanStack's cache machinery; on native it needs the entry
  shims documented in `docs/data.md`.
- **Rouzer** (`rouzer`, `rouzer/http`) — shared route tree between server and
  client. `http.resource('posts/:id', { get: http.get({query, response:
$type<T>()}), like: http.post('like', {body, response: $type<T>()}) })` —
  resource children join paths (`POST /posts/:id/like`). Server:
  `createRouter({basePath:'api/'}).use(routes, handlers)` →
  `toFetchHandler(router, {host: () => ({env})})`; handlers read
  `ctx.path`/`ctx.query`/`ctx.body`/`ctx.host.env`. Client:
  `createClient({baseURL, routes})` → flat input objects
  (`client.post.like({id})`). GETs take query; mutations take body.
- **Qubu** (`qubu`, `qubu/sqlite`) — typed SQL builder; no driver coupling.
  `table('t', {col: text({nullable:true})})`, queries via
  `select({alias: t.col}, from(t), leftJoin(u, eq(...)), where(...),
groupBy(...), orderBy(desc(t.col)))`, mutations via
  `insertInto(t, values({...}))` / `update` / `deleteFrom`. Execute with
  `executeRows(query, adapter)`; the adapter is a `QueryAdapter` you own —
  for Cloudflare D1, ~10 lines: `dialect: sqliteDialect()`, `execute` calls
  `env.DB.prepare(text).bind(...params).all()` and returns
  `{rows: res.results, affectedRows: res.meta.changes, insertId:
res.meta.last_row_id}` (`.all()` works for mutations too). Product docs ship
  inside the package under `node_modules/qubu/docs/` — read those, not the
  website.
- Stack used in the test app (`~/dev/ns/text-coral-ns`): Worker entry wraps
  `toFetchHandler` per request so the CF `env` reaches `ctx.host.env`; vite
  `server.proxy` maps `/api` → `wrangler dev` on :8787; D1 schema+seed live in
  `migrations/` and apply via `wrangler d1 migrations apply --local`.

<!-- graft:start -->

## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
