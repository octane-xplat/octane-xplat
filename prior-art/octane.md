# Octane (octanejs/octane)

> Status: beta. ~1.4k stars, very active (1.4k+ commits). Successor to Inferno, by
> Dominic Gannaway. React's programming model, compiled — no VDOM, compiler emits
> direct host code. Verified against source @ octane 0.4.0 (2026-09 clone).

## The two halves that matter to us

**DOM build** (`octane`, `src/index.ts`): `createRoot(domNode)`,
SSR/streaming/hydration, `<Hydrate>`, portals, delegated DOM events, controlled
form components, `class`/`className` clsx composition, scoped `<style>` blocks,
React compat boundaries (`ReactCompat`/`OctaneCompat` via `octane/react`),
`Suspense`, `ErrorBoundary`, `ViewTransition`, resource hints (`preload`…).

**Universal build** (`octane/universal/native`, `src/universal-native.ts` →
`src/universal-core.ts`): host-neutral runtime with zero DOM dependency. This is
what NativeScript consumes.

### The universal export surface (verified — the shared-code allowlist)

`universal-core.ts` (~14k lines) exports everything below. These are the imports
legal in shared code (modulo the ones that are compiler-facing):

- **Hooks, complete set**: `useState`, `useLinkedState`, `useReducer`,
  `useInsertionEffect`, `useLayoutEffect`, `useEffect`, `useMemo`, `useCallback`,
  `useRef`, `useId`, `useSyncExternalStore`, `useDeferredValue`, `useTransition`,
  `useActionState`/`useFormState`, `useFormStatus`, `useOptimistic`, `useContext`,
  `use`, `useImperativeHandle`, `useEffectEvent`, `useDebugValue`, `useBatch`.
- **Components/values**: `memo`, `lazy`, `createPortal` (→ `UniversalPortalValue`,
  capability-gated — driver must implement portal support; NS driver does not),
  `Activity`, `startTransition`, `requestFormReset`, `createContext` (native
  variant: DOM-free, `NativeUniversalContext`), `universalKey`.
- **Compiler lowerings**: `universalPlan`, `universalValue`, `universalList`,
  `universalProps`, `universalComponent`, `universalChildren`, `universalIf`,
  `universalSwitch`, `universalFor`, `universalTry`, `universalContext`,
  `universalActivity`, `rendererRegion`, `defineUniversalComponent`,
  `hmrUniversalComponent`, `markUniversalHostComponent`.
- **Roots/driver plumbing**: `createUniversalRoot<Container, PublicInstance>`,
  `createObjectContainer`, `createObjectDriver` — a built-in **object renderer**
  (`renderer = 'object'`) usable as the mock host in tests.
- Slot helpers (`createSubSlot`, `subSlot`), `manualHook`/`invokeManualHook`/
  `withSlot`, `hookSlots` (emitted by the plain-module hook slotter).

**Notably absent vs the DOM entry**: `Suspense` (component — async boundaries on
universal come from `@try`/`@pending`/`@catch`, lowered to `universalTry`; the
internal `UniversalSuspense` machinery + `canHandleSuspense` exist), `Fragment`
(fragments lower to list/children values), `ErrorBoundary` (→ `@try`/`@catch`),
`createRoot`/`hydrateRoot`/`flushSync`/`act` (DOM roots), `ViewTransition`,
`Hydrate`, `createElement`/`Children`/`isValidElement`, resource hints,
`attachBehaviorRoot`, `trustHTML`, `createResizeObserver`.

> SSR note: universal renderers declare `server: 'unsupported'` — universal
> targets can't server-render ("cannot be 'render' until the universal renderer
> provides a validated server serializer"). Shared files compiled under DOM get
> SSR normally; the native build has no server half by design.

## Renderer configuration (the `renderers` compiler option)

`octane/compiler/renderers` (`src/compiler/renderers.js`) is dependency-free
serializable config, normalized once and cached by signature:

```ts
{
  registry: {
    dom: { module: 'octane', target: 'dom', server: 'render', text: 'host' },  // built-in, cannot be replaced
    nativescript: { module: '@nativescript-community/octane', target: 'universal',
                    server: 'unsupported', intrinsics: '@nativescript-community/octane',
                    text: 'host', /* validation?, firstScreenEvents?, threadFunctionsModule? */ },
    // …arbitrary renderers; a 'valdi' target also exists (client-only writer)
  },
  default: 'dom',                       // renderer for files no rule owns
  rules: [                              // first matching rule wins
    { include: 'src/**/*.{tsx,tsrx}', exclude: [...], renderer: 'nativescript' },
  ],
  boundaries: {                         // cross-renderer prop regions
    'some/module': { Canvas: { ownerRenderer: 'dom', childRenderer: 'universal', prop: 'children', server?: 'omit-child' } },
  },
}
```

- `resolveRendererForFile(config, filename)` — first matching rule wins; globs
  are filename patterns (`**`, `*`, `?`, `[]`, braces expand; `!` → use
  `exclude`; `..` forbidden). **No extension restriction** — a rule may match
  `.tsrx` as easily as `.tsx`.
