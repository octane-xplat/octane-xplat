# MEMORY

Project: octane-xplat — exploring a single Octane codebase targeting web (DOM) + iOS/Android via NativeScript. Design/exploration phase as of 2026-09.

## Hard constraints discovered
- `octane/universal/native` is a host-neutral runtime with zero DOM dependency; the compiler emits `universalPlan("nativescript")` + slot tables → create/update/insert/event/destroy commands.
- `@nativescript-community/octane` is a `UniversalHostDriver` over `@nativescript/core`: element registry of lowercase view tags (`stacklayout`, `gridlayout`, `label`, `listview`, `frame`, `page`), `registerElement` for plugin views, `hostSlot` for property-wired children.
- Renderer ownership is decided per file at compile time (`nativeScriptRenderers({ include: 'src/**/*.tsx' })`); each file uses one element vocabulary, so leaf components must split `*.web.tsrx` / `*.native.tsrx`. `Platform.select` works for values/props only.
- Hook-using modules must be inside the renderer include glob; hooks in plain `.ts` bind a second runtime copy with no active dispatcher.
- Shared source compiles once per target (like RN + react-dom); two entry points: `createRoot(el)` web vs `renderNativeScriptApp(page, App)` native; two dev servers, one source tree.
- TypeScript needs `tsconfig.web.json` / `tsconfig.native.json` with different `jsxImportSource`; pragma comments are the only per-file override.
- `@nativescript-community/vite-octane` does real on-device HMR with hook state preserved; re-registering an element tag recreates live instances without remount.
- NativeScript supports one root per window via `Application.setWindowContentResolver` (iPad scenes, CarPlay).
- Modal on native is a second Octane root (`showModal`) — context and portals do not cross; modal APIs must be `{open, params}`-shaped (content-as-screen, not children).
- NS `ListView` item templates don't reconcile like DOM children → `List` primitive is `items`+`renderItem`, never takes children.
- NS toolchain already resolves `.ios.`/`.android.` suffixes itself; our leaf-resolution scheme is a superset and precedence must stay aligned.
- NS ≥8.8 supports CSS custom properties, `calc`, media-query L3 (`prefers-color-scheme`, `orientation`, `min-width`), `matchMedia()`, `@keyframes` — theming/responsive vocabulary is genuinely shareable (basis for CSS-first styling).
- NativeScript has no web render target: "web" in NS docs = non-UI TS code sharing + StackBlitz/Preview (browser hosts the bundler; a device still renders). Runtimes exist only for android/ios/visionos. DOMiNATIVE is the opposite direction — DOM-ish API inside NS producing native views.

## Owned surface — "we own the contracts; upstream owns the engines"
- Forced to own, ranked by blast radius: primitives contract → navigation contract → resolution toolchain → seam enforcement (lint/allowlists) → animation/gesture facade → platform-services surface → version matrix + patches.
- Not owned: renderer/host driver/HMR (`@nativescript-community/octane`), styling engine (real CSS on both targets), worklet runtime (JS already on UI thread), nav containers, native bundler (`@nativescript/vite`).

## Design docs (written 2026-09-21; tracking layer added 2026-09-22)
- `README.md` — thesis, reading order, first-prototype slice.
- `docs/` — our plan: architecture (6 invariants), module-resolution, primitives, styling, animation-gestures, navigation, platform-services, toolchain, testing, decisions (17-entry ledger), open-questions (20 ranked seams).
- `docs/README.md` — dashboard indexing docs by domain and by the seven owned problems; each problem doc carries a status header (Owns/Status/Blocks on/Decisions/Validated by); status vocabulary `mapped → validated → building → built`; "Validated by" names the concrete proving experiment.
- `prior-art/` — others' systems, deliberately separate per user request: octane, nativescript-octane, nativescript-core, one, tamagui, react-native-web, flutter.
- User preference: map the entire design in markdown before any code; prior art stays in `prior-art/` so plan vs precedent never blur.
- Rejected: `docs/problems/` subfolder — docs already map 1:1 to owned problems; a parallel tree would drift (tracking layer landed d51270e).
- Decision #17 (rejected): emulating `@nativescript/core` views over DOM — costs SSR, semantic HTML, real a11y/DOM events on web, while Octane already ships a first-class DOM renderer.
- Top open questions: `.tsrx` covered by the include glob, universal-vs-DOM export delta, ListView template mechanics.

## References / prior art
- Reference app: `NathanWalker/ns-octane` — its README is effectively the port's design doc.
- User-named influences: One (onestack.dev) for primitives, Flutter for styling; RN/RNW/Tamagui are the comparable precedents.

## Planned approach
- Vite resolver picks the leaf file (`*.ios.tsrx` → `*.native.tsrx` → `*.tsrx`), then the Octane plugin's renderer scope applies.
- Primitives layer (`View`/`Text`/`Row`/`Column`/`Stack`/`Grid`/`Absolute`) is the main design surface — the renderer problem is already solved.
- User decision (2026-09-22): use Silo to track design-exploration progress; DB is greenfield (detached/absent). Proposed schema: topics/questions/decisions/experiments + saved queries.
- Exploration ordering principles: blast-radius first, desk (source-reading) before lab (prototype), contracts before mechanics. Phase 1 = clone octanejs/octane, nativescript-community/octane, ns-octane into gitignored `research/` to close ~8 top open questions.

## Repo state
- Git repo initialized 2026-09-22 (user-approved); doc tree under version control from day one.
