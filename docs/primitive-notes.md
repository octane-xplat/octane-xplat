# Primitive notes (`packages/ui`)

> The detailed cross-platform vocabulary. Every primitive is an interface (`.ts` types)
> plus a native-default module, a browser `.web.tsrx` override, optional `.mobile.tsrx`, and OS-specific `.ios`/`.android` variants.
> Shared code imports the public components and prop types. Design rule from RNW: converge on the
> _constrained_ vocabulary — never the DOM's open one.
>
> **Owns:** #1 primitives contract · **Status:** mapped; driver mechanics
> verified · **Blocks on:** lab — Q3 (listview), Q4 (controlled inputs) ·
> **Decisions:** #3, #6, #9, #16, #21, #22, #24 · **Validated by:** prototype —
> counter + `@for` list + controlled `TextInput` + `Pressable` on both targets.

The inventory combines shipped behavior with early API sketches and dated
lab notes. Current usage belongs in [building screens](primitives.md) and
the package declarations. Historical `List`/`Modal` refer to today’s
platform-subpath widgets; shared replacements are `VirtualList`/`Sheet`.
The old `ref`, `onChangeText`, `glass`, and modal-prop sketches are not the
current public contract: primitives use `bind`, text inputs use `onChange`,
and Liquid Glass is iOS-only.

## Original prop conventions (historical sketch)

```ts
interface PrimitiveProps {
	className?: ClassValue // clsx-style — works both targets
	style?: StyleObject // dynamic values only
	ref?: Ref<TypedHandle> // typed imperative handle per primitive
	children?: unknown
	// platform escape hatches — props, not files, for small divergences:
	ios?: Partial<NativeProps>
	android?: Partial<NativeProps>
	web?: DOMProps
}
```

- `className` composes via clsx on both targets (native: through NS CSS).
- `style` object → DOM `style` / NS `view.style`. **Numbers mean dip on native,
  px on web** — normalize inside the leaf, never in shared code.
- Event props use shared names (`onPress`, `onChange`, `onSubmit`); native leaf
  maps to `tap`/`textChange`/`returnPress` (driver already aliases these).
- Escape-hatch prop bags keep 90% of divergences out of file splits.

## Core inventory

> **2026-10 taxonomy:** the shared surface is now "same props → same pixels".
> `Switch`/`Slider`/`Spinner`/`Tabs`/`Drawer` are self-drawn;
> the OS-backed versions moved to `@octane-xplat/ui/{ios,android}` under
> their OS names (`UISwitch`, `MaterialSwitch`, `UISlider`, `SeekBar`,
> `UIActivityIndicatorView`, `CircularProgressIndicator`, `UITableView`,
> `RecyclerView`, `UITabBar`, `BottomNavigationView`, `UIModal`,
> `MaterialDialog`, `SideDrawer`, `DrawerLayout`, `LiquidGlass`/
> `LiquidGlassContainer`). `Hoverable`/`Tooltip` moved to the root barrel
> (decision #69 — touch leaves pass through, pointer platforms own the hint
> layer). Shared `List`,
> `Modal`/`openModal`, the `glass` prop, and
> `PlatformBadge` are gone. Rows below marked [platform] describe the
> subpath widgets' internals; the notes remain accurate — the import path
> changed, not the mechanism. `TextInput`/`TextArea` stay OS-backed with a
> `vx-input`/`vx-textarea` chrome reset.

