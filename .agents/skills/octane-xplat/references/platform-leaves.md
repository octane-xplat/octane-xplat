# Platform files — the file-boundary system

A **platform leaf** is one implementation of a module, selected for a target
through the same import as its sibling implementations.

## Resolution order

The unsuffixed module is the native default. Platform-specific files override
it:

- **Web:** `.web.*` → unsuffixed.
- **iOS:** `.ios.*` → `.mobile.*` → unsuffixed.
- **Android:** `.android.*` → `.mobile.*` → unsuffixed.
- **macOS / Windows native:** `.macos.*` / `.windows.*` → unsuffixed.
- **Linux GTK:** `.gtk.*` → unsuffixed (GTK4/GJS host).
- **Linux workshop (GTK):** `.gtk.*` → unsuffixed; the GTK renderer hosts chrome and stories natively. `.stories.linux.*` is dropped from the linux catalog (rename to `.gtk`; keep `.web` for `--target web`). App-level `.linux.*` leaves remain the DOM/webview chain in `@xplat/linux`.

Use `.web` for browser-specific APIs or markup, `.mobile` when iOS and Android
share an implementation that differs from the native default, and an OS suffix
when only that OS differs. There is no generic `.native` or `.desktop`
filename tier. If an unsuffixed module uses NativeScript APIs and web imports
it, add a `.web` sibling so the browser build selects that implementation.

Vite selects the active platform at build time. A scaffold's TypeScript program
checks all variants together with a fixed, extensionless-first suffix order;
that order does not change the runtime resolver.

Choose the actual renderer before adding a desktop variant. Desktop hosts are
experimental; native GTK and DOM webviews are different targets. Read
[GTK setup](../../../../docs/platform/linux-gtk.md),
[macOS native](../../../../docs/platform/macos-native.md), or
[Windows setup](../../../../docs/platform/windows-setup.md) for host boundaries.
The [module-resolution guide](../../../../docs/platform/module-resolution.md)
explains the common suffix and JSX contract.

## Rules

1. A file speaks ONE element vocabulary. Browser implementations use DOM
   intrinsics in `.web` files; NativeScript implementations use NS intrinsics
   in `.mobile`, `.ios`, `.android`, or the unsuffixed native default.
   - **Import the unsuffixed basename** (`import { Card } from './Card'`) and
     let the resolver pick — never name a platform suffix in a shared import.
     Runtime branching (`isNative`, `Platform.OS`) swaps values inside one
     file; it cannot change which renderer owns the file or mix `<div>` with
     `<masonview>`. Divergent element vocabulary must be a file split.
2. **No DOM globals in native implementations** — lint's `xplat/no-dom-globals`
   rule enforces this. The browser-specific module owns `document`,
   `window`, `localStorage`, `HTMLElement`, and other DOM APIs.
3. **Hooks only in `.tsx`/`.tsrx`.** Plain `.ts` files: no hook calls
   (universal hooks get slotted by the compiler only in component files).
   `.ts` platform files are for stores/services — they just can't call hooks.
4. Keep exported props and return values compatible across variants. A caller
   should not need to know which file the resolver selected.
5. `.ios` and `.android` override `.mobile`; `.mobile` overrides the
   unsuffixed native default on both mobile OSes.

## Platform-authentic package subpaths

