# AGENTS.md

Working agreements for this repo.

## What this is

A single [Octane](https://github.com/octanejs/octane) codebase targeting web
(DOM renderer) + iOS/Android
([`@nativescript-community/octane`](https://github.com/nativescript-community/octane),
the universal-runtime driver over `@nativescript/core`).

The framework exists and is published: `packages/ui` ships as
`@octane-xplat/ui` on npm, `packages/cli` as `@octane-xplat/cli` (dev/build/
doctor/typecheck). `packages/app` + `apps/web` + `apps/native` are the probe
harness; `packages/demos` the seam-by-seam demo screens. `docs/` remains the
design record. The real-app proving ground is `~/dev/ns/text-coral-ns` —
its `.agents/docs/` notes record which framework seams still leak.

## Layout

| Path | What it is |
|---|---|
| `docs/` | Our plan + status. `docs/README.md` is the index; `docs/status.md` the dashboard — seven owned problems, each with a status header (Owns / Status / Blocks on / Decisions / Validated by). |
| `packages/ui` | The framework — `@octane-xplat/ui` on npm. Primitives, styled(), stacks, routes, theme. Prop types in `src/props.ts`. |
| `packages/cli` | `@octane-xplat/cli` — `xplat` dev/build/doctor/typecheck/clean commands. |
| `packages/app`, `packages/demos` | Probe harness app + seam-by-seam demo screens. |
| `apps/web`, `apps/native` | Entry shells + vite configs for the harness. |
| `packages/create`, `packages/platform` | Project scaffolder; platform services seam. |
| `prior-art/` | Other people's systems — substrate (`octane`, `nativescript-octane`, `nativescript-core`) and precedents (`one`, `tamagui`, `react-native-web`, `flutter`). Documents here are never commitments. |
| `docs/decisions.md` | Decision ledger, `#`-numbered, statuses: forced / decided / provisional / rejected. Reversals get dated notes, not edits. |
| `docs/open-questions.md` | Unverified seams, `Q`-numbered, ranked by blast radius. |
| `research/` | Gitignored clones of upstream repos for source interrogation. Not shipped, not authoritative — cite upstream files in docs instead. |
| Silo | Git-scoped SQLite tracking the exploration state (see below). |

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
nothing to commit). Tables:

| Table | One row = | Status values |
|---|---|---|
| `topics` | an area of interrogation | `queued` → `exploring` → `resolved` / `parked` |
| `questions` | a specific unknown | `open` → `answered` / `parked` |
| `decisions` | a commitment (mirrors decisions.md `#`s) | `forced` / `decided` / `provisional` / `rejected` |
| `experiments` | a validation to run | `queued` → `running` → `passed` / `failed` / `parked` |

- Natural keys: topic `slug`, decision `num`. Update rows in place; don't
  duplicate.
- `questions.evidence`: `desk-source` (upstream code/doc read) or
  `lab-experiment` (needs the running app).
- `experiments.targets`: `web` | `native` | `both`.

## Toolchain notes (prototype harness — verified)

- **pnpm, not npm** (user preference). `pnpm-workspace.yaml` carries
  `nodeLinker: isolated` — `@nativescript/vite`'s vendor-manifest code needs it.
  Consequence: every package must declare what it imports (no transitive-dep
  leakage), and apps must declare the `@nativescript/*` plugins they ship —
  `/ns/m` resolves node_modules specs under the app root only.
  `minimumReleaseAgeExclude` covers the octane packages — they're newer than
  the supply-chain cutoff.
- `pnpm-workspace.yaml` `patchedDependencies` currently carries two live
  patches: `@nativescript-community/vite-octane` (`.tsrx` hot updates +
  real `recipients` count) and `@nativescript/vite` (reserved-word named
  exports like zod's `enum` survive dep shims). Drop each when a release
  carries the fix. esbuild is pinned to 0.27.7 — vite 8's peer range admits
  0.28.x and the vendor bundler dies on the host/binary mismatch.
- Workspace deps use `"workspace:*"` (pnpm auto-install-peers fetches bare `*`
  from the registry → 404).
- `apps/native` needs `@valor/nativescript-websockets` — the on-device HMR
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
  a manual `monkey`/`am start` boots the *inlined bundle* (no HTTP, no ws,
  looks like a silent HMR failure but isn't). The `ns-hmr-client-watchdog`
  plugin in the native vite config warns when a session was fetched but no
  ws client attaches.

## Invariants (the short list — full set in docs/architecture.md)

1. One element vocabulary per file; platform divergence at file boundaries
   (`*.web`/`.native`/`.ios`/`.android` suffixes via Vite resolver).
2. Hook-calling code only in `.tsx`/`.tsrx` inside the renderer include glob.
3. One copy of `octane` per app.
4. No DOM globals in shared code.
5. Universal-runtime APIs only in shared code (allowlist produced by Phase 1).
6. Static styles = CSS/`className`; dynamic = `style` objects.
7. Shared-state reads subscribe via `useStore` — the universal renderer
   retains unchanged-prop children on parent re-render, so bare module-scope
   reads go stale on native (web re-invokes them; decision #27).

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
  reads through caches and props.
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
