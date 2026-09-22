# MEMORY

Project: octane-xplat — single Octane codebase targeting web (DOM) + iOS/Android via NativeScript. Design complete 2026-09-22; prototype harness built, iOS render path verified end-to-end, all 8 lab experiments passed on simulator same day.

## Hard constraints discovered
- `octane/universal/native` is a host-neutral runtime with zero DOM dependency; the compiler emits `universalPlan("nativescript")` + slot tables → create/update/insert/event/destroy commands.
- Universal surface verified ≈ full React API: all hooks, `lazy`, `memo`, `createPortal`, `Activity`, transitions, `use()`, portal capability types, transport protocol, `UniversalTextPolicy`. No `<Suspense>` → `@try`/`@pending`/`@catch` is the portable boundary.
- `@nativescript-community/octane` is a `UniversalHostDriver` over `@nativescript/core`: element registry of lowercase view tags, `registerElement` for plugin views, `hostSlot` for property-wired children.
- Renderer ownership is per file at compile time; leaf components split `*.web.tsrx` / `*.native.tsrx`. `Platform.select` works for values/props only. `.tsrx` is auto-owned by extension.
- Hook-using modules must be inside the renderer include glob; hooks in plain `.ts` bind a second runtime copy with no active dispatcher.
- `octaneConfig(mode, options)` — plugin options are the SECOND arg; `{mode, octane:{…}}` in one arg is silently ignored → `.tsrx` falls back to the DOM renderer.
- Vendored `__nsRequire` drops `export *` re-exports: in `.native.tsrx` leaves, universal hooks/context import `from 'octane'` (compiler retargets to working served-ESM); `@nativescript-community/octane` only for its own exports (`renderNativeScriptApp`, `createNativeScriptRoot`).
- `root.render(Component, props)` takes a component, not an element — ListView cell roots wrap element-returning `renderItem` in a `Cell` component.
- TS can't compose `moduleSuffixes`×`.tsrx` → `packages/ui` resolves leaves via `index.web.ts`/`index.native.ts` barrels + `web`/`native` export conditions; `.native.tsrx` files carry `/** @jsxImportSource @nativescript-community/octane */`. `tsrx-tsc` also ignores `moduleSuffixes` for `.tsrx` — barrels must name the suffix explicitly.
- Packages holding shared `.tsrx` must dev-depend on `@nativescript-community/octane` + `@nativescript/core` — universal-compiled output imports them; isolated pnpm can't reach the app's copies.
- Modal on native is a second Octane root (`showModal`) — context and portals do not cross; modal APIs are `component`+`params`-shaped.
- NS `ListView` item templates don't reconcile → `List` is `items`+`renderItem` with per-cell `createNativeScriptRoot`, never children.
- NS rich text is flat → nested styled `<Text>` uses text-context className absorption + a small driver patch (decision #25).
- NS ≥8.8 supports CSS custom properties, `calc`, media-query L3, `matchMedia()`, `@keyframes` — CSS-first styling is real, with a documented ∩-grammar.
- NativeScript has no web render target: "web" in NS docs = non-UI TS sharing + StackBlitz/Preview.

## Toolchain (verified on device)
- pnpm ISOLATED linker + `preserveSymlinks:false` — hoisted layout breaks `getExportsReverseMap` (reads per-app `node_modules/<pkg>`), vendored requires return `{}`. Supersedes the earlier hoisted note in AGENTS.md.
- chokidar pinned to 3.6.0 via pnpm overrides — sass (hard dep of `@nativescript/vite`) pulls chokidar5 which collides with readdirp3 under `ns run`'s bundled config.
- All deps pinned exact + `saveExact:true`; octane single-version 0.4.0 workspace-wide (autoInstallPeers had planted 0.3.6 — dual-runtime hazard).
- tsconfig `paths` is the HMR-scope lever: native dev server watches appPath + paths-alias roots; `packages/` needs explicit file-target mappings (dir wildcards fail).
- `console` is undeclared in NS types — minimal local declaration in the native app keeps DOM lib out (invariant #4). NSLog shows `(NativeScript) CONSOLE INFO/ERROR` — device observability channel.
- `ns run` is a watch process bound to its launching shell — if it dies, bare `vite serve` can't substitute (app needs ns `--env.*` args); restart `ns run`. Orphaned `ns run` processes wedge the sim (simctl hangs → shutdown/erase to recover).
- Device discovers the native vite port via synced app metadata — auto-bumps when occupied (landed on 5174); web dev server pinned :5200 for determinism.
- iOS toolchain green (Xcode 26.6, iPhone 17 Pro sim, `gem install --user-install xcodeproj` — `ns doctor` lies). Android blocked: SDK build-tools missing.
- User: pnpm or bun, never npm. User: pin unstable deps so things don't drift.

## Lab findings (8 experiments on iOS sim — landed ca674a6..ba06968)
- ListView is chatty: `itemLoading` refires on ANY layout-affecting render (native layout invalidation — `memo`/stable props can't prevent it), hosts rotate index assignment per wave, `e.item` lags the splice one wave. Leaf workaround: module-scope maps keyed by native objects + authoritative `items[index]` + post-splice `refresh()`. Proper fix = driver-managed `listview` whose items-diff drives refresh natively.
- `useRef().current` writes land in draft hooks during render — pre-commit event closures read stale values; module-scope storage keyed by the native object sidesteps it.
- TextInput: programmatic `text` writes echo back as `textChange` → spurious `onChange`; leaf drops `e.value === props.value`. Both controlled directions verified; user manually confirmed real typing/tapping on iOS sim — cursor-position + Android IME remain open.
- `nativeScriptRenderer` ships zero `forbiddenGlobals` — validation added in app config, fires at transform with file+line; only covers compile-pipeline files (`.tsrx`), not plain `.ts` (no-DOM-lib tsconfig backstops).
- Prod `ns build` vendor is clean of DOM octane — DOM modules (`dom-*`, `hydration/*`, `devalue`) only pollute the DEV deps-bundle via eager package-dep seeding; `octane/universal/native` exists as the lean entry.
- `setState`→commit for a root class/token swap ≈1ms on sim; `.ios.tsrx` > `.native.tsrx` verified; a11y props (`accessible`/`accessibilityLabel`/`accessibilityRole`) confirmed reaching native views.

## Upstream reports (filed 2026-09-22, one issue per problem, user-authorized)
- nativescript-community/octane: #1 driver-managed `listview` (items-diff → `refresh()`); #2 ship default `forbiddenGlobals`/`forbiddenImports` (+ `.ts` files escape validation); #3 suppress `textChange` echo on programmatic `text` writes.
- NativeScript/NativeScript #11440: dev deps-bundle eagerly vendors full octane DOM graph (dev-only waste, second-realm footgun).
- octanejs/octane #1254: `useRef.current` stale in pre-commit event closures — framed as intent question, not bug claim.
- Deliberately not reported: ListView host↔index rotation + `e.item` splice lag — NS core behavior, not driver bugs.
- Strategy: upstream absorption of driver fixes is load-bearing; without it the leaf layer becomes per-primitive folklore. Budget upstream contributions (or a thin owned driver-wrapper) as framework scope.

## Owned surface — "we own the contracts; upstream owns the engines"
- Forced to own, ranked by blast radius: primitives contract → navigation contract → resolution toolchain → seam enforcement → animation/gesture facade → platform-services surface → version matrix + patches.
- Not owned: renderer/host driver/HMR, styling engine, worklet runtime, nav containers, native bundler.

## Design docs (complete 2026-09-22)
- `docs/` — architecture (6 invariants), module-resolution, primitives, styling, animation-gestures, navigation, platform-services, toolchain, testing, decisions (25-entry ledger), open-questions; `docs/spec.md` synthesis; `docs/css-support-matrix.md`; `docs/README.md` dashboard (`mapped→validated→building→built`).
- `prior-art/` — others' systems, deliberately separate per user request. User preference: map the entire design in markdown before any code; plan vs precedent never blur. Rejected: `docs/problems/` subfolder; decision #17 (NS views over DOM).

## Silo state
- 40/41 topics resolved; `dev-loop-topology` empirically answered by Exp 3 (two-server topology verified). All 8 lab experiments done; open questions #3, #4, #15 answered; `tsrx-tsc`-ignores-`moduleSuffixes` filed as a substrate gap.
- Open question c93e0915: editor lane flags TS errors in `List.web.tsrx`/`List.native.tsrx` that `tsrx-tsc` doesn't surface — editor-vs-CLI diagnostic divergence to investigate.

## References / prior art
