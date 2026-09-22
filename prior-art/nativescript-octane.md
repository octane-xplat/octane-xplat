# @nativescript-community/octane (+ vite-octane)

> Repo: `nativescript-community/octane` — very early (7 commits at time of
> writing). Two packages. Reference app: `NathanWalker/ns-octane` (a ChatGPT-style
> chat client — its README is effectively the port's design doc).

## Packages

| Entry | Role |
|---|---|
| `@nativescript-community/octane` | `renderNativeScriptApp`, `createNativeScriptRoot`, `UniversalHostDriver` (host commands → `@nativescript/core` views), element registry |
| `…/octane/config` | Serializable renderer metadata consumed by the Vite plugin |
| `…/octane/intrinsics` | JSX element/attr types derived from core view classes |
| `…/octane/jsx-runtime` | What `jsxImportSource` resolves to |
| `@nativescript-community/vite-octane` | `octaneConfig()` helper for `@nativescript/vite`; scopes `@octanejs/vite-plugin` to the NS renderer; on-device HMR strategy |

## Element vocabulary

Tags = lowercase `@nativescript/core` view class names:
`absolutelayout actionbar actionitem activityindicator button contentview
datepicker docklayout flexboxlayout formattedstring frame gridlayout htmlview
image label liquidglass listpicker listview navigationbutton page placeholder
progress proxyviewcontainer rootlayout scrollview searchbar segmentedbar
segmentedbaritem slider span stacklayout switch tabview tabviewitem textfield
textview timepicker webview wraplayout`

Unknown/camelCase tags = **type error**, not silent failure.

- **Props are view properties** — assigned onto the instance. Anything the class
  exposes (`row`, `colSpan`, `iosOverflowSafeArea`, …) is a prop.
- `className` + string `style` → NativeScript CSS system. Object `style` →
  assigned onto `view.style`.
- Events: `on` + NS event name (`onLoaded`, `onItemTap`), web aliases:
  `onTap`/`onClick`/`onPress` → `tap`, `onDoubleTap`, `onLongPress`,
  `onChange` → `textChange`, `onSubmit` → `returnPress`.
- **Text is a host node.** `<label>Hi {name}</label>` lowers to `#text`
  children; the driver folds them into the parent's `text` prop. NS has no text
  nodes. `formattedstring`/`span` exist for rich inline text.
- `hostSlot="mainContent"` — parents that wire children through properties
  (drawer's `mainContent`/`leftDrawer`) instead of `addChild`.
- `registerElement('drawer', Drawer)` + module augmentation of
  `NativeScriptElements` for plugin views. Re-registering a tag with a different
  class **recreates live instances in place** (props/listeners/children carried)
  — that's how element modules hot-reload. Keep registrations in modules that
  self-accept: `import.meta.hot?.accept()`.

## Driver contract subtleties (each learned from a vanished subtree)

- `update` merges — it carries only the dynamic-prop snapshot; static props
  arrived at `create`. Replacing instead of merging strips layout props on first
  update.
- Native events during a commit are deferred to a microtask — attaching a
  subtree fires `loaded` synchronously, before the batch's listener is live.
- Detach is defensive: `LayoutBase.removeChild` throws on unattached views.
- `hidden` → `collapse` (removes from layout AND screen).

## App boot / windows

```ts
Application.setWindowContentResolver(({ window, isPrimary }) =>
  isPrimary ? undefined : createWindowContent(window));
Application.run({ create: () => createWindowContent(Application.primaryWindow) });
```

One root per `NativeWindow` (iPad scenes, CarPlay) sharing one component wrapper,
so HMR hits all roots.

## HMR

`ns debug ios|android` → Vite dev server, app boots over HTTP ESM (NS 9.1+).
Compiler wraps components in `hmrUniversalComponent` + emits `import.meta.hot.accept`.
Three save outcomes: in-place component accept (hook state survives), propagation
to nearest accepting importer, or full in-process re-import (vendor stays warm).

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
- CSS trap: `vertical-align`, not `vertical-alignment` — wrong property names
  are **dropped silently**.
- `iosOverflowSafeArea="false"` on docked UI to keep core from smearing
  backgrounds into the home-indicator zone.
- patch-package is part of the workflow (`patches/` applied on postinstall).

## Peer versions

`octane >= 0.1.51` (universal ABI unchanged through 0.2.2), compiled by
`@octanejs/vite-plugin >= 0.1.51`; `@nativescript/core >= 9.1.0`.