- **`boundaries`**: a module export (e.g. `Canvas`) declares that one prop
  (e.g. `children`) is compiled for _another_ renderer — the mechanism for
  renderer islands (`@octanejs/three`'s canvas-in-DOM). `server: 'omit-child'`
  allowed when owner is `render` and child is `client-only`.
- **`validation`** per renderer — **compile-time seam enforcement, built in**:
  `forbiddenGlobals` (e.g. `document`, `window`), `forbiddenImports`,
  `hostProps` (allowed attrs per host tag, `*` wildcard + `prefix*` patterns),
  `textHosts` / `textParents` (which elements may bear/contain text).
- **`firstScreenEvents`**, **`threadFunctionsModule`** + `main-thread:` prop
  namespace + `UniversalHostBinding`/transport protocol (`UNIVERSAL_TRANSPORT_PROTOCOL_VERSION`,
  commit/abort/ack/reject/fault/event messages): the remote-driver surface —
  renderer can run behind a transport boundary (worker/server). Not needed for
  NS (direct driver), but it's how `valdi` works.

## Compilation ownership

- `OCTANE_EXTENSIONS = ['.tsrx', '.tsx']` — only these get full compilation.
- `requireDirective` mode: `.tsrx` is Octane's by extension; `.tsx`/`.ts`/`.js`
  need a leading `/** @jsxImportSource octane */` (or a registered renderer's
  `intrinsics` module id) pragma. `exclude` fragments beat pragmas (for routing
  `.tsrx` to foreign tsrx compilers like `@tsrx/react`).
- Plain `.ts`/`.js` modules get **hook slotting** (not full compile) via
  `slotHooks` when pragma-marked / installed-package-owned: injected helper
  imports are emitted as `from 'octane'` **literally** — under a universal
  renderer rule the file is _validated_ (`validateRendererModuleSource` —
  forbidden globals/imports enforced) but its hook helpers still resolve to the
  `octane` module id, so without an `octane`→universal alias, `.ts` hooks bind
  the DOM runtime. Rule stands: **no hooks in `.ts` for native**, unless an
  alias makes `octane` resolve to the universal build (hook helpers like
  `hookSlots` do exist there — plausible upstream improvement).
- The vite plugin sets `resolve.extensions` to
  `['.mjs','.js','.mts','.ts','.jsx','.tsx','.json','.tsrx']` — extensionless
  imports of components resolve like React's `.tsx`.

## The universal plan → driver contract

Compiler emits per renderer-owned file a static plan:

```
universalPlan("nativescript", {
  kind: "host", type: "gridlayout", props: { rows: "*,auto" },
  children: [{ kind: "host", type: "label", bindings: [["row", 0]], … }]
})
```

Plan nodes: `host`, `text`, `slot`, `range`, `component`, `if`, `switch` +
values for `for`/`try`/`context`/`activity`/`keyed`/`portal`/`list`. At runtime
a batch of host commands is produced for the **driver** to apply. Writing a
renderer = writing a driver + element registry + JSX typings
(`@octanejs/three` precedent; `@nativescript-community/octane` the NS one).

Class composition: `class={['row', on && 'danger']}` is composed clsx-style —
the compiler lowers statically-analyzable arrays to string concatenation
(allocation-free, identity-comparable slots); everything else falls back to
runtime composition. Either way the **driver receives a string**.

## HMR model (verified)

Every compiled component module is **self-accepting**: exports are wrapped in
`hmrUniversalComponent` and the module emits `import.meta.hot.accept` (Vite
dialect; `webpackHot` for Rspack). The accept callback hands the fresh export
to the wrapper held by the module's _first_ evaluation, which swaps the render
function and schedules live owners — hook state survives. Edits to
non-accepting modules propagate up the reverse import graph to the nearest
accepting importer; an edit nothing accepts (entry, driver) reloads the module
graph in-process. Components keyed by export name (`'default'` or the name) in
`import.meta.hot.data.__octaneComponents`.

## Language surface

- Standard JSX (`.tsx`) runs as-is.
- `.tsrx` adds template directives — `@if`, `@for` (keyed, per-item hook state),
  `@switch`, `@try`/`@pending`/`@catch` — and `@{ … }` setup blocks; `function
f() @{ … }` shorthand; dynamic text needs `{expr as string}`.
- Hooks: React API, call-site slot tracked (no rules-of-hooks), compiler-derived
  dep arrays, `[state, update, getState]` triples.
- `use()` starts provably-independent fetches together, suspends once per
  stratum.
- Refs as props: `ref={cb}`, `ref={obj}`, `ref={[a,b]}`.
- Events: delegated real DOM events on web; `event` host commands on universal.
- Typecheck with `tsrx-tsc --noEmit` (not plain `tsc`); `.tsx` files carry the
  `@jsxImportSource octane` pragma.

## Packages of interest

- `octane` — runtime + compiler (`octane/compiler`, `octane/compiler/vite`)
- `@octanejs/vite-plugin` — Vite integration; forwards `renderers` into
  `compiler.renderers`; own resolveId only claims virtual/adapter ids
- `@octanejs/three` — non-DOM renderer precedent
- `@octanejs/*` bindings — DOM-free ones (zustand, tanstack-query, i18next,
  state libs) should run under universal; DOM-touching ones are web-only.
  Apps compile bindings from source — portable iff no DOM globals at module scope.

## Version coupling

`octane` peer range + `@octanejs/vite-plugin` compile range +
`@nativescript-community/octane` peer (`octane >= 0.1.51`, universal ABI
unchanged through 0.2.2) + `@nativescript/core >= 9.1` + single copy of `octane`
per app (hooks bind to the runtime that owns the root). A pinned version matrix
is a hard requirement — see [`../docs/toolchain.md`](../docs/toolchain.md).