`@octane-xplat/ui/ios` and `/android` expose OS-widget-backed components;
`/web` is a web-conditioned compat surface (`HoverCard`/`Tooltip` moved to
the root barrel — decision #69). Keep an OS-only import
in its matching `.ios` or `.android` file. A `.mobile` file may import a
cross-platform native API only when that import loads safely on both iOS and
Android. The package's `/nativescript` subpath is NativeScript integration plumbing,
not a filename suffix; `/web` has a `web` export condition; Linux host presets choose their
conditions separately. Check the export map rather than guessing subpaths.
`@octane-xplat/ui` itself resolves a curated `gtk` condition. The current
primitive/layout subset and runnable example are listed in
[GTK setup](../../../../docs/platform/linux-gtk.md); check `index.gtk.ts`
before choosing another root export. Full UI parity is still in progress.
GTK source components mount through the renderer's `GtkRoot` binding from
`createGtkRoot` or `runGtkApp`; it checks component props while the preset
supplies runtime metadata. Do not cast app components to Octane's
compiler-facing `UniversalComponent` to work around opaque JSX declarations.
GTK refs remain Gtk.Widget instances. Measurement uses the renderer's
`getBounds()` app-content coordinates; do not infer global screen coordinates
or call NativeScript's `getLocationOnScreen()`. The GTK `useMeasure` leaf
subscribes through `on/off('layoutChanged')`, which also observes movement
from ancestor scrolling. The current imperative subscription vocabulary is
`loaded`, `unloaded`, `layoutChanged`, `scroll`, and `pan`; other names throw until qualified.
Use `useScrollableArea<HostElement>` with a GTK `scrollview` viewport, importing
the host type from `@octane-xplat/jsx/intrinsics`. The shared default generic is
`object`, whose ref cannot be spread onto strict GTK intrinsics. GtkAdjustment backs
the browser-shaped scroll metrics and offset methods; extent changes also emit
layout notifications. An ordinary `View` is not made scrollable by this hook.
ScrollableArea supports portable two-axis handles and block-axis refresh.
Its raw ref pan subscription uses numeric NativeScript states; public onPan
props retain the shared string states. Internal docking animate accepts only
translate/duration and resolves a status; use useAnimation for app motion.
getActualSize reports the untransformed border box, including CSS border.
Use GTK `useAnimation` or `setTranslate` for numeric motion. Ref transforms
and `view.style` feed a renderer-owned local style layer; assigning GTK's
read-only `width`/`height` properties does not animate layout. Supported numeric
keys are explicit in the renderer's `public-instance.ts`; unsupported numeric writes
throw. Local style values survive unrelated renders; deleting a local style key
restores authored styling. CSS keyframe samples retain higher priority.
For GTK adapters, retain the shared file's source extension: a shared
`pan.tsrx` needs `pan.gtk.tsrx`. The current GTK preset checks unsuffixed
`.tsrx` before `.gtk.ts`, so changing the extension can silently select the
shared host implementation.
`/macos` and `/linux` carry AppKit- and GTK-only contracts (for example
`useOutlineFromView` on `/macos`, `LinuxWindowHandle` on `/linux`) that are
deliberately kept off the shared root so `@octane-xplat/ui` exports the same
names on every target.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// PackedToggle.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackedToggle() {
	return <UISwitch value={false} onChange={console.log} />
}
```

## The barrel rule

Import from a package's declared entrypoint; a source-tree path is not a
public API. Conditional exports select the platform implementation. For example,
router operations live on `/routing` and stores on `/data`; `@xplat/app` is
repository harness code, not a consumer dependency.

```ts
import { router } from '@octane-xplat/ui/routing'
import { createStore } from '@octane-xplat/ui/data'

const packed = createStore(0)
router.push({ to: '/help' })
```

## tsconfigs

New apps use one `tsconfig.json` with `jsxImportSource: "@octane-xplat/jsx"`.
Browser JSX files explicitly select `@octane-xplat/jsx/dom` with a first-line
pragma. `bun run typecheck` checks `.tsrx` and every platform variant together.
A combined program resolves host handles as the shared `object` type — annotate the concrete view type at each ref declaration; a target-specific consumer
can bind concrete handles through `customConditions: ["native"]` or `["macos"]`.
Conditions bind host types only, never the intrinsic vocabulary.
For the JSX facade's type-only boundary and configuration examples, see
[JSX and host types](../../../../docs/platform/module-resolution.md#typescript).

## Platform constants

Do not invent `import.meta.env.PLATFORM`. Use file variants for OS APIs and
intrinsics. A leaf-resolved flag can select shared values: `@octane-xplat/ui` exports
`isNative` (`true` on iOS/Android, `false` on web) for render-time conditional
shared component props; OS-level divergence belongs in `.ios`/`.android` files, not
`isAndroid` branches in shared code.

```tsx
import { isNative, Text } from '@octane-xplat/ui'