| Primitive                         | Web leaf                                                  | Native leaf                                                                                         | Notes / seams                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `View`                            | `div` + `vx-view` class (flex-column, stretch)            | `flexboxlayout` `flexDirection=column`                                                              | RN-compatible default container — **column by default**, not web block flow. NOT `contentview` (single-child only)                                                                                                                                                                                                                                                                                                                                |
| `HStack` / `VStack`               | flex row / col                                            | `flexboxlayout` (`flexDirection`)                                                                   | `justify`/`align`/`gap`/`wrap` props — FlexboxLayout carries real flex semantics incl. `gap` (verified); StackLayout can't (no justify/align)                                                                                                                                                                                                                                                                                                     |
| `Stack` (z-order)                 | `display:grid`, children `grid-area:1/1`                  | `gridlayout` `rows="*" columns="*"`                                                                 | children share the cell origin; fixed-size children keep their size; z-order = mount order                                                                                                                                                                                                                                                                                                                                                       |
| `Grid`                            | `display:grid` + parsed templates                         | `gridlayout` `rows`/`columns` spec strings                                                          | shared spec-string format `"*,auto,2*"` → leaf maps `*`→`1fr`, `auto`→`auto`, `42`→`42px` for web. Unplaced children auto-flow row-first on every target; explicit `row`/`col`/`rowSpan`/`colSpan` placements reserve their cells. **No `gap`** (GridLayout lacks it; use child margins) — leaf warns                                                                                                                                                                                                                       |
| `Absolute`                        | `div` + `position:relative`; children `position:absolute` | `absolutelayout`                                                                                    | **native has no `position` CSS** — container element required anyway; child `left`/`top` attached props (dip→px)                                                                                                                                                                                                                                                                                                                                  |
| `Spacer`                          | `flex-grow:1`                                             | `flexGrow` attached prop                                                                            | convenience                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Text`                            | `span`/`p`                                                | `label`                                                                                             | children: text or `Text` only (nested → `formattedstring`/`span`); **never `View` inside `Text`** — adopt RN rule                                                                                                                                                                                                                                                                                                                                 |
| `RichText`                        | inline `<span>` composition                               | `formattedstring` + `span` leaves                                                                   | nested `RichTextSpan` children; each span may be styled and tappable                                                                                                                                                                                                                                                                                                                                                                              |
| `Pressable`                       | `div`+pointer events                                      | `flexboxlayout` `flexDirection=column` + `tap`/`longPress`/`pan`/`swipe`                            | **multi-child** — `contentview` silently drops all but the last child (`.content` assignment); tap gestures attach to any view. Use `button` leaf only where native button chrome wanted                                                                                                                                                                                                                                                          |
| `ScrollView`                      | `div` overflow                                            | `scrollview`                                                                                        | Native `ScrollView` measures a vertical child with an unspecified height; do not nest a recycling `List` inside it. `refreshing`/`onRefresh`/`refreshThreshold` wrap it in a `vx-refresh-wrap` host with a self-drawn indicator strip (`vx-refresh` + `vx-spinner`) — vertical only; see the pull-to-refresh note below the table.                                                                                                                                                                                                                                                                                                                              |
| `Pager`                           | scroll-snap row (`overflow-x` + `scroll-snap-type`)       | `pager` (`@nativescript-community/ui-pager` — ViewPager2 / paging UICollectionView; shipped as the `@octane-xplat/pager` leaf, which owns the plugin as a real dependency) + per-page Octane sub-roots | `items` + `renderItem`, no children. The leaf hand-wires the driver's ListView cell machinery: `itemTemplates` vend a `GridLayout` host per slot, `itemLoading` binds a `createNativeScriptRoot` per host, `itemDisposing` unmounts it. `items`/`selectedIndex` write imperatively (items must land first — `selectedIndex` coerces against page count). `onPageChange` ← `selectedIndexChange` (leaf-suppressed on its own writes); web fires it on scroll-idle settle. No `loop` — plugin `circularMode` exists but web scroll-snap can't loop without fake-clone divergence. `renderItem` should be identity-stable (memoized subtree, same constraint as UITableView). |
| `ScrollBox`                       | `ScrollView`                                              | inline `View`                                                                                       | Use around shared content that may contain a `List`: web keeps the outer scroll, native lets the `ListView` own scrolling. The native shell is deliberately non-scrolling and non-recycling.                                                                                                                                                                                                                                                      |
| `List` [platform]                 | — _(removed from shared)_                                 | `listview` + **per-cell Octane sub-roots** — now `UITableView`/`RecyclerView` in the subpaths       | The driver owns one `itemTemplate` and `itemLoading` callback: each recycled slot gets a `ContentView` and Octane root. It exposes only `renderItem`, so `kindFor` is removed; branch on the item inside `renderItem` when row markup differs. Never place a platform list inside native `ScrollView`; the leaf throws a named error and `ScrollBox` is the replacement. Shared code composes `ScrollView` + `items.map`. The platform lists take the same `refreshing`/`onRefresh`/`refreshThreshold` props — same pull-to-refresh host shape as `ScrollView`.                         |
| `SegmentedControl`                | self-drawn `div` radiogroup (`vx-segmented`/`vx-segment`) | self-drawn `flexboxlayout` row (same classes)                                                       | `RadioOption[]` options, `value`/`defaultValue`/`onValueChange`. Segments are equal-width via `width:0` + `flex-grow:1` — `flex-basis` is dead on NS (the `flex` shorthand drops it, and `flexBasis` is not a registered style property). Space/Enter selects on web, tap on native; group + per-option `isDisabled`. The platform-authentic widgets (UISegmentedControl, Material segmented buttons) stay out of the shared barrel.                                                                                                          |
| `SearchInput`                     | `input[type=search]` in a `div` shell                     | styled `textfield` in a `flexboxlayout`                                                             | chrome-reset — no UISearchBar. Same `writeText` imperative-write path as TextInput (selection preserved on controlled writes). `returnKeyType` is fixed `'search'`. Webkit's own `::-webkit-search-cancel-button` is hidden so the self-drawn clear matches native; clear fires `onChange('')` then `onClear`. `icon` names a registered glyph — `xplat-search`/`xplat-clear` are framework defaults registered in `icons.ts`, app-overridable.                                                                                            |
| `TextInput` / `TextArea`          | `input`/`textarea`                                        | `textfield`/`textview`                                                                              | controlled `value` ↔ `text` is written imperatively through `writeText` (`text-write.ts`) — Android `EditText.setText` resets selection to 0, so the leaf parks and restores `setSelection(min(pos, len))` around the write; iOS `UITextField` preserves the range itself. No-ops when the value already matches, so the user's own `textChange` echo never bounces. Leaf-scoped suppression also excludes synchronous script-write events: these imperative writes bypass the driver's generic muted prop path (2026-09-30 object-driver regression coverage; native IME remains unverified). `returnKeyType`, `autocorrect`, keyboard types still differ. `TextArea` shipped: `rows`/`autoGrow`/`maxRows` — web auto-grow via scrollHeight re-fit; native TextView grows by default, row counts → `min/maxHeight` dips at the widget's measured line height (its `maxLines` is truncation-only on iOS) |
| `Image`                           | `img`                                                     | `image`; svg srcs → `svgview` (vendored ui-svg)                                                              | `src`: URL/`res://`/`~/`/data: URI plus inline `<svg>` markup, svg data URIs, `.svg` paths/URLs; remote `.svg` fetches→markup (SVGView awaits promise srcs)                                                                                                                                                                                                                                                                                       |
| `Icon`                            | inline SVG (lucide-style)                                 | `svgview` (vendored ui-svg → SVGKit/androidsvg) for `svg`/`markup`                                           | name → glyph map; precedence `markup`/`svg` > `font` > `src` > `text`; `viewBox` is preserved on both leaves                                                                                                                                                                                                                                                                                                                                      |
| `Switch`                          | self-drawn `div` track+thumb (`vx-switch`)                | self-drawn `flexboxlayout` track+thumb (same classes)                                               | not an OS checkbox/switch — tap toggles on both; keyboard Space/Enter on web. `UISwitch`/`MaterialSwitch` in subpaths for OS chrome                                                                                                                                                                                                                                                                                                               |
| `Slider`                          | self-drawn track/fill/thumb `div`s                        | self-drawn `flexboxlayout`s in a `gridlayout`                                                       | drag via shared `PanEvent` delta; `role=slider`/`adjustable` + `aria-valuenow`/`accessibilityValue`. `UISlider`/`SeekBar` in subpaths                                                                                                                                                                                                                                                                                                             |
| `Spinner`                         | `vx-spinner` border ring + keyframes                      | `vx-spinner` border ring + `el.animate()` rotate loop                                               | `busy=false` hides on both                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Modal` [platform]                | — _(removed from shared)_                                 | **`showModal` + a second Octane root** — `UIModal`/`MaterialDialog` in subpaths                     | ⚠ context does NOT cross roots — see below. Shared temporary surfaces: `Sheet`, `Overlay`, `openSheet`                                                                                                                                                                                                                                                                                                                                            |
| `SafeArea`                        | CSS `env(safe-area-inset-*)` padding                      | root-level padding + `iosOverflowSafeArea` management                                               | plus `useSafeAreaInsets()` hook                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `KeyboardAvoiding`              | neutral column wrapper                                   | scrollview + keyboard inset management on iOS/Android; neutral column wrapper on macOS/Windows     | The shared root keeps the wrapper useful at common call sites. Only iOS/Android adjust for the software keyboard; web/Linux retain a neutral DOM wrapper, and macOS/Windows retain a neutral native column.                                                                                                                                                                                                                                                                                                                                                                                     |
| `WebView`                         | sandboxed `iframe` (`vx-webview` border reset)            | `webview` (WKWebView / android.webkit.WebView)                                                    | Shipped shared — chrome-reset bucket (#44): the frame is normalized (`src`, `html` via `srcdoc`/NS `_loadData`, `onLoad`/`onError` split out of `loadFinished.error`, `scrollEnabled`, `bind` handle), the document's pixels stay engine-owned. Web default sandbox `allow-scripts allow-same-origin allow-forms allow-modals`; `sandbox` prop / `web:` bag override. **No JS bridge** — iframe `postMessage` vs `WKScriptMessageHandler` vs `addJavascriptInterface` are different page-side contracts; a shared bridge would be fake parity. `scrollEnabled` on Android eats ACTION_MOVE (drag-select inside the frame dies with it); web `scrolling="no"` and iframe `error` events are deprecated/best-effort seams. Desk-source only — no device verification yet                                                                                                                                                                                                                                                                                                                                                                                                |
| `Video`                           | `<video>` chrome-free + self-drawn transport overlay (shared `video-chrome` twin pair) | `xplatvideo` (`@nstudio/nativescript-exoplayer` — AVPlayerViewController iOS / ExoPlayer2 Android, `controls={false}`) | Shipped as `@octane-xplat/video` — surface-hosted: engine owns the pixels, we draw all chrome (play/pause, Slider scrubber, time, mute; tap toggles, auto-hides while playing). `src` lands imperatively in an effect so flag props can't precede it; `playing` writes are play()/pause() calls. Times are ms everywhere (web leaf converts from seconds). `finished` fires under `loop` on the plugins — `onEnded` suppressed there to match web. `onError` web-only — the plugin logs player errors, emits none. Poster is a self-drawn Image layer (plugin `imgSrc`/`imgType` are VR-image types, not posters). Desk-source only |
| `CameraView`                      | `getUserMedia` → muted/autoplay/playsinline `<video>` (`object-fit:cover`; front mirrored via CSS flip) | `AVCaptureSession` + `AVCaptureVideoPreviewLayer` on iOS; CameraX `PreviewView` on Android | Shipped as `@octane-xplat/camera` — live preview only; stills stay on `media.capturePhoto`. The leaf owns preview permission handling and the iOS/Android permission declarations. `active={false}` stops the preview session. `onReady` fires on web's video `playing` event, after iOS `startRunning()` returns, and after Android binds the CameraX use case; native callbacks do not confirm a rendered frame. Desk-source only — no device verification |
| `Overlay`/`Popover`/`Toast`       | anchored `div` (floating-ui) / portal                     | `RootLayout.open(view, {shadeCover, animation})` — imperative bridge, own sub-root per overlay      | getRootLayout returns FIRST registered RootLayout — app root is `<rootlayout>`; give modal roots ids (`getRootLayoutById`). One shade cover; every open/close call returns a rejecting promise — always `.catch`. Portals absent on native driver → this is the path. `showToast` also accepts `anchor` + `placement` and uses the Popover anchor path; unanchored `top-start`/`top-end`/`bottom-start`/`bottom-end` map to RootLayout alignment. |
| `Hoverable` [pointer platforms]   | delayed hover intent + body-portal Popover              | passthrough — renders children, never mounts the card (decision #69)                                  | Touch has no hover; the long-press stand-in was fake parity and stays out. Web keeps the card alive while the pointer crosses from the anchor to the portaled card; macOS mounts the card in an anchored `NSPopover` via the `__xplatAppKit` bridge (`observeHover` + `showAnchoredPopup`), kept open by a tracking area on the panel. The popup is a second Octane root — no shared context, content renders once at open.                          |
| `Tooltip` [pointer platforms]     | hover-intent + focus trigger, body-portal Popover        | passthrough — renders `trigger`, never mounts `content` (decision #69)                                | `trigger`/`content` slots; `aria-describedby` on the resolved focusable element; dismisses on Escape, blur, scroll (capture). Panel is `role="tooltip"`, `pointer-events:none`. macOS presents the same delayed-hover intent as an anchored `NSPopover`. On touch, compose `Pressable` + `Popover`/`Sheet` when a tap-to-reveal hint is the desired UX.                                                                                              |
| `useMeasure`                      | `getBoundingClientRect` + ResizeObserver/scroll listeners | `getLocationOnScreen` + `getActualSize` + layout/scroll listeners                                   | Returns `{ bind, bounds }`; observing defaults on. Web `x/y` are viewport coordinates; native `x/y` are screen coordinates in device-independent pixels.                                                                                                                                                                                                                                                                                          |
| `LiquidGlass` [ios-only]          | — _(removed from shared)_                                 | `liquidglass` (registered) — root IS an interactive `UIVisualEffectView`+`UIGlassEffect` (`ui/ios`) | real material on iOS 26+ only; inert layout on iOS <26, nothing on Android. The web backdrop-filter approximation was fake parity and is deleted. See the Liquid Glass section                                                                                                                                                                                                                                                                    |
| `LiquidGlassContainer` [ios-only] | — _(removed from shared)_                                 | `liquidglasscontainer` (registered) — `UIGlassContainerEffect` on AbsoluteLayout (`ui/ios`)         | merged-glass region — glass siblings morph together across `spacing` dips; children position via `left`/`top`                                                                                                                                                                                                                                                                                                                                     |

**Pull-to-refresh** (`refreshing`/`onRefresh`/`refreshThreshold` on
`ScrollView`, `UITableView`, `RecyclerView`) — one contract, three
mechanics, one visual: a `vx-refresh` strip (64px = default threshold)
carrying the self-drawn `vx-spinner` ring slides into the gap the pull
opens, and docks while `refreshing` holds. No OS spinner is involved
anywhere — `UIRefreshControl`/`SwipeRefreshLayout` are deliberately unused
(OS chrome would break the parity contract). Web self-draws the pull with
non-passive `touchmove` + pointer events translating the scroller inside a
clipped wrapper. iOS rides UIScrollView's own bounce — a `pan` recognizer
on the scroller reads `contentOffset` (NS gesture delegates allow
simultaneous recognition), and the docked phase holds via
`contentInset.top += 64`, the same mechanics UIRefreshControl uses.
Android has no overscroll, so the damped drag translates the scroller
inside the clipped wrapper and `OVER_SCROLL_NEVER` kills the edge glow.
`listview` has no scroll event — the pan recognizer covers it. If
`onRefresh` fires but `refreshing` never turns true, the dock collapses
after a 350ms grace window. Desk-verified; on-device pending.

**Sheet detents** (`detents` on `Sheet`/`openSheet`, e.g.
`[0.25, 0.5, 0.9]`) — one contract, one code path on every target: the
panel is sized to the largest detent and parked at a `translateY` offset
for the current one, so snapping is a transform write, not a layout
change. The self-drawn grabber strip (`vx-sheet-grabber`/`vx-sheet-grip`)
is the only drag target, so it never fights inner scrolling. Release
snaps to the nearest detent; a flick (>500 px/s or dip/s) snaps one
detent in its direction; releasing below half of the smallest dismisses —
drag-dismiss reports through the same `onDismiss`/`finish` path as a
shade tap. The OS detent presentations are deliberately unused:
UISheetPresentationController requires a UIViewController presentation
and BottomSheetBehavior a CoordinatorLayout/BottomSheetDialog window —
both are modal presentations (`UIModal`/`MaterialDialog` territory), not
in-window RootLayout children. With detents active the RootLayout
enter/exit animation is skipped (it hardcodes a translateY→0 target that
would fight the offsets); the leaf drives its own slide-in/out.
Desk-verified; on-device pending.

**Child layout props are part of the shared surface** — `row`, `col`,
`rowSpan`, `colSpan`, `dock`, `left`, `top`, `flexGrow`, `flexShrink`,
`alignSelf`, `order` exist in the driver `CommonAttributes`; the web leaf maps
each to the matching CSS (`grid-row`/`grid-column`, `order`, `flex-*`). Shared
code writes `<Text row={1} col={2}/>` inside a `<Grid>` identically on both
targets.

**Native SVG** (`svgview`, `SVGView` vendored from
`@nativescript-community/ui-svg` at `src/vendor/ui-svg` — a submodule of
`octane-xplat/ui-svg` (`xplat-vendored`), decision #62;
lab-verified 2026-09-26 — `icon svgview glyphs` sweep assert finds every
`Icon` mounted as a sized SVGView on iOS sim and Android device): `Icon`
SVG/markup glyphs and
SVG-shaped `Image` sources use SVGView. The vendored source accepts
inline markup, `File`/`ImageAsset`, `res://`, `~/`, absolute file paths, and
promise/function sources. Its native leaves parse strings directly; the
framework fetches remote `.svg` URLs first because SVGView itself has no URL
fetcher. SVG data URIs are decoded before they reach the view. `IconGlyph.src`
therefore supports inline SVG, SVG data URIs, and `.svg` paths/URLs; opaque
resource names whose format is not inferable stay on the image path.

