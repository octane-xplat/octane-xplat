# Decisions

> Ledger of design commitments. **Decided** = build to it. **Provisional** =
> build to it but flag for revisit at first friction. **Forced** = the platform
> decided for us. New entries append; reversals get a dated note, not an edit.

| # | Decision | Status | Rationale | Where |
|---|---|---|---|---|
| 1 | One source tree compiled per target; never shared compiled output | **Forced** | Renderer ownership is per-file at compile time | architecture |
| 2 | `*.web/native/ios/android.tsrx` suffix resolution via Vite resolver plugin | Decided | RN/One convention; resolver also drives route tables + platform modules | module-resolution |
| 3 | Leaf-vocabulary splits at file boundaries; no intrinsics in shared files | **Forced** | A file compiles under exactly one renderer | architecture, primitives |
| 4 | Hook-calling code only in `.tsx`/`.tsrx` inside renderer include glob | **Forced** | Hooks bind the runtime that owns the file | architecture |
| 5 | CSS-first styling: shared stylesheet + Tailwind + CSS-var tokens; style objects for dynamics only | Provisional | NS has real CSS (+vars, media queries, keyframes) — unlike RN; avoid building a styling runtime | styling |
| 6 | Primitives shaped like RN's vocabulary (View/Text/Pressable), implemented per-target | Decided | RNW proves converging on the constrained surface works | primitives, prior-art/react-native-web |
| 7 | `styled()` variants API over clsx composition | Provisional | Tamagui-shaped authoring, CSS-backed implementation | styling, prior-art/tamagui |
| 8 | Shared route table + `_layout` shells; routes may platform-split | Provisional | One's model; Frame/Page vs URL is irreconcilable below this seam | navigation, prior-art/one |
| 9 | Modal = separate Octane root on native | **Forced** | `showModal` hosts its own root; context/portal don't cross | primitives, navigation |
| 10 | Animation facade (controller/`to`/`spring`), imperative writes, no worklets | Provisional | JS is on the UI thread on NS — no bridge problem to solve | animation-gestures |
| 11 | `packages/platform` = headless capability interfaces, resolved per-target | Decided | standard seam; keeps DOM/NS APIs out of shared code | platform-services |
| 12 | Monorepo `apps/{web,native}` + `packages/*` | Provisional | could start single-app; layout earns its cost with multiple targets/apps | architecture |
| 13 | Named exports for components/routes | Provisional | HMR accept-boundary hygiene (One/RN precedent) | toolchain |
| 14 | Dark mode: `prefers-color-scheme` default + class override | Provisional | media queries exist on both targets | styling |
| 15 | pin exact versions; patch-package accepted | **Forced-ish** | both upstreams moving; explicit version matrix required | toolchain |
| 16 | No `FlatList`-style children API: lists take `items`+`renderItem` | Decided | NS ListView item templates can't take reconciled children | primitives |