export function HostLabel() {
	return <Text>{isNative ? 'Native host' : 'Browser host'}</Text>
}
```

GTK Icon uses the shared component and registry/provider contracts. Its
svg.gtk helper preserves sources for renderer-owned decoding; do not call
the shared svgSource helper directly in a GJS leaf because GJS lacks fetch/atob.
The image/svgview intrinsics own Gtk.Picture source cancellation, SVG
currentColor/custom-property tinting and texture disposal. HTTP sources load
Soup 3 lazily; local assets need no HTTP typelib. SVG requires an installed
GdkPixbuf SVG loader. res:// maps to registered GResource paths, not mobile
asset catalogs. Image's full placeholder/sizing contract remains unqualified.

GTK textfield refs implement .text/focus()/blur() for native text helpers.
Imperative .text writes preserve Unicode selections and suppress controlled
echoes. Keep GtkEditable.editable separate from widget sensitivity; read-only
does not mean disabled. The Entry wrapper's get_position() can return the
ordered selection bound for a backward range on GTK 4.14.5; use the renderer
protocol rather than duplicating selection logic. Input cancels pending repair.
TextInput, TextArea and SearchInput are curated GTK root exports with maintained
real-Linux fixtures. Use TextInput secure for passwords; TextArea rejects secure.
Field and FormLayout also use the shared native leaves. Keep their hosts and
FieldProvider position stable across direction changes; use Mason implicit
grid columns rather than NativeScript eachChildView/columns/col. Set the form
gap explicitly. Horizontal labels use per-field rows, without a shared label
column. InputGroup/InputGroupText are curated too: keep one width/state owner,
suppress a shared control ID for group labels, and normalize primitive addon
children through TextSlot. Grouped shells shrink within the row and the group
owns their shared border. GTK group roles remain nonfocusable; renderer role
recreation must retain child editors and their exact focus delegate. Remaining
form families still need qualification. FieldGroup and useFieldControl are
curated: keep the heading host stable when its text is removed, so conditional
labels do not move editor ownership. Custom controls inherit Field/FormLayout
defaults through the existing hook; preserve explicit size/name overrides and
native help composition.

GTK decorative CheckboxIndicator/CheckIndicator/RadioIndicator and the indicator
registry/hook are curated. Reuse their native leaves: svgview handles the
checkbox mark, Mason handles box/dot/dash geometry, and a label handles the
standalone check. Keep input/focus/state on the owning control. Registry
replacements must use useIndicator at each live reader; getIndicator is a
snapshot. Restore defaults with registerIndicators(defaultIndicators).

For GTK descriptor events, call the universal root's dispatchEvent directly.
It opens or inherits the proper scope; wrapping each listener's priority can
fail when focus/blur is emitted synchronously inside a discrete press.

GTK host integrations may use universal createPortal with a local multi-child
Gtk.Box/Fixed/Grid, the root layout host, or an owned Mason/viewless layout ref.
Use the same universal root to retain providers and component state; do not
mount a separate root for overlay content. Keep the target alive through portal
removal. External targets preserve foreign children, but CSS inherits from the
target ancestry rather than the source component's host ancestors. Single-child
widgets and transported targets fail explicitly. Use the curated Tooltip below for its intent integration; other UI overlays
remain unqualified. See the [portal example](../../../../docs/platform/linux-gtk.md#portals-for-gtk-host-integrations).

GTK Tooltip is a curated root export on GTK 4.14+. Use the same shared TooltipProps;
the .gtk leaf portals live content into a renderer-owned noninteractive GtkPopover.

GTK Popover is a curated root export on GTK 4.14+. Its .gtk leaf holds open
state in Octane, asks the anchor's public instance for a nonmodal GtkPopover
session (autohide false, has_arrow false) and portals live children into the
session's Gtk.Box through the original universal root — context, state and
effects are preserved. Placement runs positionPopover per anchor tick and
points the popup at a computed zero-size Gdk.Rectangle; dismissal authority
(Escape/outside tap, controlled vs uncontrolled) stays in layer-stack through
the shared popup-events hub, not autohide. Focus is captured on open and
restored on close (finalFocusRef wins); sessions, tick callbacks and the
refcounted display CSS provider are released on dispose. See
[the popover example](../../../../docs/platform/linux-gtk.md#popovers) and
[upstream record](../../../docs/notes/linux-gtk-renderer.md#gtk-popover-session-placement-and-qualification).
Focus opens only through a trigger that already accepts focus (for example a
native button/textfield); the wrapper does not invent an extra tab stop. Use a
focusable trigger when keyboard access matters. Timers, controllers, popup ticks,
scroll listeners and accessible description references are renderer-owned and
released on close/disposal. Keep UI leaves free of GI imports. Do not replace the
portal with a separate root, which loses providers. GtkAccessibleList.new_from_list
avoids the verified GTK 4.14.5 new_from_array guard bug; recheck on GTK upgrades.
See the [tooltip example](../../../../docs/platform/linux-gtk.md#tooltips) and
[upstream record](../../../docs/notes/linux-gtk-renderer.md#gtk-4145-accessible-list-constructor-guard).

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Tooltip } from '@octane-xplat/ui'

export function Help() {
  return <Tooltip trigger={<button text="Details" />} content="More information" />
}
```

