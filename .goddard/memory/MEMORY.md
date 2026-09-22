# MEMORY

Project: octane-xplat — exploring a single Octane codebase targeting web (DOM) + iOS/Android via NativeScript. Design phase complete as of 2026-09-22; next is the prototype harness.

## Hard constraints discovered
- `octane/universal/native` is a host-neutral runtime with zero DOM dependency; the compiler emits `universalPlan("nativescript")` + slot tables → create/update/insert/event/destroy commands.
- Universal surface verified ≈ full React API: all hooks, `lazy`, `memo`, `createPortal`, `Activity`, transitions, `use()`, portal capability types, transport protocol, `UniversalTextPolicy` ('reject'|'ignore'|'host'). No `<Suspense>` → `@try`/`@pending`/`@catch` is the portable boundary.
- `@nativescript-community/octane` is a `UniversalHostDriver` over `@nativescript/core`: element registry of lowercase view tags, `registerElement` for plugin views, `hostSlot` for property-wired children.
- Renderer ownership is decided per file at compile time; each file uses one element vocabulary, so leaf components split `*.web.tsrx` / `*.native.tsrx`. `Platform.select` works for values/props only. `.tsrx` is auto-owned by extension.
- Hook-using modules must be inside the renderer include glob; hooks in plain `.ts` bind a second runtime copy with no active dispatcher.
- Shared source compiles once per target; two entry points (`createRoot(el)` web vs `renderNativeScriptApp(page, App)` native), two dev servers, one source tree.
- TypeScript needs `tsconfig.web.json` / `tsconfig.native.json` with different `jsxImportSource`.
- `@nativescript-community/vite-octane` does real on-device HMR with hook state preserved.
- Modal on native is a second Octane root (`showModal`) — context and portals do not cross; modal APIs are `component`+`params`-shaped.
- NS `ListView` item templates don't reconcile → `List` is `items`+`renderItem` with per-cell `createNativeScriptRoot`, never children.
- NS rich text is flat (one `formattedstring`, sibling spans) — nested styled `<Text>` uses text-context className absorption + a small driver patch (decision #25, patch-package + upstream candidate).
- `resolve.extensions`+`moduleSuffixes` gives `*.ios`/`.native`/`.web` leaf resolution with zero custom code; precedence must stay aligned with NS's own suffix handling.
- The compiler's `validation` config is a free compile-time seam enforcer (basis for the allowlist/lint plan).
- NS ≥8.8 supports CSS custom properties, `calc`, media-query L3, `matchMedia()`, `@keyframes` — CSS-first styling is real, with a documented ∩-grammar (no `transition`, ~12 keyframe-animatable props, silent per-declaration failures, className-swap trap).
- NativeScript has no web render target: "web" in NS docs = non-UI TS sharing + StackBlitz/Preview. DOMiNATIVE is the opposite direction.

## Owned surface — "we own the contracts; upstream owns the engines"
- Forced to own, ranked by blast radius: primitives contract → navigation contract → resolution toolchain → seam enforcement (lint/allowlists) → animation/gesture facade → platform-services surface → version matrix + patches.
- Not owned: renderer/host driver/HMR, styling engine (real CSS on both targets), worklet runtime, nav containers, native bundler.

## Design docs (complete 2026-09-22)
- `docs/` — full plan: architecture (6 invariants), module-resolution, primitives (Text/layout/List/Modal/Overlay/Pressable/TextInput contracts), styling, animation-gestures, navigation, platform-services, toolchain, testing, decisions (25-entry ledger), open-questions (12/20 answered at desk level).
- `docs/spec.md` — the synthesis: packages, conventions, config surface, invariants, hello-world walkthrough, accepted leaks, risk register + build order.
- `docs/css-support-matrix.md` — seeded NS∩web grammar.
- `docs/README.md` — dashboard; status vocab `mapped → validated → building → built`.
- `prior-art/` — others' systems, deliberately separate per user request.
- `AGENTS.md` — the exploration loop (question→hypotheses→evidence→decision→spec delta→ledger→commit), Silo conventions, invariants.
- User preference: map the entire design in markdown before any code; plan vs precedent never blur.
- Rejected: `docs/problems/` subfolder (drift risk); decision #17 — emulating `@nativescript/core` views over DOM.

## Silo state
- Seeded schema live: topics/questions/decisions/experiments. 40/41 topics resolved across all 9 phases; `dev-loop-topology` stays queued (purely empirical). 8 lab experiments queued for the prototype harness.
- `questions.evidence`: `desk-source` vs `lab-experiment`; `experiments.targets`: web|native|both.

## References / prior art
- Reference app: `NathanWalker/ns-octane` — its README is effectively the port's design doc.
- User-named influences: One (onestack.dev) for primitives, Flutter for styling; RN/RNW/Tamagui comparable precedents.

## Next step
- Prototype harness. Published deps confirmed: octane 0.4.0, `@nativescript-community/octane` 0.2.0, `@nativescript/core` 9.1.2. Web half trivially startable; native half needs `npm i -g nativescript` + `ns doctor` — paused for user approval of the global install.
- User mandate (2026-09-22): proceed autonomously, don't stop unless a truly critical lasting decision arises; commit frequently — commits are the rewind points; goal is a stellar framework, not process adherence.

## Repo state
- Git repo initialized 2026-09-22 (user-approved). Desk-phase work landed on main through 6279c4c (7 commits this session; tracking layer d51270e landed earlier).
