# Framework spec (synthesis)

> The whole design on one page. Everything here is backed by a domain doc;
> where a detail is provisional or lab-pending, the pointer says so.
> Decision numbers refer to [decisions](decisions.md); question numbers to
> [open-questions](open-questions.md).

## The model

One source tree, two compilations. A shared `.tsrx` file is compiled by the
DOM renderer (`octane`) in the web build and by the NativeScript universal
renderer (`@nativescript-community/octane`) in the iOS/Android build. Files
diverge by suffix (`*.web`/`*.native`/`*.ios`/`*.android`), resolved by
ordered `resolve.extensions` + `moduleSuffixes`; renderer ownership follows
the *resolved* filename through first-match `renderers.rules` globs.

```
app screens / features          shared .tsrx — primitives + services only
        │
  packages/ui                   primitives, leaf-split per target
  packages/platform             headless capabilities, resolved per-target
  packages/navigation           route table, Link, shells
  packages/hooks                hook-bearing shared modules (.tsrx)
  packages/core                 hook-free logic (.ts — never hooks)
        │
  web leaves    →  DOM intrinsics (<div> <span> <input>…)
  native leaves →  NS intrinsics (<label> <flexboxlayout> <listview>…)
```

## What upstream gives us (not ours to build)

- **Runtime/compiler**: Octane universal ABI — hooks, context, `use()`, `lazy`,
  `memo`, transitions, `Activity`, `@try`/`@pending`/`@catch` boundaries,
  HMR via `hmrUniversalComponent` self-accepting modules.
- **Native driver**: NS view parenting, prop assignment (`view[x]=v`),
  `className`/`style` handling, event aliasing, element registry +
  hot-replaceable `registerElement`, `createNativeScriptRoot`/
  `renderNativeScriptApp`, RootLayout, ListView, `frame`/`tabview`/`drawer`,
  `showModal`.
- **Renderer config**: `registry` + `rules` + `boundaries` + **`validation`**
  (`forbiddenGlobals`/`forbiddenImports`/`textHosts`/`textParents`/`hostProps`)
  — compile-time seam enforcement we get free.
- **CSS**: real engine both sides (selectors, vars, `@media`, `@keyframes`).
- **HMR**: self-accepting component modules; in-place hot-swap both targets.

## What we own (the seven problems)

| # | Surface | One-line contract |
|---|---|---|
| 1 | [primitives](primitives.md) | RN-shaped vocabulary (`View`/`Text`/`Pressable`/`List`/`Modal`…); leaf files speak native intrinsics; prop conventions = `className`/`style`(dip)/refs/escape bags |
| 2 | [navigation](navigation.md) | Shared route table + `Link`/`useNavigate`/`goBack`; shells split `_layout.web/.native`; modals = own roots (`component`+`params`) |
| 3 | [module-resolution](module-resolution.md) | `resolve.extensions` ordering + TS `moduleSuffixes`; `.tsrx` default dialect; dual tsconfig typecheck |
| 4 | [testing](testing.md) | Compiler `validation` first; lint backstops; `createObjectDriver` mock-host tests; dual `tsrx-tsc` matrix |
| 5 | [animation-gestures](animation-gestures.md) | `useAnimation().to/spring` + `useGesture`; imperative writes per frame; JS spring integrator (native `spring` diverges) |
| 6 | [platform-services](platform-services.md) | `Capability{supported,ensure,impl}`; `useAppState`/`useBackHandler`/`useColorScheme`; sync storage |
| 7 | [toolchain](toolchain.md) | Two vite builds (`@octanejs/vite-plugin` / `@nativescript/vite`+`vite-octane`); pinned matrix; patch-package accepted |

## File conventions

```
Foo.tsrx            shared (both renderers) — components, screens
Foo.web.tsrx        web leaf               — DOM intrinsics
Foo.native.tsrx     native leaf            — NS intrinsics
Foo.ios.tsrx        iOS-only divergence    — rare (<5% target)
app/_layout.tsrx    per-platform nav shell (expected split)
*.ts                hook-free logic only   — hooks need .tsrx/.tsx in glob
```

Dialect: `.tsrx` everywhere for owned files (auto-owned by extension; `@try`
is the portable boundary). `.tsx` allowed for directive-free files.

## Config surface (what an app writes)

```ts
// apps/native/vite.config.ts
import { octaneConfig } from '@nativescript-community/vite-octane';
export default octaneConfig({
  // + our config helper asserting:
  //   renderers.rules include: 'src/**/*.{tsx,tsrx}', 'packages/**/*.{tsx,tsrx}'
  //   nativescript.validation: { forbiddenGlobals, forbiddenImports, textHosts, hostProps }
  //   resolve.extensions: ['.ios.tsrx','.native.tsrx','.tsrx', …full chain…]
});
// apps/web/vite.config.ts — @octanejs/vite-plugin + '.web' chain
```

Entries: web `createRoot(el)`; native `Application.run({create})` +
`setWindowContentResolver` + `import.meta.hot?.dispose` cleanup.

## The load-bearing rules (invariants)

1. One element vocabulary per file — splits happen at `.web`/`.native`
   boundaries, never inline.
