# @nativescript-community/octane (+ vite-octane)

> Repo: `nativescript-community/octane`. Two packages. Reference app:
> `NathanWalker/ns-octane` (a ChatGPT-style chat client — its README is
> effectively the port's design doc). Verified against source (2026-09 clone);
> the whole driver is 553 lines — read `packages/octane/src/driver.ts`.

## Packages

| Entry                                 | Role                                                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@nativescript-community/octane`      | Root doubles as the renderer ABI: re-exports all of `octane/universal/native` plus `createNativeScriptRoot`, `nativeScriptDriver`, `renderNativeScriptApp`, `ELEMENTS`, `eventNameFor`, `onElementReplaced`, `registerElement` |
| `…/octane/config`                     | `nativeScriptRenderers()` → the serializable `renderers` config for `@octanejs/vite-plugin`                                                                                                                                    |
| `…/octane/intrinsics`                 | JSX types derived from `@nativescript/core` class typings                                                                                                                                                                      |
| `…/octane/jsx-runtime`                | Types-only module for `jsxImportSource` (Octane compiles JSX itself)                                                                                                                                                           |
| `@nativescript-community/vite-octane` | `octaneConfig()` = `baseConfig({flavor:'octane'})` + `octane({renderers: nativeScriptRenderers(), …})`; on-device HMR strategy                                                                                                 |

## The driver (`driver.ts`) — verified contract

**Commands handled**: `create`, `recreate`, `update`, `insert`, `move`,
`remove`, `destroy`, `event`, `visibility`. No portal op — `resolveParent`
treats a non-numeric parent as root (**portals not enabled**). Declared
capabilities: `{ text: 'host', visibility: true }` in this workspace's patch
for 0.2.1. The upstream 0.2.1 package predates the universal runtime's
retained-Suspense visibility command, so the patch maps `visibility` to
NativeScript's `visible`/`collapse` values.

**Prop application** (`setProp`):

- `children`/`key`/`ref` skipped; `on[A-Z]*` skipped (arrive as `event`
  commands).
- `className`/`class` → `view.className = String(value)` — composition already
  done compiler-side (clsx-style, see prior-art/octane.md).
- `style`: string → `view.setInlineStyle(value)` (CSS declaration string);
  object → `Object.assign(view.style, value)` — **NS `Style` semantics:
  camelCase keys, dip units**.
- Everything else → direct `view[name] = value`. Anything the class exposes is
  a prop; wrong names fail silently at native level.

**Text folding**: `#text` host nodes carry no view; `syncText` concatenates a
text node's `#text` children into the parent's `text` prop — **but only when
the parent view `instanceof TextBase`**. `#text` under a non-text view
(e.g. `stacklayout`) is silently dropped. Rich inline text =
`formattedstring`/`span` nesting (`TextBase` accepts a `FormattedString`
child → `formattedText`; `FormattedString` accepts `Span` children via
`spans.splice`).

**Parenting** (`addViewChild`, order matters): `hostSlot` property wiring
first → `LayoutBase.insertChild` → `ContentView.content` →
`FormattedString`+`Span` → `TextBase`+`FormattedString` →
`ActionBar.titleView` → else **throw** (`cannot host a <x> child`).

**Events**: `event` commands → `view.on(type, handler)`; `EVENT_PROP` names map
through `eventNameFor` (aliases below); during a commit batch, deliveries are
deferred to a microtask (NS fires `loaded` synchronously mid-attach, before
the listener is live); dispatch failures go to the root's `onUncaughtError`
callback (and are rethrown when no callback is registered), rather than being
silently dropped.
`events.classify` gives every event priority `'discrete'`.

**Element registry** (`elements.ts`): `ELEMENTS` map tag→constructor; 40+
builtins incl. `liquidglass`. `registerElement` re-registration fires
`onElementReplaced` → driver **recreates every live instance in place**
(props/listeners/children carried) — that's how plugin-view modules hot-reload
without remounting.

**Roots**: `createNativeScriptRoot(host: ViewBase)` →
`createUniversalRoot(container, nativeScriptDriver, { scheduleMicrotask })`.
`renderNativeScriptApp(host, App, props)` = create + `root.render(component,
props)`. Containers tracked in a `Set`; `unmount` releases.

## Intrinsics (`intrinsics.ts`) — the type surface

- `ViewProperties<T>` = non-function members of the NS class → all settable
  view properties are JSX attrs, tracking `@nativescript/core` versions for
  free.
- `DerivedEvents` — `static <name>Event` declarations → `on<Name>` handlers
  receiving `EventData & { object: T }`.
- `CommonEvents` — gesture props on every view: `onTap`/`onClick`/`onPress`
  (→`tap`), `onDoubleTap`, `onLongPress`, `onSwipe`, `onPan`, `onPinch`,
  `onRotation`, `onTouch`; aliases `onChange`→`textChange`,
  `onSubmit`→`returnPress`; `onFocus`/`onBlur`.
- `CommonAttributes` — `className`/`class`, `style` (string | `Partial<Style>`),
  `hostSlot`, and the attached layout props (`row`, `col`, `rowSpan`,
  `colSpan`, `dock`, `left`, `top`, `flexGrow`, `flexShrink`, `flexWrapBefore`,
  `alignSelf`, `order`).
- `OctaneAttributes` — `key`, `ref` (callback | `{current}` | array),
  `children`.
- Extension = module augmentation: `declare module
'@nativescript-community/octane/intrinsics' { interface NativeScriptElements
{ drawer: Attributes<typeof Drawer> } }` and `CommonAttributes` for
  plugin-registered view-wide props.

## Renderer config (`config.ts`)

```ts
nativeScriptRenderer = {
  module: '@nativescript-community/octane',
  target: 'universal',
  server: 'unsupported',        // no server half of an NS app
  intrinsics: '@nativescript-community/octane',  // pragma id that claims the renderer
  text: 'host',
}
nativeScriptRenderers({ include = 'src/**/*.tsx' }) → { registry, rules }
```

Rules own `.tsx` (or whatever the glob covers — `.tsrx` works); plain `.ts`
under the rule is _validated_ not compiled (see prior-art/octane.md).

## App boot / windows (ns-octane/src/index.ts)

```ts
Application.setWindowContentResolver(({ window, isPrimary }) =>
	isPrimary ? undefined : createWindowContent(window),
) // secondary windows
Application.run({ create: () => createWindowContent(Application.primaryWindow) })
// entry ends with import.meta.hot?.dispose(() => { …unmount all roots… })
```

One root per `NativeWindow` (iPad scenes, CarPlay), sharing one wrapped
`App` so HMR hits all roots. `Page` per window; `page.androidOverflowEdge =
'top,bottom'` for edge-to-edge; screens pad their own chrome from safe-area
insets. Entry also installs: `@nativescript-community/gesturehandler`,
`TouchManager.enableGlobalTapAnimations` (built-in press-scale on every
tappable view — the free `Pressable` feedback).

## HMR (vite-octane client strategy)

Compiler makes every component module self-accepting; the client strategy
sequences the registry: drain outgoing disposes → evict → re-import → fire the
**first evaluation's** anchored accept callback (the live wrapper) with the
fresh namespace. Non-accepting edits propagate up the reverse import graph to
nearest accepting importer; entry/driver edits reload the module graph
in-process (vendor stays warm).

## Lessons from ns-octane (the reference app)

- **Tailwind v4 via `@nativescript/tailwind` works** — auto PostCSS chain, skip
  preflight. Design system = semantic classes + `ns-dark` overrides.
- SF Symbols via an `<image>` wrapper (`sf-icon.tsx`); Android falls back to
  font icons. `tint-color` inherits through CSS.
- Modals/sheets = a **second Octane root** inside `UISheetPresentationController`
  via `showModal` — not a portal.
- Keyboard composer = `@nativescript/input-accessory` + patched plugin; composer
  lives in the keyboard's own window → appearance changes don't reach it
  automatically (`systemAppearanceChanged` → manual `_onCssStateChange` walk).
- `visibility` swapping over mount/unmount inside plugin-managed containers.
- Drawer choreography via `translationFunction`/`animationFunction` — imperative
  `Object.assign` onto views per frame (the gesture-linked animation seam).
- CSS trap: `vertical-align`, not `vertical-alignment` — wrong property names
  are **dropped silently**.
- `iosOverflowSafeArea="false"` on docked UI to keep core from smearing
  backgrounds into the home-indicator zone.
- patch-package is part of the workflow (`patches/` applied on postinstall).

## Peer versions

`octane >= 0.1.51` (universal ABI unchanged through 0.2.2; local clone reads
0.4.0), compiled by `@octanejs/vite-plugin >= 0.1.51`; `@nativescript/core >=
9.1.0`.
