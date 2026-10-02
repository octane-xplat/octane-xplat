# Known limits

> Check which features are available, different, or still unfinished on
> the platforms you plan to use.

You don't need to read every table before starting. Find the feature your
app needs, then check the columns for your platforms. If you're using an
agent, ask it to account for those limits when adding the feature.

Most tables cover **web, iOS, and Android**. macOS and Windows are
experimental and have incomplete UI support. The Windows host can launch,
but that does not mean every control works; see
[Windows setup](../platform/windows-setup.md) and [Windows limits](../notes/windows-notes.md).
The [target guide](../start/spec.md#choose-your-targets) explains desktop setup.

Native macOS AppKit cannot play Lottie animations. Its explicit leaf displays
an unsupported label, reports `onError` on mount, and supplies no playback
handle or loaded/ended events. The harness motion-package route is also
unsupported: mobile gesture and reduced-motion hosts are not AppKit hosts.
The separate AppKit UI ref-animation fixture does not establish motion-package
support. Bamboo-generated CSS is unavailable on AppKit; Home uses only its
existing AppKit styles. See the [non-visual macOS checks](../apps/macos/README.md#non-visual-smoke-checks)
for runnable verification and runtime boundaries.

A **seam** is a part where shared code meets platform behavior, such as
opening a keyboard or camera. Each row describes one feature or seam.
**Kind** labels the limit:

- `unsupported` — absent on that target, by capability or by design
- `degraded` — available, but with reduced appearance or behavior
- `different` — available everywhere listed, but works differently
- `broken-upstream` — a reported bug in a tool Xplat uses, with no workaround here

**Verified** is the version the row was last checked against; the tables are
re-checked in the pre-release docs sweep. Rows marked `desk` are verified
against source only — on-device behavior is still pending.

The **normalization class** says which parts of a component Xplat aims to
make look the same across platforms. The
[architecture guide](../start/architecture.md#normalization-classes) explains the
labels. For example, Xplat supplies the frame around a `WebView`, while the
browser engine draws its contents. Those contents can look different without
breaking the frame's shared appearance.

```tsx
import { WebView } from '@octane-xplat/ui'

export function Help() {
	return <WebView src="https://example.com/help" className="flex-1" />
}
```

## Experimental AppKit renderer

`@octane-xplat/macos-renderer` has independent packed-consumer coverage for
system fonts, rendering updates, and the CLI's AppKit packaging contract. This
coverage does not establish OS input delivery or general UI-package parity.

The full `apps/macos` harness currently fails its build's platform boundary
check because `packages/ui/src/svg.mobile.ts` is reachable in the macOS graph.
A packaged raw button `performClick` check also throws an unrecognized
`buttonPressed` selector: the action string does not match the exposed
one-argument method. Direct debug handler dispatch bypasses that native action
path. These are separate follow-ups to the renderer extraction; see the
[renderer setup and verification boundary](../../packages/macos-renderer/README.md).

## Where the real OS widgets live

The shared UI surface aims for consistent behavior on its supported targets — self-drawn
controls (`Switch`, `Slider`, `Spinner`, `Tabs`, `Drawer`, `BottomSheet`,
`Dialog`, `AlertDialog`), chrome-reset OS controls (`TextInput`, `TextArea`,
`SearchInput`), and hosted surfaces (`WebView`, `Video`, `CameraView`)
whose parity claim stops at the frame plus self-drawn chrome. The
platform-authentic widgets are opt-in subpath imports, and a shared `.tsrx`
importing them fails the other platform's build on purpose:

```tsx
/** @jsxImportSource @nativescript-community/octane */
// PackedToggle.ios.tsrx: an explicit OS widget choice.
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackedToggle(props: { packed: boolean; onChange: (value: boolean) => void }) {
	return <UISwitch checked={props.packed} onCheckedChange={props.onChange} />
}
```

| Need                                   | Web                                                                  | iOS                                                              | Android                                                                             |
| -------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Recycled list                          | `ScrollableArea` + `@for`                                            | `UITableView` (`ui/ios`)                                         | `RecyclerView` (`ui/android`)                                                       |
| Shared modal surface                   | `Dialog`, `AlertDialog`, `BottomSheet`                               | shared self-drawn surfaces                                       | shared self-drawn surfaces                                                          |
| Platform modal dialog                  | —                                                                    | `UIModal` / `openModal` (`ui/ios`)                               | `MaterialDialog` / `openModal` (`ui/android`)                                       |
| Edge-swipe drawer                      | `Drawer` (self-drawn, no edge swipe)                                 | `SideDrawer` (`ui/ios`)                                          | `DrawerLayout` (`ui/android`)                                                       |
| OS switch / slider / spinner / tab bar | shared self-drawn set                                                | `UISwitch` / `UISlider` / `UIActivityIndicatorView` / `UITabBar` | `MaterialSwitch` / `SeekBar` / `CircularProgressIndicator` / `BottomNavigationView` |
| Hover interactions                     | `HoverCard`, `Tooltip` (shared; macOS = `NSPopover` via host bridge) | `HoverCard` opens on tap; `Tooltip` passes through               | `HoverCard` opens on tap; `Tooltip` passes through                                  |
| Liquid glass                           | —                                                                    | `LiquidGlass` / `LiquidGlassContainer` (`ui/ios`)                | —                                                                                   |

`ui/ios` and `ui/android` resolve only in native builds; `ui/web` only in
web builds. `ui/native` is plumbing (root-layout helpers), not components.

## VirtualList performance

`VirtualList` supports a measured vertical window, with off-window unmounts.
It has no recycling pool, feed/chat callbacks, indexed scroll handle, sticky
rows, grid, or masonry. Native variable-height momentum, long-session memory,
and display frame pacing remain Q30 gates; historical evidence is not a fresh
runtime pass. See the [measured support boundary](../app/virtual-list.md#measured-support-boundary)
and [readiness evidence](../notes/primitive-notes.md#virtuallist-readiness-recheck-q30-2026-09-30).

```tsx
import { VirtualList, Text } from '@octane-xplat/ui'

export function PackingList(props: { items: { id: string; label: string }[] }) {
	return (
		<VirtualList
			items={props.items}
			keyExtractor={(item) => item.id}
			renderItem={(item) => <Text>{item.label}</Text>}
		/>
	)
}
```

## Primitives

| Seam                                                   | Web                                                                                     | iOS                                                                                                                                                                                                                                                                                                                                               | Android                                                                                           | Kind                        | Verified        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- | --------------- |
| `ScrollableArea`                                       | scrolling, axis-aware; `axis="both"` supports nested native lists                       | block/inline scrolling with pull-to-refresh; `axis="both"` renders a non-scrolling shell                                                                                                                                                                                                                                                          | same as iOS                                                                                       | `different`                 | post-0.7.0·desk |
| `Pager`                                                | scroll-snap row; `onPageChange` fires ~90ms after the scroll goes idle                  | UICollectionView paging via `@nativescript-community/ui-pager` (real dependency of the `@octane-xplat/pager` leaf — merges transitively, no app declaration); per-page Octane roots; unverified on device                                                                                                                                         | ViewPager2 via the same plugin; unverified on device                                              | `different`                 | post-0.5.0·desk |
| `SearchInput`                                          | `<input type=search>`; webkit's own ✕ hidden so the drawn one matches                   | TextField, `returnKeyType=search`; glyph tint via `svgview` `currentColor` unverified                                                                                                                                                                                                                                                             | same as iOS                                                                                       | `different`                 | post-0.5.0·desk |
| `SegmentedControl`                                     | equal-width segments (`width:0`+`flex-grow` — `flex-basis` is dead on NS)               | identical classes/geometry; tap only (no arrow-key nav) — Space/Enter on web                                                                                                                                                                                                                                                                      | same as iOS                                                                                       | `different`                 | post-0.5.0·desk |
| `ContextMenu` trigger                                  | right-click                                                                             | long-press                                                                                                                                                                                                                                                                                                                                        | long-press                                                                                        | `different`                 | 0.5.0           |
| `Tokenizer` backspace removal                          | removes the last token when Backspace is pressed on an empty web input                  | native text fields do not emit keydown; remove with each token’s ✕                                                                                                                                                                                                                                                                                | same as iOS                                                                                       | `different`                 | post-0.7.3·desk |
| `TextArea` `onSubmit`                                  | fires on Cmd/Ctrl+Enter                                                                 | fires only when `returnKeyType` is `done`/`send`                                                                                                                                                                                                                                                                                                  | same as iOS                                                                                       | `different`                 | 0.5.0           |
| Nested `Text`/`RichText`                               | spans nest                                                                              | flat sibling spans — context carries inherited styles                                                                                                                                                                                                                                                                                             | same as iOS                                                                                       | `different`                 | 0.5.0           |
| `line-height`                                          | total line box                                                                          | additive inter-line spacing                                                                                                                                                                                                                                                                                                                       | same as iOS                                                                                       | `different`                 | 0.5.0           |
| `useMeasure` `x`/`y`                                   | viewport-relative                                                                       | screen-relative dips                                                                                                                                                                                                                                                                                                                              | same as iOS                                                                                       | `different`                 | 0.5.0           |
| `ref` value                                            | `HTMLElement`                                                                           | NativeScript `View`                                                                                                                                                                                                                                                                                                                               | NativeScript `View`                                                                               | `different`                 | 0.5.0           |
| `onInput`/`onChange`                                   | can re-dispatch — keep handlers idempotent                                              | once per edit                                                                                                                                                                                                                                                                                                                                     | same as iOS                                                                                       | `degraded`                  | 0.5.0           |
| `accessibilityState`                                   | independent ARIA booleans                                                               | single enum, strongest wins (disabled→selected→checked)                                                                                                                                                                                                                                                                                           | same as iOS                                                                                       | `degraded`                  | 0.5.0           |
| `accessibilityRole`                                    | full ARIA spellings                                                                     | narrower NS enum (`tab`→`button`, `heading`→`header`, …)                                                                                                                                                                                                                                                                                          | same as iOS                                                                                       | `different`                 | 0.5.0           |
| `Icon`/`Image` SVG                                     | DOM `<svg>`                                                                             | SVGKit                                                                                                                                                                                                                                                                                                                                            | AndroidSVG — no SVG filters, limited text/radial gradients                                        | `degraded`                  | 0.5.0·desk      |
| `Image` animated raster                                | `<img>` animates GIF/webp                                                               | static first frame (core `image` is single-frame) — `AnimatedImage` (`@octane-xplat/gif`) for animation                                                                                                                                                                                                                                           | same as iOS                                                                                       | `different`                 | post-0.5.0·desk |
| `AnimatedImage` (`@octane-xplat/gif`)                  | `<img>`                                                                                 | SDWebImage `SDAnimatedImageView` via `ui-image`                                                                                                                                                                                                                                                                                                   | Fresco `DraweeView` via the same plugin                                                           | `different`                 | post-0.5.0·desk |
| `Canvas` (`@octane-xplat/canvas`)                      | `<canvas>` — `2d`/`webgl`/`webgl2`/`webgpu` contexts; WebGPU = WGSL via `navigator.gpu` | `@nativescript/canvas` (Skia+wgpu core) — same context kinds; `getGPU()` stands in for `navigator.gpu`                                                                                                                                                                                                                                            | same as iOS                                                                                       | `different`                 | post-0.5.0·desk |
| `ShaderEffect` (`@octane-xplat/effects/{ios,android}`) | no per-element fragment shader exists — unsupported                                     | SwiftUI stitchable Metal on the rendered subtree, iOS 17+; bundled set (`heatHaze`/`sheen`/`shatter`) ships as a precompiled `.metallib` in the leaf; custom names register via `XplatShaderEffectRegistry`                                                                                                                                       | AGSL `RuntimeShader` via `RenderEffect`, API 33+, inert below                                     | `unsupported` / `different` | post-0.5.0·desk |
| `Table`/`Selector`/menus                               | bounded, unvirtualized                                                                  | bounded, unvirtualized — large data → `UITableView`                                                                                                                                                                                                                                                                                               | → `RecyclerView`                                                                                  | `degraded`                  | 0.5.0           |
| `WebView` document pixels                              | Chromium iframe                                                                         | WKWebView                                                                                                                                                                                                                                                                                                                                         | android.webkit.WebView — page content renders in each engine; only the frame chrome is normalized | `different`                 | 0.5.0·desk      |
| `WebView` `matchContents`                              | same-origin iframe document height; cross-origin internals are inaccessible             | reported content size; runtime behavior not device-verified                                                                                                                                                                                                                                                                                       | reported content height with host width; runtime behavior not device-verified                     | `different`                 | post-0.6.0·desk |
| `WebView` `onError`                                    | iframe `error` event does not fire reliably cross-browser                               | `loadFinished` carries the error string                                                                                                                                                                                                                                                                                                           | same as iOS                                                                                       | `degraded`                  | 0.5.0·desk      |
| `WebView` `scrollEnabled={false}`                      | `scrolling="no"` (deprecated attr, still honored)                                       | `scrollView.scrollEnabled`                                                                                                                                                                                                                                                                                                                        | touch-move interception — drag text selection inside the frame is lost                            | `degraded`                  | 0.5.0·desk      |
| `WebView` `sandbox`                                    | typed prop, default token list applied                                                  | unsupported — no-op (WKWebView is already isolated)                                                                                                                                                                                                                                                                                               | same as iOS                                                                                       | `unsupported`               | 0.5.0·desk      |
| `WebView` JS bridge                                    | unsupported — no `injectedJavaScript`/`postMessage`; use the `web:` bag                 | unsupported — use the `ios:` bag                                                                                                                                                                                                                                                                                                                  | unsupported — use the `android:` bag                                                              | `unsupported`               | 0.5.0·desk      |
| Pull-to-refresh                                        | pointer/touch drag translates scroller in clipped wrapper                               | UIScrollView bounce + `contentInset` dock; pan observer rides alongside scroll pan                                                                                                                                                                                                                                                                | damped drag translates scroller; edge glow off                                                    | `different`                 | 0.5.0·desk      |
| BottomSheet `snapPoints`                               | drag-to-snap via grabber strip; fractions of viewport height                            | same in-window path — RootLayout host + translateY offsets                                                                                                                                                                                                                                                                                        | same in-window path — no BottomSheetBehavior dependency                                           | `different`                 | post-0.7.0·desk |
| `Video` surface pixels                                 | `<video>` (engine-owned) — `controls=false`; transport is self-drawn and identical      | `xplatvideo` via `@nstudio/nativescript-exoplayer` (real dependency of the `@octane-xplat/video` leaf — merges transitively; pulls the `ASBPlayerSubtitling` pod) — AVPlayerViewController                                                                                                                                                        | ExoPlayer2 (`com.google.android.exoplayer:exoplayer:2.17.1` gradle dep) via the same plugin       | `different`                 | post-0.5.0·desk |
| `Video` `onError`                                      | maps `MEDIA_ERR_*` codes                                                                | unsupported — the plugin logs player errors, emits no event                                                                                                                                                                                                                                                                                       | same as iOS                                                                                       | `unsupported`               | post-0.5.0·desk |
| `Video` `onEnded`                                      | suppressed under `loop` (`ended` never fires)                                           | suppressed under `loop` to match — the plugin still emits `finished`                                                                                                                                                                                                                                                                              | same as iOS                                                                                       | `different`                 | post-0.5.0·desk |
| `Video` seeking                                        | `currentTime` write while scrubbing                                                     | `seekToTime` per drag event — no debounce                                                                                                                                                                                                                                                                                                         | same as iOS                                                                                       | `degraded`                  | post-0.5.0·desk |
| `CameraView`                                           | `getUserMedia` → muted/autoplay `<video>`                                               | `AVCaptureSession` + `AVCaptureVideoPreviewLayer`; simulator availability unverified                                                                                                                                                                                                                                                              | CameraX `PreviewView`, lifecycle-bound by the leaf                                                | `different`                 | post-0.6.0·desk |
| `CameraView` `onReady`                                 | video `playing` event                                                                   | after `AVCaptureSession.startRunning()` returns; does not confirm a rendered frame                                                                                                                                                                                                                                                                | after CameraX binds the preview use case; does not confirm a rendered frame                       | `degraded`                  | post-0.6.0·desk |
| `Lottie` (`@octane-xplat/lottie`)                      | `lottie-web` svg renderer in a plain div                                                | `CompatibleAnimationView` via vendored `@nativescript-community/ui-lottie` (`src/vendor/ui-lottie` — submodule of `octane-xplat/ui-lottie` @ `xplat-vendored`; lottie-ios pinned to commit fd75f8a)                                                                                                                                               | `LottieAnimationView` via the same vendored source (lottie-android 5.2.0)                         | `different`                 | post-0.6.0      |
| `Lottie` `duration`/`progress` units                   | ms and 0..1 everywhere                                                                  | plugin reports `duration` in seconds — leaf ×1000; progress already 0..1                                                                                                                                                                                                                                                                          | plugin reports ms; progress 0..1                                                                  | `different`                 | post-0.6.0      |
| `Lottie` vendored plugin                               | —                                                                                       | fixes unreleased upstream ship in the leaf — dead sync-src, missing `compositionLoaded`/`loadFailed` on iOS, URL src, `.lottie` zip, async autoPlay, completion dedupe, `declare` fields (modern-bundler compat); staged as PR branches on `octane-xplat/ui-lottie` (fixes on `xplat-fixes`; `xplat-vendored` adds only vendoring-compat markers) | same as iOS                                                                                       | `different`                 | post-0.6.0      |

Overlay roots (`Dialog`, `BottomSheet`, `UIModal`, `MaterialDialog`) mount a
separate Octane root on every platform — `useContext` does not cross into
them. Theme classes are forwarded; pass values as props or use module-level
signals. Reading context inside the new root does not recover a provider
from the presenting screen.

```tsx
import { Dialog, Text } from '@octane-xplat/ui'

export function Preview(props: {
	open: boolean
	title: string
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Dialog isOpen={props.open} onOpenChange={props.onOpenChange}>
			<Text>{props.title}</Text>
		</Dialog>
	)
}
```

The self-drawn set compiles on both leaves, passes the web smoke suite, and
renders in the harness `components` sweep on iOS; the Android nested-stack
sweep remains skipped because it asserts native `Page`/`Frame` objects —
pushes themselves work through the swap-pane route store.

## Navigation

Fresh Web release navigation checks on 2026-09-30 pass 14/14, including
retained guard/loader results during history traversal and cold baked-route
loads. Native ordering has focused mocked coverage, but the new native release
suite has no passing runtime report. Shared locks blocked follow-up runs;
the isolated Android release built with Temurin JDK 21, but its newly
available emulator is lock-blocked. Both iOS releases built but timed out without a
report; a direct diagnostic launch was denied by `SBMainWorkspace`
(`FBSOpenApplicationServiceErrorDomain`, code 1). Historical target evidence does not close these gaps. See
[navigation checks](navigation-checks.md) for reproduction and scope.

| Seam                                             | Web                                                                                                                                                                                                                 | iOS                                                                                                                                                                                                                                                                                        | Android                                                                                                                                                                                              | Kind        | Verified        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------- |
| Push into a named stack                          | nested-outlet URL push                                                                                                                                                                                              | `UITabBar` Frame navigates natively — the router re-arms `isLoaded` before push and pop; the [NS#11446](https://github.com/NativeScript/NativeScript/pull/11446) fix (items-churn root cause + `topmost()` ranking) ships in the Xplat core patch. Shared `Tabs` panes use the route store | router-owned swap pane — pushed routes render through `RouteHost` inside the platform tab pane, so named pushes never touch the fragment manager (`BottomNavigationView` behaves like shared `Tabs`) | `different` | 0.6.0·desk      |
| Hardware back                                    | browser back → `popstate`                                                                                                                                                                                           | — (no hardware back)                                                                                                                                                                                                                                                                       | wired; `useBackInterceptor()` can handle back before route pop; pop-while-pushed not yet verified live                                                                                               | `different` | 0.6.0·desk      |
| Route params                                     | scalar params form path/query values; low-level objects/arrays JSON-encode with a warning (non-serializable values become empty strings)                                                                            | objects survive                                                                                                                                                                                                                                                                            | objects survive                                                                                                                                                                                      | `degraded`  | 0.5.0           |
| `popRoute(stack)`                                | `history.back()` regardless of `stack`                                                                                                                                                                              | pops that stack                                                                                                                                                                                                                                                                            | pops that stack                                                                                                                                                                                      | `different` | 0.5.0           |
| Programmatic routes (`defineRoutes`/`addRoutes`) | literal `path` strings infer names/params at the callsite (`ManifestRoute*` helpers merge into generated types); only runtime-computed paths stay outside the typed surface — use the `Route` shape and `screenFor` | same boundary                                                                                                                                                                                                                                                                              | same boundary                                                                                                                                                                                        | `different` | post-0.6.0·desk |

## Platform services

| Seam                                        | Web                                                                                                                                                                                                    | iOS                                                                                                                | Android                                                                                                             | Kind                                                                                                                                               | Verified              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `appInfo`                                   | unsupported — no trustworthy bundle identity                                                                                                                                                           | `NSBundle` metadata                                                                                                | package metadata                                                                                                    | `unsupported`                                                                                                                                      | 0.5.0                 |
| `openSettings`                              | unsupported                                                                                                                                                                                            | app Settings URL                                                                                                   | app-details intent                                                                                                  | `unsupported`                                                                                                                                      | 0.5.0·desk            |
| `biometrics`                                | unsupported — local-presence only; auth ceremonies use `webAuthn`/`authSession`                                                                                                                        | FaceID/TouchID                                                                                                     | Keystore biometric                                                                                                  | `unsupported`                                                                                                                                      | 0.6.0·desk            |
| `webAuthn`                                  | `navigator.credentials` over the RP's JSON options                                                                                                                                                     | unsupported — hosted ceremony via `authSession` (native passkey sheet needs associated domains)                    | same as iOS                                                                                                         | `unsupported`                                                                                                                                      | 0.6.0·desk            |
| `authSession`                               | unsupported — plain navigation; use `webAuthn`/routes directly                                                                                                                                         | ASWebAuthenticationSession (intercepted callback scheme, no URL-type needed)                                       | Chrome Custom Tab + deep-link return — the app must declare `callbackScheme`'s intent-filter like any incoming link | `unsupported`                                                                                                                                      | 0.6.0·desk            |
| `secureStorage`                             | unsupported — no enclave                                                                                                                                                                               | Keychain                                                                                                           | Keystore                                                                                                            | `unsupported`                                                                                                                                      | 0.5.0                 |
| `haptics`                                   | `navigator.vibrate` — Android Chrome only; unsupported elsewhere                                                                                                                                       | Taptic Engine                                                                                                      | Vibrator                                                                                                            | `degraded`                                                                                                                                         | 0.5.0                 |
| `share`                                     | `navigator.share`, else clipboard copy (`'copied'`)                                                                                                                                                    | share sheet                                                                                                        | share sheet                                                                                                         | `degraded`                                                                                                                                         | 0.5.0                 |
| `systemBars.setStatusBarStyle`              | no-op — `setColor` writes `theme-color` meta instead                                                                                                                                                   | works                                                                                                              | works                                                                                                               | `unsupported`                                                                                                                                      | 0.5.0                 |
| `notifications`                             | local `Notification` only                                                                                                                                                                              | local + push (APNs)                                                                                                | local + push (FCM)                                                                                                  | `degraded`                                                                                                                                         | 0.5.0·desk            |
| `media.ensure('camera')` / `capturePhoto()` | Permissions API query may report `unsupported`; `capturePhoto()` uses `<input capture>` (mobile camera UI, desktop file picker)                                                                        | native camera permission request + still capture in OS camera UI                                                   | same as iOS                                                                                                         | `different`                                                                                                                                        | 0.6.0·desk            |
| `@octane-xplat/lingui`                      | catalogs load via `import.meta.glob` loaders; `navigator.language` detection; unit-tested                                                                                                              | `Device.language` detection; glob catalog loading and `Intl.PluralRules` on the NS runtime not yet device-verified | same as iOS                                                                                                         | `different`                                                                                                                                        | post-0.7.3·desk       |
| `files`                                     | `pick` → blob URL; `writeText` triggers a download                                                                                                                                                     | real file paths                                                                                                    | real paths; SAF `content://` reads                                                                                  | `different`                                                                                                                                        | 0.5.0·desk            |
| `@octane-xplat/sqlite`                      | sqlite-wasm in a Worker; persists via OPFS sync-access-handle pool (no COOP/COEP needed), `persistent: false` and transient where OPFS is denied; `each` materializes the full result before iterating | `@nativescript-community/sqlite` (FMDB) — `threading` on by default                                                | same plugin (`com.akylas.sqlite`)                                                                                   | system libsqlite3 via metadata C-interop — real file db, same durability as mobile; requires the regenerated `metadata.nsmd` (sqlite3/dlfcn sweep) | post-0.7.0·web, macos |

The table above lists web, iOS, and Android. On macOS, `share.text()` and
`share.url()` open the AppKit share picker; file sharing is not supported.
The native AppKit notifications leaf uses UserNotifications for immediate local
requests; see [setup and verification limits](../platform/local-notifications.md). Push
registration, delayed scheduling, and cancellation are outside its public API.

```ts
import { share } from '@octane-xplat/share'

const result = await share.url('https://example.com/trips/42', 'Summer trip')
if (result === 'unavailable') console.log('Sharing unavailable')
```

## Same edge on every target

- **TS 7 content-mapper declarations need output mapping.** The classic TS 5.9
  `tsrx-tsc` path emits `.d.ts`, but preserves explicit `.tsrx` imports that
  plain TypeScript consumers cannot resolve. `tsrx-typegen` rewrites those
  references for the package's published JavaScript layout. Native TS 7 emits
  `Component.d.tsrx.ts` and also needs upstream declaration output mapping
  (TS#64053 / draft TS#64120). — post-0.6.0·desk.
- **Packed declaration checks do not prove prop semantics.** `tsrx-typegen
--pack-check` verifies tarball paths, dependency declarations, and runtime
  value-export names; keep a plain TypeScript consumer test for required props,
  inference, and each supported module-resolution mode. — post-0.6.0·desk.
- **`@nativescript/vite` release builds could ship without CSS.** In 8.0.11
  the CSS-inlining pass missed its placeholder once minified (the marker
  contains backticks) and concatenated vendor CSS after app CSS — reported
  upstream as NativeScript/NativeScript#11476, fixed upstream: 8.0.16's
  sentinel regex accepts template literals and `collectBundleCssAssets`
  orders assets by module import order. — 0.6.0·reported, resolved 8.0.16.
- **`.tsrx` infers effect deps from closure reads.** An effect that only
  writes (refs, DOM) and never reads its driving prop compiles to a deps
  array that omits it — declare deps explicitly:
  `useLayoutEffect(fn, [props.value])`. — 0.5.0.
- **Literal `@{` in JSX text** parses as a code block: evaluated and
  discarded on web, a compile error on native. Write `{'@'}{expr}` —
  `<Text>{'@'}{user.handle}</Text>` renders `@handle`. Upstream fix
  intentionally not pursued. — 0.5.0.
- **`.tsrx` files reject `async` top-level functions** — the compiler
  treats them as async components, and an `async` function that never
  awaits still breaks `ns build`. Drop the keyword. — 0.5.0.
- **`Grid` `gap` was removed** — use child margins. The leaves keep a
  one-time console warning as a migration hint for one release. — 0.5.0.
- **`console.debug` doesn't exist on device** — use `console.log`. The
  lint ruleset flags it. — 0.5.0.
- **Deep imports don't extension-resolve** — barrel imports only. — 0.5.0.
- **Deep imports under `@nativescript/core/ui/*`** bundle as a second
  module instance — import from `@nativescript/core` only. Lint-enforced.
  — 0.5.0.
- **Plain `.ts` files escape the compiler's DOM-global checks** — `pnpm
lint` (`xplat/no-dom-globals`) is the backstop; keep DOM code in `.tsrx`
  leaves where possible. — 0.5.0.
- **No `PLATFORM` constant** — platform divergence goes through leaf
  files, by design. — 0.5.0.
- **Text controls stay OS-backed** — caret, selection UI, IME, autocorrect
  toolbars, secure entry, and keyboard types remain platform-native by
  design. — 0.5.0.
- **`flex-shrink` defaults to 0, not CSS's 1** — NativeScript's shrink
  pass has no min-content floor (it clamps at the explicit `min-*`
  property), so tokens.css normalizes to React Native semantics on all
  targets. Overflow regions opt in with `flex-1`/`shrink` +
  `min-h-0`/`min-w-0`; `ellipsize`/`numberOfLines` text re-enables shrink
  itself. iOS row-axis shrink re-measures the child but keeps natural
  frame width. — post-0.5.0, verified ios-sim 2026-09-26.

## Motion leaf

`@octane-xplat/motion` supports numeric transforms and opacity on web/iOS/Android,
plus `whileTap`/`whileFocus`, lifecycle callbacks, `motion.create`, `useAnimate`,
repeat/per-key transitions, duration/bounce springs, bounded variants with custom
resolvers, inherited animate labels, and child stagger/when timing. Exit/interaction
labels resolve locally; child timing applies to animate runs. Layout animation,
`whileHover`/`whileInView`, keyframe arrays, and arbitrary CSS/SVG properties are
excluded. Existing CSS transforms need an outer container.
Declarative tweens delegate to `UIViewPropertyAnimator` (iOS) and
`ViewPropertyAnimator` (Android); springs, reduced-motion runs, and
gesture-driven values stay on the JS engine. See
[motion compatibility](../../packages/motion/UPSTREAM.md) for lifecycle and
engine boundaries. DOM and universal object-driver tests do not establish
physical-device frame pacing or gesture arbitration; those checks remain pending.
The Android delegated path has not run on a device or emulator yet.

```tsx
import { motion, useAnimate } from '@octane-xplat/motion'
import { View, Pressable, Text } from '@octane-xplat/ui'

const MotionCard = motion.create(View)
export function Card() {
	const [scope, animate] = useAnimate()
	return (
		<>
			<MotionCard
				ref={scope}
				initial="hidden"
				animate={['visible', 'selected']}
				custom={20}
				variants={{
					hidden: { opacity: 0 },
					visible: { opacity: 1 },
					selected: (x: number) => ({ x }),
				}}
				whileTap={{ scale: 0.95 }}
				whileFocus={{ scale: 1.05 }}
				transition={{
					default: { duration: 0.2 },
					x: { type: 'spring', duration: 0.5, bounce: 0.2 },
				}}
				onAnimationStart={() => console.log('Started')}
				onAnimationComplete={() => console.log('Finished')}
			>
				<motion.View animate={{ opacity: 1 }} transition={{ repeat: 1, repeatType: 'reverse' }} />
			</MotionCard>
			<Pressable
				onPress={() => {
					void animate({ x: 40 }, { duration: 0.2 })
				}}
			>
				<Text>Move</Text>
			</Pressable>
		</>
	)
}
```

Bounded declarative drag supports numeric box constraints, scalar elasticity,
and velocity spring settlement. Ref constraints, inertia parity, per-edge
elasticity, dragControls, direction lock, propagation, and layout projection
remain excluded. Native requires the optional gesturehandler peer and app-side
`install()` before root creation; there is no raw-pan fallback. Axis thresholds
are configured for scroll arbitration, but OS drag-inside-ScrollView delivery
remains unverified. The retained probe exercises synthetic web pointers and
iOS plugin handler notifications only. Android drag runtime is unverified.
Existing `onPan` keeps its raw NativeScript observer path and its arbitration
limits. See [drag setup](../app/animation-gestures.md#drag-a-component).

```tsx
import { motion } from '@octane-xplat/motion'

export function DragCard() {
	return <motion.View drag="x" dragConstraints={{ left: -40, right: 40 }} dragElastic={false} />
}
// Native entry separately calls gesturehandler's install() before root creation.
```

Presence retains live subtrees through exit on all three targets. This differs
from upstream Octane motion's DOM cloning; there is no AnimatePresence alias.
It adds a View wrapper, releases exiting focus without automatically restoring
it, and ends immediately if an ancestor unmounts. A physical iPhone test
confirmed keyboard dismissal on exit and that a retained input can be focused
again after reversal; it did not test touch or assistive-accessibility
suppression while the subtree is exiting. Physical Android Presence behavior
remains unverified. See the
[presence guide](../app/animation-gestures.md#retain-content-through-exit).

```tsx
import { Presence, motion } from '@octane-xplat/motion'
import { TextInput } from '@octane-xplat/ui'

export function Panel(props: { open: boolean }) {
	return (
		<Presence present={props.open}>
			<motion.View animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
				<TextInput placeholder="Note" />
			</motion.View>
		</Presence>
	)
}
```

## Optional-service verification

Support flags describe API availability, not production qualification. See
[optional-service qualification](../notes/optional-service-qualification.md) for the fresh
Web/iOS/Android results, historical camera/pod corrections, and feature-specific
credential, signing, physical-output and runtime gaps. Optional service gaps
apply to apps relying on those capabilities; they are not blanket core-release
blockers.

## Rich text leaf

`@octane-xplat/richtext` (the `RichTextEditor` component) edits real rich text
through WordPress Aztec's `AztecText` on Android — a `Spannable`-backed
`EditText` — and a bundled local WKWebView on macOS. The iOS leaf is a stub
rendering an unsupported placeholder; web and Windows return `supported:
false` and render nothing (the tiptap facade below covers web). Android
content in/out is HTML via Aztec `fromHtml`/`toPlainHtml`; Kotlin default
parameters are not bridged, so the leaf passes explicit arguments. AppKit
uses StarterKit and asynchronous snapshots. Real OS keyboard input, selection,
and hit-testing remain unverified; see [AppKit editing](../app/rich-text.md#macos-appkit-editing).

```tsx
import { RichTextEditor } from '@octane-xplat/richtext'
import { useSignal$ } from 'octane/signals/client'

export function Notes() {
	const html$ = useSignal$('<p>Packing list</p>')
	return <RichTextEditor value={html$.get()} onChange={(html) => html$.set(html)} />
}
```

`@octane-xplat/tiptap` (the `TiptapEditor` component) is the unified facade:
web renders `@octanejs/tiptap`'s `EditorContent` over a real tiptap `Editor`,
macOS runs the bundled live Tiptap engine in WKWebView, and Android renders
`RichTextEditor` and adds tiptap document JSON interchange
through DOM-free ProseMirror slices (`@tiptap/pm` model/state,
`@tiptap/static-renderer`) with a `zeed-dom` `DOMParser` shim for
`generateJSON`. The bridge loads lazily; `onJSONReady(false)` or a null
`getJSON()` means the runtime can't host it. Document models diverge:
Aztec's flat span list is not ProseMirror's tree, so `getJSON` output is a
best-effort mapping and HTML is the reliable interchange. Formatting parity
is bounded to the shared `TiptapFormat` vocabulary; `taskList`, `highlight`,
`subscript`/`superscript`, and `align*` no-op on web and AppKit (StarterKit
lacks them).
iOS facade renders the same unsupported stub.

```tsx
import { TiptapEditor } from '@octane-xplat/tiptap'
import { useSignal$ } from 'octane/signals/client'

export function Notes() {
	const html$ = useSignal$('<p>Packing list</p>')
	return <TiptapEditor value={html$.get()} onChange={(html) => html$.set(html)} />
}
```

`@octane-xplat/lexical` (the `LexicalEditor` component) is the same facade
over lexical: web and macOS run a fixed-plugin `LexicalComposer` via
`@octanejs/lexical@0.2.0`; Android delegates editing to `RichTextEditor` and
round-trips serialized editor state through a headless `createEditor` +
`@lexical/html` over `zeed-dom`. No live `LexicalEditor` exists on Android —
`dispatchCommand`, node transforms, and arbitrary plugins are web-only
(apps needing them import `@octanejs/lexical` directly). `@lexical/link`
carries an ICU patch (its URL-matcher literal is a parse error without
ICU); `lexical` core's `new RegExp('\p{Emoji}')` already degrades safely.
`@lexical/*` pins to `0.51.0`; `@octanejs/lexical` pins to `0.2.0` for the
`octane ^0.6.0` peer.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'
import { useSignal$ } from 'octane/signals/client'

export function Notes() {
	const html$ = useSignal$('<p>Packing list</p>')
	return <LexicalEditor value={html$.get()} onChange={(html) => html$.set(html)} />
}
```

### AppKit editor boundary

All three editor facades now mount an independently owned local WKWebView
host on macOS. Tiptap and Lexical run their live web engines; RichText uses
StarterKit. See [AppKit editing](../app/rich-text.md#macos-appkit-editing) for the
async snapshot contract, engine-specific format and placeholder gaps, blocked
link navigation, and verification limits. Real OS keyboard input, selection,
and hit-testing remain unverified; command dispatch is not evidence for them.