2. Hooks only in `.tsrx`/`.tsx` under a renderer rule — `.ts` helpers get
   validated not compiled, and their slotted helpers resolve to the DOM
   runtime.
3. One `octane` copy per app (dedupe enforced).
4. No DOM globals in shared code — enforced by `validation.forbiddenGlobals`
   on native-owned files + lint on shared.
5. Universal-subset APIs only in shared code — `@try`/`@pending`/`@catch` for
   boundaries; no `<Suspense>`/`createRoot`/portals/`<style>` blocks.
6. Bare text only inside text hosts (`Text`, `Button`) — enforced by
   `validation.textHosts`/`textParents`.
7. Styles: `className`+tokens for static; `style` objects (dip) for dynamics.
8. Animation/gesture writes are imperative; app state stays declarative.

## Hello world, both targets (the walkthrough)

```tsx
// app/index.tsrx — shared screen
export function Home() {
  const [count, setCount] = useState(0);
  return (
    <Column className="flex-1 items-center justify-center gap-4">
      <Text className="text-xl font-bold">Count: {count as string}</Text>
      <Pressable onPress={() => setCount(count + 1)}
                 className="bg-primary rounded-lg px-4 py-2">
        <Text className="text-onprimary">Increment</Text>
      </Pressable>
    </Column>
  );
}
```

- Web: `Column`→flex-col `div`, `Text`→`span`, `Pressable`→`div`+pointer
  events; Tailwind classes live.
- Native: `Column`→`flexboxlayout`, `Text`→`label` (text fold),
  `Pressable`→`contentview`+`tap` (TouchManager gives the press-scale);
  `@nativescript/tailwind` classes live.
- One save → hot-updates web tab and device simultaneously.

## Known leaks (the seams we consciously ship)

| Leak | Mitigation |
|---|---|
| Context doesn't cross modal/overlay/list-cell roots | `component`+`params` contract; shared store modules |
| NS rich text is flat (no nested styled spans) | `TextContext` accumulates classes; driver extension (#25) |
| `transition` property absent; keyframes animate 12 props | JS animation facade; keyframe classes for loops |
| `view.animate` cancel hangs pending on iOS; absolute destinations | facade owns value tracking + cancel semantics |
| Controlled input write-back may fight cursor/IME | lab experiment queued; leaf-level `text===value` guard |
| `className` swap can leave stale native backgrounds | driver `''`-then-set patch (patch-package) |
| Grid has no `gap`; NS `%` differs from web | per-cell margins; documented traps in css matrix |
| `line-height` semantics differ (additive vs box) | token files carry both values |
| `.ts` hooks bind DOM runtime on native | lint rule + validation; `.tsrx` for hooks |
| Component factories can't use JSX/inline `@{ }` — universal elements need the compiler-stamped component mark | `defineUniversalComponent`+`universalComponent` in the leaf (Exp 16); blessed factory API = upstream candidate |
| `ref` is runtime-reserved on component elements | leaves expose `bind` → forwarded to the intrinsic's `ref` (Exp 13) |
| `pointermove` not delegated by the DOM renderer | gesture leaves attach raw listeners via `bind` (Exp 17) |
| `exports` wildcards don't extension-resolve (tsc + vite both) | barrels are the deep-import contract (Exp 15) |

## Remaining risk register (lab-queued, Silo `experiments`)

1. Per-cell-root ListView cost — could push to `collectionview` plugin or a
   pooled-root scheme.
2. Controlled-input cursor/IME on both OSes — echo suppression verified
   (driver patch); real-IME cursor position still unmeasured.
3. Two dev servers over one tree (watcher contention) — observed: concurrent
   `ns build` invocations collide on the shared Xcode DerivedData
   (`build.db` locked → exit 65); serialize or isolate DerivedData.
4. Treeshake cleanliness of platform modules.
5. ~~`resolve.extensions` merge ordering vs octane plugin's own list~~ —
   resolved: explicit `extensions` array in app config is authoritative
   (iOS sim runs green with the full suffix chain).
6. ~~`tsrx-tsc` honoring `moduleSuffixes` for `.tsrx`~~ — resolved:
   `moduleSuffixes` + `paths` typecheck suffix files under both programs.
7. `getCssVariable` timing + theme propagation into modal/keyboard windows —
   `useColorScheme` verified (`systemAppearanceChanged` → re-render); modal
   window token inheritance still unmeasured.
8. A11y prop parity map (NS roles ↔ ARIA) — `accessible`/`accessibilityLabel`/
   `accessibilityRole` verified landing on native views.

## Build order (prototype → v1)

1. Skeleton app: two vite configs, `resolve.extensions` chains, dual tsconfig,
   renderer rules + validation — "hello" on web + device.
2. `View`/`Column`/`Text`/`Pressable` leaves + token stylesheet.
3. `List` (per-cell roots) + `TextInput` (controlled) — the two risk items.
4. `Modal`/`Overlay` via `showModal`/`RootLayout` bridges.
5. Route table + `Link` + `_layout` shells; `useBackHandler`.
6. Animation facade + gesture normalization.
7. seam lints + dual `tsrx-tsc` CI + mock-host driver tests.
8. `styled()` variants, `Icon`, `SafeArea`, commodity primitives.