GTK's nativeAccessibilityState adapter preserves the full record instead of
collapsing it to NativeScript's strongest enum state. The private native helper
accepts checked: 'mixed'; GTK preserves it while NativeScript retains its textual
Checkbox fallback. Custom Mason checkbox/switch roles are keyboard stops and
activate on Space release; buttons use Return/Space and links use Return.
CheckboxInput and Switch now have maintained public-root GTK field/action
checks as well. Reuse the shared leaves and retain their private NativeToggleField
owner; keep isEnabled behavior separate from accessibilityState metadata. The renderer applies flags
after the complete prop bag: sensitivity and GtkEditable editability agree with
the same generation. Missing flags reset old native metadata; native switch
checked state is restored when an override is removed. Keep behavior in
isEnabled/editable/checked and use accessibilityState for metadata. The current
shared TextInput forwards disabled/readOnly/required/busy/invalid fields without
a GTK copy. Its curated GTK field behavior is covered by maintained entry and chrome fixtures.

RadioList/RadioListItem add private radio/radiogroup semantics through this
adapter. Keep the GTK composite role rather than mapping it to generic group.
NativeScript's enum has no radio-group role; only that container uses the
documented inert fallback. The renderer keeps radio focus grouped on both
Mason and Gtk.Box hosts, with pointer focus independent of activation.

NumberInput uses the same native TextInput implementation through a persistent
field frame. Put the control id on the editor, retain keyed optional actions,
and publish native sensitivity plus field metadata. Keep a number draft only
while it matches the owning numeric value; format the committed value on blur.

CheckboxList options and child parts use the same native checkbox row and
group field owner. The existing group role adapter uses NativeScript's inert
fallback while preserving group on GTK. Native-only layout classes describe
this leaf's tree. Keep pointer focus in the renderer's custom-toggle controller
so read-only checkboxes and switches can focus without selection handlers.

SegmentedControl and its child part use the same radio/radiogroup adapter as
RadioList. The native field frame owns width and chrome; option and child-part
rendering share one row implementation. Native-only layout classes preserve
hug/fill geometry and icon spacing without changing the web leaf.

PinInput also shares the native TextInput path. Its group owns one field frame;
numbered editors retain their own names and ids. Native-only shell sizing and
gap classes fit the existing 40px cells without changing the web/AppKit trees.

Slider uses the shared native leaf and a private slider-accessibility.gtk
helper for typed GTK range metadata. NativeScript keeps its string value
readout. Gtk ref events provide increment/decrement plus Home/End actions;
leave the shared PanEvent delta contract intact. Tooltip positioning can use
a different native view from its hover/focus owner, so keep description
relations on the interaction owner and popup geometry on the thumb.

