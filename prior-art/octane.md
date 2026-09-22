# Octane (octanejs/octane)

> Status: beta. ~1.4k stars, very active (1.4k+ commits). Successor to Inferno, by
> Dominic Gannaway. React's programming model, compiled — no VDOM, compiler emits
> direct host code.

## The two halves that matter to us

**DOM build** (`octane`): `createRoot(domNode)`, SSR/streaming/hydration,
`<Hydrate>`, portals, delegated DOM events, controlled form components,
`class`/`className` clsx composition, scoped `<style>` blocks, React compat
boundaries (`ReactCompat`/`OctaneCompat` via `octane/react`).

**Universal build** (`octane/universal/native`): host-neutral runtime with zero
DOM dependency, built for JS environments without DOM globals. This is what
NativeScript consumes.

### The renderer ABI

The compiler emits, per renderer-owned file, a static plan rather than an element
tree:

```
universalPlan("nativescript", {
  kind: "host", type: "gridlayout", props: { rows: "*,auto" },
  children: [{ kind: "host", type: "label", bindings: [["row", 0]], … }]
})
```

At runtime the plan becomes a batch of `create` / `update` / `insert` / `event` /
`destroy` commands applied by a **host driver**. Writing a renderer = writing a
driver + element registry + JSX typings. `@octanejs/three` is the existing
precedent for a non-DOM renderer; `@nativescript-community/octane` follows the
same shape (see [nativescript-octane.md](nativescript-octane.md)).

Key consequence: **renderer ownership is decided per file, at compile time**, via
the bundler plugin (`renderers: nativeScriptRenderers({ include: 'src/**/*.tsx' })`).
The compiler rewrites the `octane` import in owned files; a hook imported from a
non-owned `.ts` module binds a second runtime copy whose dispatcher is never
active. Files that call hooks must live inside the renderer's include glob.

## Language surface

- Standard JSX (`.tsx`) runs as-is.
- `.tsrx` adds template directives — `@if`, `@for` (keyed, per-item hook state),
  `@switch`, `@try` — and `@{ … }` setup blocks next to output.
- Hooks: React API (`useState`, `useEffect`, `useMemo`, …), call-site tracked (no
  rules-of-hooks), compiler-derived dep arrays when omitted, `[state, update,
  getState]` triples.
- `use()` on promises in render; Suspense; transitions; `useLinkedState`.
- Refs as props: `ref={cb}`, `ref={obj}`, `ref={[a,b]}`.
- Events: real delegated DOM events on web; on the universal runtime, host
  commands carry `event` bindings the driver maps to native events.

## What is probably DOM-only (verify before relying in shared code)

| API | DOM? | Universal? |
|---|---|---|
| `createRoot`, hydrate, SSR/streaming, `<Hydrate>` | yes | no — native uses `renderNativeScriptApp`/`createNativeScriptRoot` |
| portals | yes | unknown — check ABI |
| `<style>` blocks, `class` composition | yes | `className` handled driver-side (NS CSS); `<style>` blocks likely web-only |
| controlled form semantics (`value`/`checked`, `onInput`/`onChange`) | yes | driver maps `onChange`→`textChange` etc.; controlled `text` behavior needs verification |
| `ReactCompat` | yes | no (react-dom dependency) |
| `useState`, hooks, context, Suspense, `@for`/`@if` | yes | yes — universal runtime owns these |

→ The shared-code rule derived from this table lives in
[`../docs/architecture.md`](../docs/architecture.md); tracking the exact export
delta between `octane` and `octane/universal/native` is
[an open question](../docs/open-questions.md).

## Packages of interest

- `octane` — runtime + compiler (`octane/compiler`, `octane/compiler/vite`)
- `@octanejs/vite-plugin` — Vite integration; declares the `octane` range it
  compiles for (0.1.52 pairs with octane 0.2.x — pin carefully)
- `@octanejs/three` — the non-DOM renderer precedent worth reading
- `@octanejs/*` bindings — React-ecosystem ports. DOM-free ones (zustand,
  tanstack-query, i18next, state libs) should run under the universal runtime;
  DOM-touching ones (radix, motion, floating-ui, lucide) are web-only.
  Apps compile bindings from source, so a binding is portable iff it avoids DOM
  globals at module scope.

## Version coupling

`octane` peer range + `@octanejs/vite-plugin` compile range +
`@nativescript-community/octane` peer (`octane >= 0.1.51`, universal ABI unchanged
through 0.2.2) + `@nativescript/core >= 9.1` + single copy of `octane` per app
(hooks bind to the runtime that owns the root). A pinned version matrix is a hard
requirement — see [`../docs/toolchain.md`](../docs/toolchain.md).