The two native parsers do not form a full-fidelity contract:

| Feature        | Android (`androidsvg` 1.4)                                                                                            | iOS (`SVGKit` 3.x)                                                                                                    | Framework contract                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Gradients      | Linear gradients are supported; radial `fx`/`fy` and patterned strokes have limits                                    | Broader gradient support, but SVGKit's release notes still describe text/gradient handling as implementation-specific | Use simple gradients when parity matters; verify complex artwork on both targets                      |
| Filters        | SVG filter effects are not supported                                                                                  | SVGKit has no matching guarantee in the `ui-svg` adapter                                                              | Filters are not portable Icon artwork                                                                 |
| `<text>`       | Supported with limits on multi-value positioning and some text features; font resolution goes through AndroidTypeface | Supported, but SVGKit documents text handling as imperfect and depends on iOS font names                              | Convert icon text to paths, or use the explicit `font` fallback with registered names                 |
| `currentColor` | Parser supports `currentColor`; `ui-svg` has no native tint prop                                                      | SVGKit parses a root `color`, but the adapter offers no separate tint prop                                            | Inline `markup` injects the requested root `color`/`fill`; device color readback remains a sweep item |

The supported fallback contract is: `markup`/`svg` are vector-first; `font`
requires an app-registered icon font; `src` is an image or inferable SVG
source; `text` is the last plain-label fallback. These fallbacks preserve
availability, not SVG geometry or color fidelity. Sources: [ui-svg's pinned
implementation](https://github.com/nativescript-community/ui-canvas/tree/master/src/ui-svg),
[AndroidSVG feature matrix](https://bigbadaboom.github.io/androidsvg/), and
[SVGKit's 3.x release notes](https://github.com/SVGKit/SVGKit/releases).

**Prior art** (desk-survey 2026-09-26 — reinforces decision #29's
platform-delegation choice; no framework in the field renders the full spec
uniformly):

| Framework                              | Native SVG strategy                                                                                                                                                                                                                           | What it confirms                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| react-native-svg (Software Mansion)    | Reimplements the spec per platform (CGContext / Canvas) as real components — every element is a shadow node, no draw caching, iOS memory leaks                                                                                                | SWM's own guidance: for static artwork prefer platform-lib delegation (Expo Image → Glide / SDWebImage) — same architecture class as `svgview`, and the engines overlap: Glide's SVG decoder **is** androidsvg; SDWebImage's coder is Apple's private CoreSVG (with SVGKit and SVG-Native plugin alternates) |
| Flutter                                | `vector_graphics_compiler` precompiles `.svg` → binary `.vec` at build time; **the compiler defines the supported subset** — unsupported features fail the build                                                                              | Subset enforcement at compile time is the principled version of a lint gate                                                                                                                                                                                                                                  |
| Lynx (XElement `svg`)                  | Serval SVG — **one C++ engine shipped as a native binary on both platforms** (`ServalSVG` pod / `libserval_svg.so`), deliberately scoped to 17 tags / ~40 attrs, rasterized off-main-thread into a single view, explicit `current-color` prop | Uniformity = one engine; achievable as a library (currently alpha, known ABI gaps) rather than by owning the renderer — the escape hatch if androidsvg/SVGKit divergence ever bites                                                                                                                          |
| react-native-vector-image / icon fonts | Build-time `svg` → VectorDrawable (Android) / PDF asset (iOS), or → font glyphs                                                                                                                                                               | The only design that makes SVG art consumable by `UITabBarItem`/`BottomNavigationView` — a codegen step would close the platform tab-bar gap if needed                                                                                                                                                       |

**Follow-up (unimplemented):** an `xplat/` lint rule restricting `Icon`
`markup`/`svg` to the androidsvg ∩ SVGKit-verified subset (paths/basic
shapes, `fill`/`stroke`/`transform`/`viewBox`; reject `filter`, `<text>`,
`<image>`, radial `fx`/`fy`, `mask`, `pattern`) — the fidelity matrix above
is currently unguarded author discipline.

## The Modal seam (worst primitive leak, document early)

Native modal = a separate window/sheet hosting **its own Octane root**
(`renderNativeScriptApp` into a new `Page`/`View`, `showModal`). **Verified on iOS:**
the leaf drives `presenter.showModal(view, options)`. Children passed as
elements render fine inside the modal root — elements are data, evaluated in
whichever root renders them — so `<Modal open>{children}</Modal>` works; the
`component`/`params` contract below still stands for value-returning flows.
Readback: `presenter.modal` exposes the modal view for assertions.

> [!CAUTION]
> The signature is `showModal(viewToShow, options)`, not an options bag — a
> `{view}` first arg silently hits the deprecated moduleName path.

> [!IMPORTANT]
> Context does not cross the boundary — modal content gets a fresh root's
> context. Anything the modal needs must be passed as props/params or through
> a shared store module (not React-style context). CSS cascade doesn't cross
> either — `ns-modal` root class exists for styling modal roots; tokens must
> be applied there too. **Resolved (decision #34):** the effective scheme now
> lives in a module-level store (`theme/theme-scheme.ts`); imperative roots
> stamp `ns-dark dark` via `applyThemeClasses(host, base)` at creation and
> re-stamp live on override or OS scheme change. Apps drive it with
> `setThemePreference('dark' | 'light' | 'system')`; components read
> `useThemeScheme()`. Verified on iOS: the sheet host carries `ns-dark` under
> an app-level override (`sheet theme class: OK`).

- Portals don't cross. The platform modals keep the API as `{ open,
onClose, params }`-shaped components (`UIModal`/`MaterialDialog` in the
  subpaths) rather than "render my children in place" — treat children as
  a _screen component_ rendered inside the modal root.

```ts
interface ModalProps {
  open: boolean;
  onClose?: (result?: unknown) => void;
  presentation?: 'sheet' | 'fullscreen' | 'dialog';
  component: ComponentType<any>;   // screen component, rendered in its own root
  params?: unknown;                // serializable-ish; crosses the root boundary
}
<Modal open={show} onClose={close} presentation="sheet"
       component={SettingsSheet} params={{ userId }} />
```

Plus an imperative service for flows that return a value:
`const res = await modal.open(PickerSheet, params)` — native
`showModal`'s closeCallback carries results; web resolves the same promise.

Same applies, weaker, to `Drawer` (`mainContent`/`leftDrawer` via `hostSlot` —
that's within one root, so context survives; model it as slot props
`<Drawer main={…} drawer={…}>`).

## The List contract

```ts
interface ListProps<T> {
	items: readonly T[]
	renderItem: (item: T, index: number) => unknown // a row template, not a child
	keyFor?: (item: T) => string | number
	estimatedItemHeight?: number
	onEndReached?: () => void
	className?: ClassValue
	style?: StyleObject
}
```

Native leaf internals: `<listview>` with a driver-owned `itemTemplate` and
`itemLoading`; **per-cell `createNativeScriptRoot`** mounts the row component
into each recycled slot. The driver rebinds the root with the current
`items[index]` and skips unchanged `{renderItem, item, index}` triples. The
driver's public `ListViewAttributes` exposes `renderItem`, not NativeScript's
`itemTemplates`/`itemTemplateSelector`, so a `kindFor` prop could not select
native templates honestly. Web renders `@for` rows in a scroll div.

**Desk evidence for the nesting limit:** NativeScript's iOS `ScrollView` calls
`View.measureChild` with an `UNSPECIFIED` height for vertical content. The
NativeScript iOS `ListView` then prepares each cell and measures it through its
UITableView delegate path; the Octane driver supplies those cells as recycled
`ContentView` hosts from `itemLoading`. A `ListView` under that unbounded
`ScrollView` child path reaches UIKit's `_createPreparedCellForGlobalRow`
assertion. This is a driver/platform measurement constraint, not a row-render
bug. The native leaf now rejects the mounted parent shape with an explicit
`[List] cannot be nested inside native ScrollView` error. The proving app's
`ScrollBox.tsrx` is the corresponding inline `View` escape hatch.

This change adds the same escape hatch to `@octane-xplat/ui`. The demo covers
the shared `ScrollBox` + `List` shape; native device verification remains lab
work, so this conclusion is marked desk-source rather than lab-verified.

**Lab findings (iOS sim, experiment 1 — `packages/ui/src/List.tsrx`):**

- ✅ Per-cell `createNativeScriptRoot` works: 5 visible cells → 5 roots,
  reused across waves; `root.render` re-entry updates in place.
- ⚠️ `itemLoading` refires on **every layout-affecting render** anywhere in
  the tree, not just data changes. A stable `onItemLoading` identity did not
  stop it — the trigger is native layout invalidation, not prop writes.
- ⚠️ The host↔index assignment **rotates between waves** (pool alternates
  order), so a per-host item dedup only saves the stable-center case; most
  refires are real rebinds. Cell renders stay cheap (JS-only, universal diff
  guards native writes).
- ⚠️ `e.item` lags the `ObservableArray.splice` by one wave — app data must be
  authoritative (`items[index]`), `e.item` is fallback.
- ⚠️ `useRef`-held values are **unreliable inside stale event closures**:
  `.current` resolves through draft-vs-committed hook records, so a wave
  running a pre-commit closure reads old values. Keep itemLoading state in
  module-scope maps keyed by the native objects (`ObservableArray`, host
  view) — multi-instance safe, no hook semantics.
- ⚠️ The splice's own wave is queued before the render commits, so a lone
  data change can display stale cells until the next wave. Mitigation:
  `setTimeout(() => lv.refresh(), 0)` after splice (ListView captured from
  `e.object`).
- Deeper fix belongs in the driver: `listview` should be a managed element
  whose `items` diff drives `refresh()` natively instead of leaf-level
  glue. **Reported upstream**:
  [nativescript-community/octane#1](https://github.com/nativescript-community/octane/issues/1)
  — **and shipped upstream in 0.2.1** ([#7](https://github.com/nativescript-community/octane/pull/8),
  ): the driver owns `itemTemplate`/`itemLoading` — per-cell
  ContentView + universal root, `items[index]` binding with identity-skip,
  unmount on release. Our leaf is now just `<listview items renderItem>`
  - the `renderEmpty` swap.

`renderItem` as a function prop — NOT `children` + `@for` — because the native
leaf can't feed reconciled children into `itemTemplate`. Shared code calls it
as `<List items={msgs} renderItem={(m) => <MsgRow msg={m}/>}/>`; the function
body compiles normally.

> [!WARNING]
> TSRX trap inside the web leaf: a bare `{renderItem(item)}` call in an `@for`
> body iterates but mounts nothing — items render as empty anchors. Wrap call
> results in a fragment: `<>{renderItem(item)}</>`.

> [!NOTE]
> Implementation gaps vs. this contract: the web leaf keys `@for` on `item.id`
> directly (`keyFor` is unwired — items need an `id` today), and on native
> `renderItem` should be identity-stable — `MemoListView` compares `items`
> only, so a fresh closure per render never reaches the cells.

## The Overlay/Popover/Toast contract

```ts
<Overlay open={open} onDismiss={…} shadeCover?>…in-window overlay…</Overlay>
<Popover anchor={ref} placement="top">…anchored…</Popover>
```

Native: `RootLayout.open(view, {shadeCover, animation})` — the leaf creates a
container view imperatively, opens it, mounts overlay content via a dedicated
`createNativeScriptRoot` per overlay. Same caveat as Modal: **context does not
cross into overlay content**; pass props, not context. Web: portal into
`document.body` + floating-ui-style positioning. Every `open`/`close`
returns a rejecting promise — leaf must `.catch`.

Root selection (verified on iOS, commit `af5f492`): `getRootLayout()` returns
the FIRST mounted rootlayout — wrong root after a push (overlay would land on
the home screen, invisible under the pushed page). `rootLayoutFor(view)` in
`src/root-layout.mobile.ts` walks `view.parent` to the enclosing `RootLayout`
— the Screen shell of the page that declared the overlay. Imperative services
with no declaring view (toast, app-level sheets) use `topRootLayout()` — the
most recently mounted shell from a ui-owned registry; `Screen` self-registers
on `loaded`/`unloaded`. (NS's internal `rootLayoutStack` can't be relied on —
deep imports can land in separate bundled module instances, so its
`getRootLayout()`/stack copy isn't the same array other packages read.)
`createPortal` is not enabled in the universal driver at all — `Popover`
opens an anchored layer via `rl.open` the same way `Overlay` does.

Caveats learned in the sweep:

- **Tab-pane shells churn.** `TabView` pane `Screen`s load/unload as panes
  switch; an imperative host attached to a pane shell can unload with it.
  Services should re-resolve per call rather than cache the rootlayout.
- **Harness asserts should hold the host view ref** (`sheetHost()`-style)
  rather than id-search the tree — the owning shell may be unloaded by the
  time the assert reads.
- **`'closed'` fires inside `RootLayout.close()`, before `removeChild`.**
  Calling `close()` (or any cleanup that re-issues it) from a `closed`
  listener re-enters: the host is already spliced out of `_popupViews` but
  still parented, so the second close's deferred cleanup hits a detached
  view and throws `View not added to this instance` (desk-verified
  2026-09-25 — `root-layout-common.js` `cleanupAndFinish` notifies before
  removing). Cleanup hooks must be idempotent and must not re-call
  `close()` while a close is in flight; a childed-but-untracked host is a
  raced-close leftover — detach it with `removeChild`, not `close()`.
- **Unloaded subtrees hold dead JS views.** A covered page unloads its
  views — native recognizers detach but the JS objects stay parented, so
  `getViewById` still finds them (`loaded=false`, observers present,
  recognizers gone). `findInRootLayouts` skips `isLoaded === false`
  branches; interaction probes must assert `isLoaded` before concluding
  a view is tappable — `notify()`/observer dispatch works on dead views.
- **The `files.pick` document browser swallows every real touch** while it
  is presented (a hosted `DocumentManagerUICore` scene owns event delivery —
  gestures, hit-tests, and view state all look correct underneath it). The
  harness opens it at +90s, so unattended `idb ui tap` sessions must either
  run before it appears or tap `harness.txt` to dismiss it first; a leftover
  shade cover (e.g. an un-closed overlay probe) blocks taps the same way.
- **A re-shown page can stay unloaded** when the frame's nav bookkeeping
  stalls mid-transition (#11444 strand). `route.native` re-arms the load
  pass on `navigatedTo` (`currentPage.callLoaded()` — idempotent) so
  recognizers re-attach; without it, real taps on a visible page die.

### Sheet — two semantics, two APIs (decision #35)

`Modal presentation='sheet'` is a _system_ modal — separate window root,
native sheet on iOS. The `Sheet` primitive is the **in-window** bottom
sheet — content stays inside the app window on the declaring page's
RootLayout (native) or a `document.body` portal layer (web):

```ts
<Sheet open={open} onDismiss={…} shadeCover?>…bottom panel…</Sheet>
openSheet(Component, params) → Promise<result>   // openModal-shaped service
```

Declarative form resolves its root via the `rootLayoutFor` sentinel walk
(same as `Overlay`); the imperative service uses `topRootLayout()` and a
**fresh host + root per open** — no stale-parent reopen dance. Host carries
theme classes via `applyThemeClasses`; `closeSheet()` / `sheetHost()`
support imperative dismiss + harness asserts. Verified on iOS and Android:
the sheet host registers as a tracked RootLayout popup child
(`getPopupIndex(host) >= 0` — `[assert] sheet host registered`), so shade
covers, `bringToFront`, and `closeAll` all see it.

## Liquid Glass (decision #37)

This section records the earlier glass experiment. The shared `glass` prop
and web approximation were subsequently removed; today only
`LiquidGlass`/`LiquidGlassContainer` from `@octane-xplat/ui/ios` are public.

`@nativescript/core` ≥ 9.1 ships three seams the primitives wrap; all are
`supportsGlass()`-gated — `__APPLE__ && SDK_VERSION >= 26` — so everything
degrades to inert layouts on Android and iOS < 26:

| Surface                    | Wraps                         | Behavior                                                                                                                                                                                                         |
| -------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LiquidGlass`              | `liquidglass` layout          | Element root IS the glass — interactive, touch-tracking `UIGlassEffect`. Props `variant` (`'regular'`/`'clear'`, default `'regular'`), `interactive` (default `true`), `tint`, `animateChangeDuration`           |
| `LiquidGlassContainer`     | `liquidglasscontainer` layout | `UIGlassContainerEffect` region — sibling glass views morph together across `spacing` (default 8). AbsoluteLayout host: children position via `left`/`top`, or nest layout primitives inside                     |
| `glass` prop on containers | `iosGlassEffect` View prop    | `View`/`Stack`/`Grid`/`HStack`/`Absolute`/`Pressable`/`ScrollView` take `glass={true \| 'regular' \| 'clear' \| GlassConfig}` — background glass inserted behind the view's content. **Never interactive upstream** |

Caveats found reading the 9.1.2 implementation:

- **Always pass `iosGlassEffect` a config object.** The string shorthand
  (`'regular'`) rebuilds the `UIGlassEffect` with `interactive` unset —
  `LiquidGlass` loses its touch-tracking on prop updates. The leafs
  normalize through `glass.ts` so shared code never hits this.
- The generic-view glass (`glass` prop) inserts a non-interactive
  `UIVisualEffectView` at index 0 and sizes it a `setTimeout` after mount —
  real interactive glass requires the `LiquidGlass` layout, not the prop.
- `spacing`/`interactive`/`animateChangeDuration` read only from a config
  object, and `spacing` applies only on the container's `effectType`.
- Verification needs an **Xcode ≥ 26 build** — NS metadata for
  `UIGlassEffect`/`UIGlassContainerEffect` is generated from the SDK at
  build time; `supportsGlass()` checks only the runtime version.
- Web is an approximation: `vx-glass` = `backdrop-filter` + translucent
  surface behind `@supports`; `tint` becomes the surface color; no
  merging or touch-tracking. The class is also stamped on native so apps
  can CSS their own fallback for non-glass OSes.

**Verified (iOS 26.5 sim, Xcode 26.6):** `liquidglass`/`liquidglasscontainer`
mount with `UIVisualEffectView` roots carrying live `UIGlassEffect` /
`UIGlassContainerEffect`; `glass` prop round-trips `iosGlassEffect` on the
host view — all sweep asserts green.

## Original Pressable & input sketches and later findings

```ts
interface PressableProps {
	onPress?
	onLongPress?
	onDoublePress?
	onPressIn?
	onPressOut?
	disabled?
	hitSlop?: number
	ignoreTouchAnimation?: boolean // opts out of TouchManager global press-scale
	className?
	style?
}
interface TextInputProps {
	value: string
	onChangeText?: (text: string) => void // NOT onChange(event) — RN convention
	onSubmit?
	onFocus?
	onBlur?
	placeholder?
	placeholderTextColor?
	keyboardType?
	returnKeyType?
	autocorrect?
	secure?
	editable?
	ref?: Ref<{ focus(): void; blur(): void }>
}
interface TextAreaProps extends TextInputProps {
	// shipped (props.ts)
	rows?: number // web `rows` attr / native minHeight (measured line height)
	autoGrow?: boolean // native default; web re-fits scrollHeight per commit
	maxRows?: number // cap → max-height (web) / maxHeight dip (native)
}
```

- `Pressable` native leaf: `flexboxlayout` (column) + `tap`/`longPress`
  gesture events — **not** `contentview` (single-child trap: the driver
  assigns each child to `.content`, dropping all but the last sibling);
  press feedback rides `TouchManager.enableGlobalTapAnimations` (ns-octane
  enables it globally — scale 0.95/1.0 easeOut) + the `vx-pressable`
  `:pressed` pseudo. Web leaf: `div` + pointer events + `:pressed` class
  hook for styling.
- **Single-child hosts on native**: `ContentView`/`Page` (and `ScrollView`)
  keep only the last reconciled child. Any imperative Octane root must host
  on a `GridLayout` (children fill + stack — single-child layout identical
  to ContentView) — or set `page.content = grid` and root on that where the
  host must be a `Page`. Applies to Modal, Tabs panes, nav pushes, and
  overlay/sheet hosts. List cells are driver-owned `ContentView`s, so the
  `List` leaf wraps `renderItem` output in a `gridlayout`.
- `className` on native must be a **space-joined string**: the driver
  applies it via `String(value)`, so an array arrives comma-joined and
  matches nothing. Leaves normalize with `cx()` (`packages/ui/src/cx.ts`).
- `TextInput` native: `textfield`/`textview`; `value` ↔ `text`; `onChangeText`
  ↔ `textChange`; `onSubmit` ↔ `returnPress`. Controlled write-back verified
  with **real keyboard input** (idb `ui text`): per-keystroke `textChange`
  accumulates correctly through `onChange → set → text=` and the selection
  survives the controlled writes. IME marked-text composition remains
  untested; Android still the higher-risk platform for setText cursor reset.
- **`Screen` children flow inside one inner flex column** (decision #39).
  RootLayout gives every direct child the full root bounds — siblings stack
  in document order and a later sibling's invisible area eats taps meant for
  earlier ones (pushed-page header HStack measured at the full root height,
  dead under the content View's overlap). The leaf renders one flexbox
  wrapper; app children are never direct rootlayout children.
- **Omitted props must not write `undefined`** (decision #40): the driver's
  `setProp` returns early on `undefined`. NS coerces `undefined` through
  native setters — `editable={undefined}` became `userInteractionEnabled=NO`:
  the field rendered with listeners but could never become first responder
  (real taps and `becomeFirstResponder()` both failed while AX tree looked
  normal). The current field-control contract derives native editability from
  `isDisabled` and `isReadOnly`, and always passes a boolean to the native
  view; `editable` is an implementation detail rather than a public prop.
- **Verify interaction with real input, not `notify()`**: `view.notify({tap})`
  delivers events without hit-testing — taps "worked" on views that were dead
  (stale JS node, `loaded=false`, no recognizers) or physically unreachable.
  idb/`ios-simulator-mcp` real UITouch + AX tree is the honest check.
- Escape-hatch prop bags (`ios`/`android`/`web`) carry genuinely divergent
  props; `hostSlot` stays leaf-internal — shared code expresses slots as props
  (`<Drawer main={…}>`), never the mechanism name.

## Text details

### RichText

`RichText` is the portable primitive for mixed inline formatting and tappable
runs:

```tsx
<RichText>
	<RichTextSpan text="Read " />
	<RichTextSpan className="link" onPress={openProfile} text="@alec" />
	<RichTextSpan text="'s post." />
</RichText>
```

The web leaf composes inline DOM spans. The native leaf renders one `label`
with a `formattedstring` child; `RichTextSpan` becomes a NativeScript `span`
with explicit `text` and `onLinkTap`. The explicit text assignment matters:
the current driver parents `FormattedString` → `Span`, but folding bare text
children into `Span.text` is part of provisional decision #25. A single string
child is accepted as a convenience and is normalized by the native leaf.

Use `className` for static run styles, `style` for dynamic values, and
`onPress` for a run-level tap. The root accepts only inline run children — do
not place `View` or other layout primitives inside it.

- Static text in shared code: `<Text>Hello {name}</Text>` — the native driver
  folds `#text` into `text` prop automatically (TextBase parents only).
- **Nested text = RN model.** `<Text>Hello <Text className="bold">world</Text></Text>`
  works on both targets. Mechanism on native:
  - `Text` leaf renders `<label>`; nested `Text` reads a `TextContext`
    (universal `createContext`/`useContext` — verified available) and renders
    `<span>` instead.
  - NS rich text is **flat**: one `formattedstring` with sibling `span`s —
    styled spans cannot nest as elements. The context carries accumulated
    `className`/`style` so inner spans inherit outer text styling; deeper
    nesting flattens into siblings (documented divergence from web, where
    spans nest).
- **Requires two driver extensions** (patch-package now,
  upstream PR candidate):
  1. `addViewChild`: `Span` under a `TextBase` parent auto-wraps into
     `formattedText` (create `FormattedString` lazily, splice at index).
  2. `syncText`/`attach`: `#text` under `formattedstring` folds into an
     implicit `Span`; `#text` under `span` sets `span.text` (note: Span.text
     collapses only the first `\n`/`\t` — acceptable).
     Without these, `<label><span/></label>` throws (`cannot host a <span>
child`) and text under `formattedstring` drops silently.
- **Exclusive-text rule**: `text` assignments are silent no-ops while
  `formattedText` is set — never mix bare text children and `Span` children
  under one `Text`… except via the accumulated-context path above, which
  normalizes strings into spans when siblings are elements. The leaf
  implements this normalization (children are inspectable renderable values);
  shared code just writes natural JSX.
- Span props: `color` (no `foregroundColor`), `fontSize`, `fontWeight`,
  `fontStyle`, `textDecoration`, `backgroundColor`; `linkTap` listener alone
  makes a span tappable → `onPress` on a nested `Text` maps to it.
- `numberOfLines`, `selectable` (native: `textview editable=false` is the
  closest analog — prop support differs), ellipsize — escape hatches.
- `line-height` on NS means **additive inter-line spacing**, not web's total
  line box — typography tokens must express the NS value (gap) vs web value
  (box height) distinctly.
- `Heading level={1-6}` primitive: `h1–h6` on web (semantic HTML matters);
  `label` with matching `.vx-h{n}` typography and header accessibility role
  on native. Both use the same 16px-based font-size scale.

## Refs

Use the primitive’s `bind` prop. The leaf forwards it to the intrinsic ref;
component `ref` is runtime-reserved. Handles are component-specific and may
expose an HTMLElement or NativeScript view, so keep raw host operations in
platform leaves. There is no shared `ref.native` escape-hatch contract; use
the package prop declarations for the handle a component actually supplies.

## What primitives deliberately do NOT do

- `useMeasure` observes by default. Use `{ observe: false }` when a single
  post-bind read is enough; native still listens for the initial `loaded` event
  so an early ref bind can settle after layout.
- `UITableView`/`RecyclerView` keep their platform-authentic recycling
  semantics. The shared `VirtualList` is a separate Octane-owned window,
  not a wrapper over those widgets; Stage 2 and subsequent performance
  evidence are recorded below.
- No `<style>` blocks inside shared components — sibling-scoped style blocks
  are a web feature; keep styles in the shared stylesheet + `className`.

## VirtualList feasibility (Stage 1; 2026-09-26)

The goal is a shared virtualized-list primitive with a useful common contract,
separate from the platform-authentic `UITableView`/`RecyclerView` exports. The
prototype compared a web-owned window and an Octane-owned window over native
`ScrollView` against the existing native recyclers. Heights came from item
data (`36`, `48`, `60`, `72` dip/px); native row bounds were measured after
layout. This proves windowing with known sizes, not FlashList v2's dynamic
measurement and correction of unknown row sizes.

| Candidate                                               | Evidence                                                                                                                                                                                                                                                                                       | Result                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Web window over a scroll div                            | 500 items; 9 rows mounted initially and 13 at index 200; variable row bounds matched; indexed jump made `r200` visible; prepending a 68 px row kept `r200` at the same screen offset and its keyed local state                                                                                 | Pass for this probe                                                                          |
| Octane window over NativeScript `ScrollView` on Android | 9 rows mounted initially; variable row bounds and indexed jump passed; prepending a 68 dip row kept `r200` at the same screen y (`282 → 282`)                                                                                                                                                  | Pass for this probe                                                                          |
| Octane window over NativeScript `ScrollView` on iOS     | 9 rows mounted initially; variable row bounds and indexed jump passed. The original split update shifted `r200` by `-36` dip; the retry committed items and logical offset together, then wrote the native offset after layout. `r200` stayed at y=343 (`0` dip drift) after prepending 68 dip | Passes the known-size prepend anchor gate; the successful update sequence is recorded in Q28 |
| Existing `UITableView` / `RecyclerView` leaves          | 10 iOS / 11 Android rows mounted for the initial viewport; indexed jump, visible-item query, and no cross-row state leak passed; prepend moved the target by `+72` / `+73` dip                                                                                                                 | Native recycling works, but these leaves do not yet meet the shared prepend-anchor behavior  |

The Stage 1 gate passes for the known-size probe on web, iOS, and Android.
Only the previously failing iOS anchor leg was rerun for that update; the web
and Android probes were unchanged. Decision #58 selects an **Octane-owned
window**: DOM scrolling on web and NativeScript `ScrollView` on iOS and
Android. Stage 2 validates this engine boundary for the vertical foundation.
Keep `UITableView`/`RecyclerView` in the platform subpaths for apps that
want their platform-authentic list behavior.

Stage 1 supplied row heights. Stage 2 verifies post-layout correction after a
measured row changes height (Q29). Recycling-safe reuse under fast scroll,
viewability callbacks, heterogeneous item types, grid/masonry, sticky rows,
load thresholds, and long-session performance remain untested; Q30 tracks the
fast-scroll and performance boundary. Small arrays remain `ScrollView` +
`items.map(...)`.

## VirtualList vertical foundation (Stage 2; 2026-09-27)

The shared `VirtualList` contract is implemented in the root UI barrel. It
accepts `items`, a stable unique `keyExtractor`, optional `getItemType`,
and `renderItem`, with optional `renderEmpty`, `renderHeader`,
`renderFooter`, and `renderSeparator` slots. Rows use measured variable
heights and a bounded window with one viewport of overscan. The window is
Octane-owned on every target: a DOM scroll container on web and NativeScript
`ScrollView` on iOS and Android. Native `UITableView`/`RecyclerView` remain
available for their platform-authentic behavior.

Rows outside the window unmount; this implementation does not recycle cell
instances. State local to an unmounted row is lost, so durable row state must
be kept outside the row and keyed by item identity. `getItemType` participates
in row identity but does not enable a recycled-cell pool. Feed/chat callbacks,
scroll handles, fast-scroll performance budgets, and advanced layouts remain
outside this stage.

The post-layout measurement gate changed row `r15` from 72 to 96 units while
keeping a keyed visible row within the 2-unit tolerance on all targets:

| Target           | Anchor drift | Window after correction |
| ---------------- | -----------: | ----------------------: |
| Web              |      0.28 px |         18 mounted rows |
| iOS simulator    |     0.00 dip |  9 visible / 24 mounted |
| Android emulator |     1.14 dip | 10 visible / 28 mounted |

Header, footer, separator, empty, and restore behavior also passed on web, iOS,
and Android. This validates measured-height correction and bounded windowing;
it does not establish FlashList v2 performance or feature parity. Decision #58
records the chosen engine boundary. Q30 tracks the remaining fast-scroll and
performance validation.

### VirtualList fast-scroll profile (Q30; 2026-09-28)

The first comparable pass used the shared 5,000-row variable-height fixture
(`32 + (index % 5) * 8`, 240,000 total units), 501 programmed 16 ms offset
checkpoints across a 12,000-unit forward/reverse stream, then five deep seeks.
Web ran in headless Chromium; native results came from the iOS simulator and an
Android emulator. Deep seeks had a 250 ms deadline to settle at a stable offset
with the expected visible rows mounted.

| Target            | Stream interval p50 / p95 / max (ms) | Lagged checkpoints | Deep seeks ready / 5 | Coverage gaps: stream / deep seek | Mounted rows p50 / max |
| ----------------- | -----------------------------------: | -----------------: | -------------------: | --------------------------------: | ---------------------: |
| Web               |                   16.8 / 18.2 / 25.3 |            0 / 501 |                5 / 5 |                             0 / 0 |                34 / 35 |
| iOS simulator     |                 51.4 / 165.2 / 220.2 |          110 / 501 |                1 / 5 |                             0 / 0 |                47 / 48 |
| Android emulator  |                  35.6 / 72.2 / 182.9 |          121 / 501 |                1 / 5 |                   0 / 3 snapshots |                49 / 50 |
| macOS AppKit host |                  47.2 / 58.1 / 155.0 |            6 / 501 |                4 / 5 |                  2 / 13 snapshots |                12 / 13 |

The macOS row is the AppKit dev host running the same trace through the
windowed `VirtualList.macos.tsrx` leaf (main + pending harness fixes;
evidence JSON). Its one timed-out deep seek (236,709) still converged to the
correct offset (0.31-unit error) with expected rows mounted — it missed the
benchmark's consecutive-stable-polls window, not the landing. The leaf
suppresses anchor correction and estimate rebuilds while a large jump's
measurements settle, and derives scroll offset from the top spacer's geometry
instead of document height, which had previously inflated the apparent error.

Rows mounted and unmounted were 650/650 on web, 711/711 on iOS, and 628/628
on Android. The Android deep-seek gaps reached 17 missing visible rows and a
320.76-dip gap. The 25 ms JavaScript timer's p95/max drift was 5.6/7.7 ms on
web, 197.6/273.4 ms on iOS, and 60.4/331.5 ms on Android. These are scripted
JavaScript responsiveness and geometry measurements; they do not measure
display vsync or reproduce wheel, trackpad, or touch-fling input. A seek timeout
means the offset, stability, and mounted-row checks missed the deadline; it
does not by itself mean the viewport was blank.

The programmed stream stayed gap-free on web and iOS; Android showed gaps
during deep seeks. The second pass below adds injected scroll gestures,
fixed-height data, and three-minute memory samples. Q30 remains open because
the inputs are synthetic, iOS variable-height scrolling reports uncovered
viewport geometry, and Android process memory trends upward.

### VirtualList input and memory profile (Q30; 2026-09-28)

The input pass used the same 5,000-row fixture. Web used Playwright mouse-wheel
events in headless Chromium; iOS used `idb ui swipe` on the simulator; Android
used `adb shell input swipe` on a physical OnePlus device. These repeatable
gestures exercise scrolling, but they do not reproduce a physical trackpad's
momentum or a person's finger movement. Runners: [web](../apps/web/scripts/bench-virtual-list-input.mjs)
and [iOS/Android](../apps/mobile/scripts/bench-virtual-list-input.mjs).

| Target         | Variable-height run | Max mounted rows |   Geometry gap samples |                                            Input timing |
| -------------- | ------------------: | ---------------: | ---------------------: | ------------------------------------------------------: |
| Web            |             181.4 s |               27 |              0 / 1,749 |            rAF p95/max 16.7/16.8 ms; 0 intervals >32 ms |
| iOS simulator  |             180.0 s |               42 | 272 / 6,055; max 37 pt | JS sample p95/max 56.4/233.4 ms; 2,192 intervals >32 ms |
| Android device |             180.0 s |               36 |              0 / 6,263 | JS sample p95/max 41.6/224.6 ms; 2,073 intervals >32 ms |

The short fixed-height (`48` unit) runs were gap-free on every target, with
max mounted rows of 27 on web, 42 on iOS, and 35 on Android. The short
variable-height iOS run also reported geometry gaps (64 / 673 samples, max 34
pt); its Android and web runs reported none. A geometry gap is an uncovered
viewport interval in sampled row bounds, not a visual screenshot assertion.

A 2026-09-30 recheck resolved the iOS gaps: they are UIScrollView elastic
overscroll, not a rendering defect. A 180-second run recorded `minOffset
-154.7` with `maxGap` equal to the overshoot depth; a 90-second rerun with
overscroll classified separately reported 83/83 gap samples at overscroll and
0 in-content. The trace now splits `overscrollGapSamples` from
`contentGapSamples` (leading gap while `offset < 0`, or trailing gap once the
last row is mounted) so future runs can't conflate bounce with a coverage
defect. Android reported none because its overscroll renders edge glow rather
than uncovered geometry.

During the three-minute variable-height runs, web's uncollected heap samples
fluctuated between 12.3 and 34.1 MB, then fell to 7.85 MB after forced GC
(6.02 MB before scrolling); DOM nodes returned to the 1,259-node baseline.
iOS host RSS varied from 329.8 to 356.8 MB and ended below its 339.3 MB start.
Android total PSS rose from 211 MB to 346 MB, with small dips between samples.
A 2026-09-30 emulator recheck (`xplat` AVD, same 3-minute variable-height run)
reproduced the climb (181→351 MB), then the trace called `globalThis.gc()` and
PSS fell ~157 MB to a ~194 MB plateau over the 45 s post-run tail — lazy
collection, not a leak; end state sat within ~13 MB of the start. The physical
OnePlus run remains unrechecked because the device dropped mid-run; the
emulator evidence answers the leak question but not the physical-device one.

Native timing here is the JavaScript snapshot polling interval; intervals over
32 ms are counted as lag. It does not measure display vsync or frame rate.
There were no physical trackpad or direct finger-input runs. Keep Q30 open;
the iOS gaps are resolved as overscroll and the Android memory climb as lazy
collection, but physical input remains uncollected before changing shared
overscan or adding recycling.

### VirtualList readiness recheck (Q30; 2026-09-30)

The baseline is main `4b43f82d`, checked in an isolated Goddard worktree. Prior
Q28/Q29/Q30 runtime results above remain historical evidence. No visual analysis
was performed in this pass.

A fresh 181.35-second Chromium synthetic-wheel baseline sampled 0 geometry gaps
in 1,754 samples, with at most 27 mounted rows. rAF callback intervals were
p95/max 16.7/16.8 ms, with no intervals above 32 ms. This does not establish
physical-trackpad behavior or compositor presentation timing. Live-list heap
was 6.38 MB before scrolling and 8.22 MB after forced GC; DOM nodes returned
to 1,379. Uncollected heap samples fluctuated, reaching 33.85 MB.

The existing web smoke asserted keyed-state retention after prepend but omitted
anchor geometry. A new nonvisual contract gate reproduced 54.64 px of prepend
anchor drift while local state survived. Restoring the keyed anchor when the
web leaf rebuilds its size index reduced drift to 0.094 px; above-anchor growth
then drifted 0.219 px. Five settled deep offsets mounted 22–23 rows, and
empty/restore/route disposal checks passed without browser errors. This is a
focused web fix; native overscan and recycling are unchanged.

The post-fix synthetic-wheel run lasted 181.51 seconds: 0/1,753 sampled
geometry gaps, at most 27 mounts, rAF p95/max 16.7/16.8 ms, and no intervals
above 32 ms. Collected live-list heap was 6.39→8.22 MB. Twenty disposal/reopen
cycles returned to 1,378 DOM nodes and 87 listeners; the last six collected
heap samples ranged 8.52–8.54 MB. This fixture does not prove universal leak
freedom. A fixed-48 control sampled 0/159 gaps over 16.39 seconds.

A separate programmed stream/deep-seek trace sampled 0/550 geometry gaps and
at most 29 mounts; all 501 stream checkpoints met the settling gate. Only
2/5 deep pixel seeks met the 250 ms offset/readiness gate. The three timeouts
had 59/169/87 px offset errors. Unknown-height pixel seeks remain approximate;
coverage and seek accuracy are separate results.

The iOS simulator build succeeded in 89.46 seconds and the isolated benchmark
app launched, but no ready/result telemetry arrived during nine minutes after
launch. Process-scoped logs contained no benchmark markers; accessibility
inspection exposed Simulator chrome but no application view tree. No gestures
or geometry samples were collected, so this is a blocked runtime attempt, not
a pass or reproduction of the historical gaps. No Android device was connected
at the final check: the historical uncollected PSS increase remains unresolved
and is not labeled a leak. Native presentation/frame pacing and direct finger/
physical-trackpad input were not collected. Directional velocity overscan remains
a hypothesis, with no native engine change justified by this pass.

The input trace now retains the worst measured leading/trailing/internal gap and its row bounds;
JavaScript sample timing stays explicitly separate from display frame pacing.
The [machine-readable evidence](evidence/virtual-list-q30-2026-09-30.json) retains
the fresh web results and native verification limits.
The [VirtualList guide](virtual-list.md) states the supported vertical contract
and the remaining performance-sensitive feed/chat gaps.

Capability references: [FlashList v2 usage](https://shopify.github.io/flash-list/docs/usage/)
for dynamic sizing, recycling-safe state, viewability, and visible-position
maintenance; [Lynx `list`](https://lynxjs.org/next/api/elements/built-in/list.html)
for a purpose-built virtualized list with a bounded viewport; and [Expo
Universal List](https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/list/),
which says React still creates all rows up front and recommends FlashList or
Legend List for large data.

### VirtualList Android scheduling corrections (Q30; 2026-10-01)

The List ×500 harness now has a dedicated `demo500` input profile. Android
window metrics report frame work separately from JavaScript snapshot intervals;
large reports are split into numbered records to survive console truncation.
Coverage includes actual header/footer and separator boxes. The fixed48 and
variable controls remain 5,000 rows.

Nonvisual runs used a dedicated API 35 arm64 emulator (`xplat`, 1080×2400,
420 dpi, approximately 60 Hz), a debug build, and synthetic ADB swipes: four
forward viewports followed by four back, repeated for 20 seconds. Each run
installed a fresh disposable benchmark app and sampled an additional 45-second
idle memory tail. No unrelated harness startup probes ran. The emulator uses
software graphics; another session's emulator also used this host.

| Fixture         | Before frame-work p95 | After A frame-work p95 | Before layout/measure p95 | After A layout/measure p95 | Before JS interval p95 | After A JS interval p95 |
| --------------- | --------------------: | ---------------------: | ------------------------: | -------------------------: | ---------------------: | ----------------------: |
| List ×500       |              94.59 ms |               84.94 ms |                   7.52 ms |                    2.78 ms |               63.39 ms |                51.91 ms |
| Fixed 48 ×5,000 |             211.96 ms |               49.16 ms |                  14.42 ms |                    2.36 ms |              132.32 ms |                35.53 ms |
| Variable ×5,000 |             141.99 ms |               54.01 ms |                  11.36 ms |                    2.28 ms |               85.23 ms |                36.49 ms |

All six captures had zero sampled content gaps. The ×500 mounted window stayed
at most 37 rows before and after A. Frames include first visits and revisits;
these aggregate percentiles do not isolate their costs. Baseline repeats for
×500 ranged approximately 95–234 ms at p95, so these samples establish reduced
work in this environment, not a reliable throughput or physical-device FPS
claim. Window frame-work duration does not measure presentation.

Phase A coalesces native scroll and measurement work at an animation-frame
boundary, cancels stale item measurements, and adds geometry corrections to the
live offset. Exact size updates remain logarithmic. Unvisited type estimates
rebuild only after a meaningful average change during an idle interval; measuring
another row with the same type average no longer resets the entire dataset.
The initial viewport populates immediately. Content-width validation also handles
border/padding differences, although this demo reported equal row and viewport
widths, so that edge case is not its measured cause. Row lifecycle remains keyed
mount/unmount; there is no recycling in phase A.

Native object-driver regressions cover intervening scroll movement, above-anchor
correction, burst commits, estimate stability, content width, stale measurements,
and disposal. The web 500-row contract gate also passed before this change.
Q30 remains open for physical-device frame pacing, longer momentum workloads,
and process-memory characterization. Follow the current nonvisual commands in
[VirtualList](virtual-list.md#run-the-nonvisual-gates).

### VirtualList positioned cell pool (Q30; 2026-10-01)

Phase B reuses type-compatible outer hosts on web, iOS, and Android and positions
rows using the measured prefix index. Logical item subtrees remain keyed: retained
rows keep state across prepend, while off-window rows unmount and reset local state.
At most eight free hosts are retained across all types. Assignment generations
reject obsolete measurements; emptying and disposal release the pool. NativeScript
hosts use `reusable` to survive keyed moves, with explicit destruction on removal.
Stable ref callbacks avoid destroying a reused host during reassignment.

A fresh A/B comparison used the same debug emulator, synthetic swipe sequence,
20-second trace, fresh installs, and 45-second idle memory tail described above.
Instrumentation counts actual native outer-view identities, separately from
logical item mounts. First visits and revisits are aggregated in each trace.

| Fixture         | A frame-work p95 | B frame-work p95 | A layout/measure p95 | B layout/measure p95 | A JS interval p95 | B JS interval p95 | A/B physical hosts added |
| --------------- | ---------------: | ---------------: | -------------------: | -------------------: | ----------------: | ----------------: | -----------------------: |
| List ×500       |         65.39 ms |         76.74 ms |              2.49 ms |              1.11 ms |          46.92 ms |          48.54 ms |                 199 / 19 |
| Fixed 48 ×5,000 |         45.04 ms |         30.55 ms |              1.90 ms |              0.72 ms |          34.40 ms |          24.15 ms |                 247 / 34 |
| Variable ×5,000 |         47.83 ms |         79.30 ms |              2.44 ms |              1.13 ms |          34.42 ms |          47.84 ms |                 232 / 30 |

All six traces had zero sampled content gaps. Maximum physical host counts were
37, 43, and 44 for both phases. Logical row mounts stayed approximately unchanged
(×500: 199 in each phase), as required by the state contract. Layout/measurement
p95 fell 54–62%; total frame work and JS responsiveness did not improve consistently.
A separate valid B ×500 trial reported 62.64 ms frame-work p95 and 1.23 ms
layout/measurement p95 with zero sampled gaps. Host contention and software graphics
limit timing repeatability. These results establish reduced layout work and host
churn, not smooth physical-device scrolling or presentation FPS.

Last idle process PSS samples, A/B respectively, were 182.4/185.2 MiB for ×500,
182.5/179.8 MiB for fixed48, and 179.7/176.5 MiB for variable. These short
process-memory tails do not establish a leak or long-session plateau. The runner
labels its collection phases; it does not force native GC.

Eleven native object-driver tests cover the scheduling/anchor contract, stale
assignments, row-state isolation, empty/restore, and host disposal. Pure pool tests
cover heterogeneous types and bounded spare retention. The fresh web contract gate
passed with prepend/growth drift 0.20/0.22 px, retained keyed state, deep offsets,
slots, empty/restore, and disposal. Fresh iOS device and Android mutation/anchor
checks remain outstanding; object-driver results are not on-device evidence.
Q30 remains open. FlashList and LegendList informed the ownership/positioning
strategy; no React Native package or new UI dependency was introduced.

## Appendix: verified driver semantics

Substrate pass findings — the mechanics that constrain everything above.
Kept at the end so the vocabulary reads first.

- **Text folds into `text` prop only under `TextBase` parents.** A `<label>`
  (or `<button>`, `formattedstring`) takes `#text` children; a `<stacklayout>`
  with text children **silently drops them**. → Bare text lives only inside
  text-hosting primitives (`Text`, `Button`, heading variants). Enforce at
  compile time via renderer `validation.textHosts`/`textParents` (decision
  #20) and at lint level.
- **Prop = direct view property assignment** (`view[name] = value`) — NS view
  properties, not DOM attributes. Type system derives props from the class
  (`ViewProperties<T>`), so unsupported props are type errors; unknown ones at
  runtime fail silently.
- **`style` object → `Object.assign(view.style, v)`**: camelCase `Style` keys,
  **dip units**. `style` string → `setInlineStyle` (CSS declarations).
- **`className`/`class` arrive as composed strings** (clsx upstream). Trap:
  NS className swap can leave stale backgrounds — workaround is
  `view.className=''` before the new value; driver currently assigns directly.
  Track whether we need a leaf-level or upstream fix.
- **Events arrive as `event` commands**, not props; `onTap`/`onClick`/
  `onPress`→`tap`, `onChange`→`textChange`, `onSubmit`→`returnPress`,
  `onX`→`x` lowercase-first. All classified `'discrete'` — watch whether
  continuous events (pan) need a priority lane.
- **`hostSlot` prop** wires a child into a named parent property
  (`mainContent`/`leftDrawer`) instead of `addChild` — our slot-prop pattern
  for Drawer/ActionBar.
- **Parenting throws** when a parent can't host a child type
  (`cannot host a <x> child`) — a runtime error class shared code avoids by
  staying inside the primitive vocabulary.
- **No portals on the NS driver** (capability absent — `createPortal` is a
  no-op) — `Overlay`/`Popover` open on `RootLayout.open()` with a dedicated
  `createNativeScriptRoot` per overlay (decisions #22, #33). The owning root
  is the declaring component's enclosing `Screen` shell via
  `rootLayoutFor(view)`, not `getRootLayout()` (which is the first-mounted
  root — wrong page after a push). **Verified in lab (Exp 9 + sweep)**:
  popover anchored + shade overlay on a pushed page assert OK on iOS.
- **`@{ {expr} }` tails silently compile to no output** — a braced
  expression at the end of a component template is a _statement_, not
  output. `Cell` rendered empty for an entire session undetected (no
  diagnostic). This IS documented in the TSRX spec
  (`research/tsrx/website-tsrx/public/llms.txt`: "the container must finish
  with exactly one output node… expression containers need a wrapping
  fragment") — the gap is a missing compile diagnostic, not semantics.
  Tail must be an output node: `<>{expr}</>`.
  Reported: [octanejs/octane#1258](https://github.com/octanejs/octane/issues/1258).
- **`<tabview>` can't parent `<tabviewitem>` children** — the driver's
  `addViewChild` throws for non-layout parents. The `Tabs` leaf uses the
  List pattern: `items` prop of `TabViewItem[]` whose `.view` is a
  `ContentView` hosting a per-pane `createNativeScriptRoot` (mounted on the
  tabview's `loaded` event). `items` for TabView is NOT driver-managed
  (ListView-only) — the leaf caches `TabViewItem[]` per tabs-array
  reference. **Same "managed items" ask as listview** — fold into the
  octane#1 upstream work.
- **Prop-write echoes are generic** — `checked`→`checkedChange`,
  `selectedIndex`→`selectedIndexChanged` echo just like `text`→`textChange`.
  Fixed in the driver patch (pendingPropWrites drops a write's own echo);
  leafs need no guards.
- **`visibility` command** maps `hidden`→`collapse` (out of layout AND screen).
- **Element re-registration recreates live instances in place** — plugin-view
  modules hot-reload cleanly; keep `registerElement` modules self-accepting.