InputRating reuses radio-group semantics and one native field frame. Its
filled prefix is visual state; checked metadata identifies only one score.
Web uses matching roving focus, arrows/Space and readonly navigation. Glyph
changes and scoped icon providers must retain the score widgets.

For native GTK assertion fixtures, rebuild the XplatMason typelib and use its
fixed-signature test_accessible_state, test_accessible_boolean_property and
test_accessible_string_property
helpers. GTK's original variadic checks are not introspectable. The wrappers
compare values and distinguish false/true/mixed, not merely attribute presence.
Integer-valued optional booleans and tristates require G_TYPE_INT values; ordinary
boolean states/properties use boolean values. See
[the GTK state example](../../../../docs/platform/linux-gtk.md#control-accessibility-state).

SelectorOption reuses its shared native presentation leaf on GTK. Its icon
lane is decorative, and disabled styling uses the web modifier class; the
parent owns selection/actions. The GTK renderer handles outer CSS margins,
container padding/border sizing and direction resets. Do not add compensating
UI widths or reverse child arrays.

Selector and MultiSelector are curated root exports on GTK 4.14+. They reuse
the shared Select/SelectView leaves: the Pressable trigger resolves a ref
that the GTK Popover session anchors to, and menu content portals through
the original universal root. `useSelect` seeds defaultOpen/defaultValue once
per mount — controlled↔uncontrolled switches on the same element keep prior
state, matching React semantics. Escape/outside-tap authority, focus return
and session teardown come from the shared Popover path. Arrow-key listbox
navigation is a web-only SelectView feature.

The pure-utility, i18n, theme-registry and link-context exports reuse
their shared leaves on GTK — no .gtk variants were needed. isNative
resolves to platform.ts (true — GTK is a native widget platform).
thumbHashUri's shared leaf imports @nativescript/core; it stays out until
the Image slice supplies a host decode path.

`styled` resolves its universal target via `universal-target.ts`/`.gtk.ts`
('nativescript' / 'gtk') — the nativescript leaf stamps a foreign marker the
GTK owner rejects; the shared leaf now stamps the resolved target. All other
B1 leaves reuse their shared `.tsrx` — Button-family and display
components compose qualified Pressable/View/Text/masonview paths. `xplatGtkSlotDedupe` in the GTK vite config is a build-level workaround
for an octane 0.16.3 emission bug (`withSlot` emitted twice intra-module;
rolldown dedupes cross-module but not intra-file) — applies to every GTK
bundle, not per-leaf. macOS shares the path.

`Image` needed `Image.gtk.tsrx` — the nativescript leaf builds on
`@nativescript/core` `ImageSource`; the GTK leaf renders the host `image`
element (`src`/`stretch`/`placeholder`), mapping `contentFit` onto stretch
and `blurhash:`/`thumbhash:` placeholders through `hashToPngBase64`.
`thumbHashUri` needed `thumbhash.gtk.ts` — GdkPixbuf/Gio/Soup decode,
scale and RGBA extract feeding the shared pure-JS `rgbaToThumbHashUri`;
`gi://` imports are ambient-declared in `type-support/gi.d.ts`. Avatar,
Thumbnail, AvatarGroup(+Overflow), AvatarStatusDot and User need no GTK
leaf — they resolve through `Image` and the host `image` element.

`menu-sheet` and `MoreMenu` needed `.gtk` leaves because the shared leaves
import `BottomSheet` statically — BottomSheet is unqualified on GTK and
its nativescript host deps cannot resolve. The GTK leaves keep identical
exports, route everything through the popover path, and throw a clear
`presentation="bottom-sheet" requires slice D` error for the sheet
presentation. `keyboard-overlay-host.gtk.ts` is an inert stub — X11 has no
software-keyboard overlay to host.
- `use-layer.gtk.tsrx` / `use-hover-card.gtk.tsrx` / `HoverCard.gtk.tsrx` — the shared leaves gate on the macOS `appKitHost()` bridge (`showLayer`/`observeHover`), so the GTK leaves substitute the renderer Popover session and `Gtk.EventControllerMotion` pointer intent. `HoverCard.gtk` exists because `HoverCard.tsrx` binds the hook by explicit `.tsrx` extension, bypassing `.gtk` resolution.
- `Toast.gtk.tsrx` / `toast-viewport.gtk.tsrx` / `toast-surface.gtk.tsrx` / `toast-service.gtk.tsrx` — one scrim-free overlay layer per edge (`TOAST_POSITIONS`/`TOAST_EDGE_ALIGN` exported from the surface leaf); the layer widget hugs its corner so uncovered regions stay interactive (never use `can_target=false` for pass-through — it skips whole subtrees in pick). `maxVisible` queues overflow; service roots mount via `createGtkRoot(host,{service:true})` + `__octaneGtkHost.mountServiceRoot` and stay out of the bridge layer target.
- `Lightbox.gtk.tsrx` — modal scrim layer, `flexGrow` stage, capture-phase window `EventControllerKey` for Left/Right (layer target is a plain non-focusable `Gtk.Box`), `onPan` bound only while zoomed (`Gtk.GestureDrag` claims sequences and starves `GestureSwipe`), zoom writes `scaleX/scaleY`/`translate` directly (`ref.animate` is translate-only). `type:"video"` falls back to alt text.
- `CommandPalette.gtk.tsrx` + `command-palette-keys.gtk.ts` + `command-palette-scroll.gtk.ts` — centered modal layer; capture-phase key controller on the Gtk.Entry handles arrows/Page/Enter, `map`-signal re-grab for focus (grab on an unmapped widget is a no-op), GJS `AbortController` shim at module scope.
- `Drawer.gtk.tsrx` — shared leaf relies on overlapping grid cells the GTK fallback lacks; the .gtk leaf presents the panel on a modal `align:{h:start,v:fill}` scrim layer and renders `main` inline.
- `BottomSheet.gtk.tsrx` (+ exported `GtkSheetPanel`) — sentinel view + `createOverlayLayer({modal,scrim,align:{h:fill,v:end}})` + `createPortal` into `layer.target`; `sheet-detents.gtk.ts` drives `translateY`/`view.animate` on the numeric `view.on("pan")` states; `useLayerDismissal` for Escape; `BottomSheetSwitcher` mounts one portal and re-enters on `resetKey` (spec by prop — never `useStore` inside the portal).
- `bottom-sheet-service.gtk.tsrx` — imperative sheets via `__octaneGtkHost.createOverlayLayer` + `mountServiceRoot`/`owner.createRoot`, newest-first `closeBottomSheet`; `bottomSheetHost()` is `null` and deliberately unexported (host-subpath only on the shared barrel).
- `menu-sheet.gtk.tsrx` — real `MenuSheet` (MenuProvider + MenuData in a `height="hug"` sheet); `useMenuSheet` resolves `'adaptive'` via `Gdk.Seat` TOUCH capability.
- `MoreMenu.gtk.tsrx` — direct item list inside `BottomSheet` for `'bottom-sheet'`; `'adaptive'` stays a popover on fine-pointer desktops.

### Theme and environment (slice E)
- `theme/colorScheme.gtk.ts` — reads the renderer `__octaneGtkHost` bridge (`getColorScheme`/`onColorSchemeChange`), the same `Gtk.Settings` detection the cascade uses for `ns-dark`/`ns-light`, so hook answers cannot diverge from styled behavior. Mirrors `colorScheme.macos.ts`'s `__xplatAppKit` pattern.
- `theme/theme-scheme.gtk.ts` — macOS-leaf mirror; `setThemePreference` writes `gtk-application-prefer-dark-theme` (an app-owned opt-in flag on GTK < 4.20 — the OS does not write it; `'light'`/`'system'` clear it, matching the macOS leaf clearing its `NSApp.appearance` override).
- `theme/theme-css-inject.gtk.ts` — registers `generateThemeCss` output via the bridge's `registerStylesheet` (shared css-engine); retries when no root is live yet.
- `use-media-query.gtk.tsrx` — bridge `matchMedia` runs the same `evalMediaQuery`/environment instance the cascade uses; `onMediaChange` fires on `GdkSurface::layout` (real resizes, incl. WM-driven) and settings notifies. `notify::default-width` fires before the surface resizes — never read env from it.
- `clipboard-write.gtk.ts` — `Gdk.ContentProvider.new_for_bytes('text/plain;charset=utf-8')` + `set_content`; GTK 4 has no `gdk_clipboard_set_text`. Members go through `any` (typed typelibs predate them).
- `announce-service.ts`/`.gtk.ts` — a ui indirection between the shared leaves (`use-clipboard.tsrx`, `use-announce.ts`) and `@octane-xplat/platform`: platform's index does not tree-shake under the GTK shim (`Screen` missing), so the `.gtk` sibling posts through the bridge's `GtkAccessible.announce` instead (GTK >= 4.14, `any`-cast — the enum is absent from typed typelibs).
### Focus and keyboard (slice F)
- `use-focus-visible.gtk.tsrx` — subscribes the renderer's `__octaneGtkHost` modality bridge (`getInputModality`/`onInputModalityChange`); the watch lives in `wireContainerWindow` (capture key + `EventControllerLegacy` pointer + `is-active`).
- `use-focus-within.gtk.tsrx` — wraps the shared leaf and reports `isSubtreeTrackingSupported: true`; `Gtk.EventControllerFocus` enter/leave are real boundary events on containers.
- `use-keyboard.gtk.ts` — `keyboardProps` carries the renderer's capture-phase `onKeyDown`/`onKeyUp`; `isSupported: true`.
- `use-grid-focus.gtk.ts` — arrow/Home/End navigation over the host's outermost focusable descendants; claims handled keys so GTK directional nav cannot double-move.
- `useFocus`/`useFocusRing`/`useLandmark` need no leaf — shared impls ride `onFocus`/`onBlur` props and the landmark roles added to `A11Y_ROLES`.
- `key-event.ts` (renderer) — `normalizeKeyEvent` maps `keyval_to_unicode` + `KEY_NAMES` to DOM key names; the dispatched event must be the normalize result itself (`eventName`/`object` attached) — a spread copy breaks `preventDefault`/`stopPropagation` closures.


### Remaining inputs (slice I)
- `LinearGradient.gtk.tsrx` — internal gradient surface (not a root export; the color controls compose it). GTK CSS parses `linear-gradient()` natively on `backgroundImage`, so the leaf renders a plain `masonview` — the shared native leaf's `linear-gradient-apply` platform view hook is not needed.
- `coarse-pointer.ts` / `coarse-pointer.gtk.ts` — `hasCoarsePointer()` is the `'adaptive'`/'`adaptive-*`' presentation signal. The shared leaf returns `true` (every NativeScript target is touch-first); the GTK leaf probes `Gdk.Display` seats for `SeatCapability.TOUCH`, so fine-pointer desktops resolve `adaptive` to anchored popovers and touch seats to sheets.
- `menu-sheet.gtk.tsrx` — deduplicated: its private `Gdk.Seat` probe moved into `coarse-pointer.gtk`, now shared with the date-input surfaces. Behavior unchanged (sheet on coarse, popover on fine).
- `DateRangeInput.tsrx` (shared leaf, no `.gtk` file) — gained a fine-pointer `Popover` branch: `hasCoarsePointer()` picks the sheet on touch seats and an anchored `Popover` hosting presets + range `Calendar` on fine-pointer hosts. `DateInput`/`TimeInput`/`DateTimeInput` make the smaller version of the same change — `resolveInputSurface(effective, hasCoarsePointer())` replaces the hardcoded `true`.

### Web content (slice J)
- `WebView.gtk.tsrx` — mirrors the macOS leaf; the imperative handle calls the WebKit.WebView GI methods (`reload`, `go_back`, `go_forward`, `stop_loading`) and `native` is the widget.
- `webview-instance.ts` (renderer) — lazy `imports.gi.WebKit` (6.0) resolution, `load_html`/`load_uri` split, `load-changed`/`load-failed`/`web-process-terminated` signals, JS eval measure for `onLayoutContent`/`matchContents`/`scrollEnabled`.

