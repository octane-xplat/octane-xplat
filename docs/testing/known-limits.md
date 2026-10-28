# Known limits

> Check which features are available, different, or still unfinished on
> the platforms you plan to use.

You don't need to read every table before starting. Find the feature your
app needs, then check the columns for your platforms. If you're using an
agent, ask it to account for those limits when adding the feature.

Most tables cover **web, iOS, and Android**. macOS and Windows are
experimental and have incomplete UI support. The Windows host can launch,
but that does not mean every control works; see
[Windows status](../platform/windows-setup.md) and [Windows limits](../../.agents/design/windows-notes.md).
The [target guide](../start/spec.md#choose-your-targets) explains desktop setup.

OTA bundle updates are optional and available only in iOS/Android release
binaries with the startup hook. They activate on cold launch and recover
unconfirmed startup failures before JavaScript runs. iOS simulator and Android
emulator release lifecycle checks passed; signed physical iOS and hosted HTTPS
remain pending. Bundle integrity uses SHA-256 over TLS,
without a detached signature or automatic native dependency fingerprint.
Browser and desktop clients report unsupported. See the
[phone update guide](../app/updates.md).

The AppKit Lottie leaf uses Airbnb Lottie 4.6.1 and supports inline JSON in
`data`, raw JSON in `src`, absolute local JSON files, `file://` URLs, and HTTPS
JSON. Relative paths, `~/`/`res://` bundle aliases, HTTP URLs, `.lottie`/`.zip`
archives, and external image assets are not supported there. Fit modes map to
AppKit content modes, but pixel parity has not been visually reviewed. The
harness motion-package route remains unsupported because its gesture and
reduced-motion hosts are mobile-only; the separate AppKit UI ref-animation
fixture does not establish motion-package support. AppKit applies app and
Bamboo stylesheets, with the [limits listed for the renderer](../../packages/macos-renderer/README.md#apply-stylesheets):
only `:disabled` responds to state, media queries ignore window resizes, and
animations are not played. See the
[Lottie integration record](../../.agents/docs/notes/lottie-appkit-investigation.md) and
[non-visual macOS checks](../../apps/macos/README.md#non-visual-smoke-checks) for
the runtime evidence and its boundaries.

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

macOS support is experimental. Shared dialogs, alert dialogs, bottom sheets,
lightboxes, and toast stacks have dedicated presentation and cleanup, but OS
input delivery and VoiceOver behavior remain unverified. Lightbox video
playback, double-click zoom, and touch swipe navigation are unavailable.
See [shared presentations](../app/primitives.md#macos-shared-presentations)
for app guidance and the [AppKit verification record](../../.agents/docs/appkit-verification.md)
for contributor checks and evidence boundaries.

AppKit image loading now shares cancellable requests, bounds decoded images by
recent use, rejects HTTP error payloads, and queues remote processing/delivery
on the main operation queue. Core and optional-package images share layout and
class normalization. Actual networking, callback threading, cancellation,
responsiveness and pixels remain unqualified. Public image-cache controls and
engine-specific features remain missing; see [AppKit image loading](../app/components.md#image-loading-on-appkit).

## Where the real OS widgets live

The shared UI surface aims for consistent behavior on its supported targets — self-drawn
controls (`Switch`, `Slider`, `Spinner`, `Tabs`, `Drawer`, `BottomSheet`,
`Dialog`, `AlertDialog`), chrome-reset OS controls (`TextInput`, `TextArea`,
`SearchInput`), and hosted surfaces (`WebView`, `Video`, `CameraView`)
whose parity claim stops at the frame plus self-drawn chrome. The
platform-authentic widgets are opt-in subpath imports, and a shared `.tsrx`
importing them fails the other platform's build on purpose:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// PackedToggle.ios.tsrx: an explicit OS widget choice.
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackedToggle(props: { packed: boolean; onChange: (value: boolean) => void }) {
	return <UISwitch value={props.packed} onChange={props.onChange} />
}
```

| Need                                   | Web                                                                                | iOS                                                              | Android                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Recycled list                          | `ScrollableArea` + `@for`                                                          | `UITableView` (`ui/ios`)                                         | `RecyclerView` (`ui/android`)                                                       |
| Shared modal surface                   | `Dialog`, `AlertDialog`, `BottomSheet`                                             | shared self-drawn surfaces                                       | shared self-drawn surfaces                                                          |
| Platform modal dialog                  | —                                                                                  | `UIModal` / `openModal` (`ui/ios`)                               | `MaterialDialog` / `openModal` (`ui/android`)                                       |
| Edge-swipe drawer                      | `Drawer` (self-drawn, no edge swipe)                                               | `SideDrawer` (`ui/ios`)                                          | `DrawerLayout` (`ui/android`)                                                       |
| OS switch / slider / spinner / tab bar | shared self-drawn set                                                              | `UISwitch` / `UISlider` / `UIActivityIndicatorView` / `UITabBar` | `MaterialSwitch` / `SeekBar` / `CircularProgressIndicator` / `BottomNavigationView` |
| Hover interactions                     | `HoverCard`, `Tooltip` (shared; macOS HoverCard = in-window layer via host bridge) | `HoverCard` opens on tap; `Tooltip` passes through               | `HoverCard` opens on tap; `Tooltip` passes through                                  |
| Liquid glass                           | —                                                                                  | `LiquidGlass` / `LiquidGlassContainer` (`ui/ios`)                | —                                                                                   |

`ui/ios` and `ui/android` resolve only in native builds; `ui/web` only in
web builds. `ui/nativescript` is plumbing (root-layout helpers), not components.

## Color suite limits

`ColorArea`/`ColorSlider` drags are delta-based — the value adjusts by the
gesture delta from where it started, matching `Slider`; there is no
tap-to-position. `ColorSlider` supports only `channel="hue"`; there is no
alpha channel, and `ColorPicker` is a fixed composite (React Aria's
children-composition picker is deferred). Values are hex `'#rrggbb'` only —
no `'rgba'`/`hsl` input. Runtime-verified targets: web
(Chromium probe — computed gradient styles), iOS (simulator probe —
`CAGradientLayer` structure + rendered pixels), Android (emulator probe —
`GradientDrawable` structure + rendered pixels), and macOS (AppKit probe —
`CAGradientLayer` structure + rendered pixels). Drag behavior is covered by
jsdom/native unit tests, not by OS input on any target, and
adjustable-increment accessibility actions are not wired
on the AppKit host for the color controls.

## VirtualList performance

`VirtualList` supports a measured vertical window, with off-window unmounts.
It has no recycling pool, feed/chat callbacks, indexed scroll handle, sticky
rows, grid, or masonry. Native variable-height momentum, long-session memory,
and display frame pacing remain Q30 gates; historical evidence is not a fresh
runtime pass. See the [measured support boundary](../app/virtual-list.md#measured-support-boundary)
and [readiness evidence](../../.agents/docs/notes/primitive-notes.md#virtuallist-readiness-recheck-q30-2026-09-30).

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

| Seam                                                   | Web                                                                                                                                                     | iOS                                                                                                                                                                                                                                                                                                                                               | Android                                                                                                                                   | Kind                                                                                                                                                                                                                  | Verified                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `ScrollableArea`                                       | scrolling, axis-aware; `axis="both"` supports nested native lists                                                                                       | block/inline scrolling with pull-to-refresh; `axis="both"` renders a non-scrolling shell                                                                                                                                                                                                                                                          | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.7.0·desk         |
| `Pager`                                                | scroll-snap row; `onPageChange` fires ~90ms after the scroll goes idle                                                                                  | UICollectionView paging via `@nativescript-community/ui-pager` in the `@octane-xplat/pager` leaf; declaring-tree portals; context/update/page-change probe passed, OS swipes unqualified                                                                                                                                                          | ViewPager2 via the same plugin; declaring-tree portals; context/update probe passed, OS swipes unqualified                                | `different`                                                                                                                                                                                                           | post-0.14.0·ios/android |
| `SearchInput`                                          | `<input type=search>`; webkit's own ✕ hidden so the drawn one matches                                                                                   | TextField, `returnKeyType=search`; glyph tint via `svgview` `currentColor` unverified                                                                                                                                                                                                                                                             | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.5.0·desk         |
| `SegmentedControl`                                     | equal-width segments (`width:0`+`flex-grow` — `flex-basis` is dead on NS)                                                                               | identical classes/geometry; tap only (no arrow-key nav) — Space/Enter on web                                                                                                                                                                                                                                                                      | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.5.0·desk         |
| `ContextMenu` trigger                                  | right-click                                                                                                                                             | long-press                                                                                                                                                                                                                                                                                                                                        | long-press                                                                                                                                | `different`                                                                                                                                                                                                           | 0.5.0                   |
| `Tokenizer` backspace removal                          | removes the last token when Backspace is pressed on an empty web input                                                                                  | native text fields do not emit keydown; remove with each token’s ✕                                                                                                                                                                                                                                                                                | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.7.3·desk         |
| `TextArea` `onSubmit`                                  | fires on Cmd/Ctrl+Enter                                                                                                                                 | fires only when `returnKeyType` is `done`/`send`                                                                                                                                                                                                                                                                                                  | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | 0.5.0                   |
| Nested `Text`/`RichText`                               | spans nest                                                                                                                                              | flat sibling spans — context carries inherited styles                                                                                                                                                                                                                                                                                             | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | 0.5.0                   |
| `line-height`                                          | total line box                                                                                                                                          | additive inter-line spacing                                                                                                                                                                                                                                                                                                                       | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | 0.5.0                   |
| `useMeasure` `x`/`y`                                   | app-surface dips (viewport)                                                                                                                             | app-surface dips (root layout surface; screen-minus-window origin)                                                                                                                                                                                                                                                                                | same as iOS                                                                                                                               | `same`                                                                                                                                                                                                                | post-0.14.0·desk        |
| `ref` value                                            | `HTMLElement`                                                                                                                                           | NativeScript `View`                                                                                                                                                                                                                                                                                                                               | NativeScript `View`                                                                                                                       | `different`                                                                                                                                                                                                           | 0.5.0                   |
| `onInput`/`onChange`                                   | can re-dispatch — keep handlers idempotent                                                                                                              | once per edit                                                                                                                                                                                                                                                                                                                                     | same as iOS                                                                                                                               | `degraded`                                                                                                                                                                                                            | 0.5.0                   |
| `accessibilityState`                                   | independent ARIA booleans                                                                                                                               | single enum, strongest wins (disabled→selected→checked)                                                                                                                                                                                                                                                                                           | same as iOS                                                                                                                               | `degraded`                                                                                                                                                                                                            | 0.5.0                   |
| `accessibilityRole`                                    | full ARIA spellings                                                                                                                                     | narrower NS enum (`tab`→`button`, `heading`→`header`, …)                                                                                                                                                                                                                                                                                          | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | 0.5.0                   |
| `Icon`/`Image` SVG                                     | DOM `<svg>`                                                                                                                                             | SVGKit                                                                                                                                                                                                                                                                                                                                            | AndroidSVG — no SVG filters, limited text/radial gradients                                                                                | `degraded`                                                                                                                                                                                                            | 0.5.0·desk              |
| `Image` animated raster                                | `<img>` animates GIF/webp                                                                                                                               | static first frame (core `image` is single-frame) — `AnimatedImage` (`@octane-xplat/gif`) for animation                                                                                                                                                                                                                                           | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.5.0·desk         |
| `AnimatedImage` (`@octane-xplat/gif`)                  | `<img>`                                                                                                                                                 | SDWebImage `SDAnimatedImageView` via `ui-image`                                                                                                                                                                                                                                                                                                   | Fresco `DraweeView` via the same plugin                                                                                                   | `different`                                                                                                                                                                                                           | post-0.5.0·desk         |
| `prefetch` (`@octane-xplat/gif`)                       | warms browser HTTP cache via a throwaway `<img>`                                                                                                        | SDWebImage prefetcher → disk cache — `headers` honored                                                                                                                                                                                                                                                                                            | Fresco `prefetchToDiskCache`                                                                                                              | `different` (macOS: `unsupported`, resolves `false`)                                                                                                                                                                  | post-0.10.0·desk        |
| `prefetch` (`@octane-xplat/image`)                     | warms browser HTTP cache, awaited load (resolves `false` if any URL fails)                                                                              | SDWebImage prefetcher → disk cache — `headers` honored                                                                                                                                                                                                                                                                                            | Glide `prefetchToDiskCache`; `headers` honored via `CustomGlideUrl`                                                                       | `different` (macOS: `unsupported`, resolves `false`)                                                                                                                                                                  | post-0.10.0·desk        |
| `Image` (`@octane-xplat/image`)                        | `<img>` — engine props ignored; browser HTTP cache owns caching                                                                                         | SDWebImage via `ui-image` v5 — sized memory/disk caches, `onLoad.source` reports cache level                                                                                                                                                                                                                                                      | Glide + okhttp3 via the same plugin — sized LRU + BitmapPool replaces NS core's 5 MB `LruCache`; SVG `src` unsupported (use core `Image`) | `different`                                                                                                                                                                                                           | post-0.10.0·desk        |
| `Canvas` (`@octane-xplat/canvas`)                      | `<canvas>` — `2d`/`webgl`/`webgl2`/`webgpu` contexts; WebGPU = WGSL via `navigator.gpu`                                                                 | `@nativescript/canvas` (Skia+wgpu core) — same context kinds; `getGPU()` stands in for `navigator.gpu`                                                                                                                                                                                                                                            | same as iOS                                                                                                                               | `different` (AppKit: `unsupported`, null contexts/GPU)                                                                                                                                                                | post-0.5.0·desk         |
| `ShaderEffect` (`@octane-xplat/effects/{ios,android}`) | no per-element fragment shader exists — unsupported                                                                                                     | SwiftUI stitchable Metal on the rendered subtree, iOS 17+; bundled set (`heatHaze`/`sheen`/`shatter`) ships as a precompiled `.metallib` in the leaf; custom names register via `XplatShaderEffectRegistry`                                                                                                                                       | AGSL `RuntimeShader` via `RenderEffect`, API 33+, inert below                                                                             | `unsupported` / `different`                                                                                                                                                                                           | post-0.5.0·desk         |
| `createShader` (`@octane-xplat/shaders`)               | upstream `shaders` WebGPU engine on `<canvas>`; hardware correctness unverified — spike ran on SwiftShader only                                         | `@nativescript/canvas` WebGPU surface + DOM-canvas facade + lazy `navigator.gpu` shim; `shaders@4.0.0`'s bundled TypeGPU `\p{XID_*}` literals are parse errors without ICU, compiled away by the `xplatNative` unicode-regex transform; build/type verified, device execution pending                                                                                                                                                                                                              | same as iOS, Vulkan-backed; device/driver execution pending                                                                               | `different` (desktop native: `unsupported`)                                                                                                                                                                           | post-0.10.0·desk        |
| `Table`/`Selector`/menus                               | bounded, unvirtualized                                                                                                                                  | bounded, unvirtualized — large data → `UITableView`                                                                                                                                                                                                                                                                                               | → `RecyclerView`                                                                                                                          | `degraded`                                                                                                                                                                                                            | 0.5.0                   |
| `WebView` document pixels                              | Chromium iframe                                                                                                                                         | WKWebView                                                                                                                                                                                                                                                                                                                                         | android.webkit.WebView — page content renders in each engine; only the frame chrome is normalized                                         | `different`                                                                                                                                                                                                           | 0.5.0·desk              |
| `WebView` `matchContents`                              | same-origin iframe document height; cross-origin internals are inaccessible                                                                             | reported content size; runtime behavior not device-verified                                                                                                                                                                                                                                                                                       | reported content height with host width; runtime behavior not device-verified                                                             | `different`                                                                                                                                                                                                           | post-0.6.0·desk         |
| `WebView` `onError`                                    | iframe `error` event does not fire reliably cross-browser                                                                                               | `loadFinished` carries the error string                                                                                                                                                                                                                                                                                                           | same as iOS                                                                                                                               | `degraded`                                                                                                                                                                                                            | 0.5.0·desk              |
| `WebView` `scrollEnabled={false}`                      | `scrolling="no"` (deprecated attr, still honored)                                                                                                       | `scrollView.scrollEnabled`                                                                                                                                                                                                                                                                                                                        | touch-move interception — drag text selection inside the frame is lost                                                                    | `degraded`                                                                                                                                                                                                            | 0.5.0·desk              |
| `WebView` `sandbox`                                    | typed prop, default token list applied                                                                                                                  | unsupported — no-op (WKWebView is already isolated)                                                                                                                                                                                                                                                                                               | same as iOS                                                                                                                               | `unsupported`                                                                                                                                                                                                         | 0.5.0·desk              |
| `WebView` JS bridge                                    | unsupported — no `injectedJavaScript`/`postMessage`; use the `web:` bag                                                                                 | unsupported — use the `ios:` bag                                                                                                                                                                                                                                                                                                                  | unsupported — use the `android:` bag                                                                                                      | `unsupported`                                                                                                                                                                                                         | 0.5.0·desk              |
| Pull-to-refresh                                        | pointer/touch drag translates scroller in clipped wrapper                                                                                               | UIScrollView bounce + `contentInset` dock; pan observer rides alongside scroll pan                                                                                                                                                                                                                                                                | damped drag translates scroller; edge glow off                                                                                            | `different`                                                                                                                                                                                                           | 0.5.0·desk              |
| BottomSheet `snapPoints`                               | drag-to-snap via grabber strip; fractions of viewport height                                                                                            | same in-window path — RootLayout host + translateY offsets                                                                                                                                                                                                                                                                                        | same in-window path — no BottomSheetBehavior dependency                                                                                   | `different`                                                                                                                                                                                                           | post-0.7.0·desk         |
| `Video` surface pixels                                 | `<video>` (engine-owned) — `controls=false`; transport is self-drawn and identical                                                                      | `xplatvideo` via `@nstudio/nativescript-exoplayer` (real dependency of the `@octane-xplat/video` leaf — merges transitively; pulls the `ASBPlayerSubtitling` pod) — AVPlayerViewController                                                                                                                                                        | ExoPlayer2 (`com.google.android.exoplayer:exoplayer:2.17.1` gradle dep) via the same plugin                                               | `different`                                                                                                                                                                                                           | post-0.5.0·desk         |
| `Video` `onError`                                      | maps `MEDIA_ERR_*` codes                                                                                                                                | unsupported — the plugin logs player errors, emits no event                                                                                                                                                                                                                                                                                       | same as iOS                                                                                                                               | `unsupported`                                                                                                                                                                                                         | post-0.5.0·desk         |
| `Video` `onEnded`                                      | suppressed under `loop` (`ended` never fires)                                                                                                           | suppressed under `loop` to match — the plugin still emits `finished`                                                                                                                                                                                                                                                                              | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.5.0·desk         |
| `Video` seeking                                        | `currentTime` write while scrubbing                                                                                                                     | `seekToTime` per drag event — no debounce                                                                                                                                                                                                                                                                                                         | same as iOS                                                                                                                               | `degraded`                                                                                                                                                                                                            | post-0.5.0·desk         |
| `CameraView`                                           | `getUserMedia` → muted/autoplay `<video>`                                                                                                               | `AVCaptureSession` + `AVCaptureVideoPreviewLayer`; simulator availability unverified                                                                                                                                                                                                                                                              | CameraX `PreviewView`, lifecycle-bound by the leaf                                                                                        | `different` (macOS: `XplatCameraHost` Swift leaf, AVFoundation; no-camera host reports unavailable)                                                                                                                   | post-0.6.0·desk         |
| `CameraView` `onReady`                                 | video `playing` event                                                                                                                                   | after `AVCaptureSession.startRunning()` returns; does not confirm a rendered frame                                                                                                                                                                                                                                                                | after CameraX binds the preview use case; does not confirm a rendered frame                                                               | `degraded`                                                                                                                                                                                                            | post-0.6.0·desk         |
| `createCameraSession` / `CameraView session`           | `MediaRecorder` + IndexedDB — real Chromium capture, metadata, and reopen verified by the browser conformance runner; persistent-storage grant required | `AVCaptureMovieFileOutput` on the shared `AVCaptureSession` — preview, recording, finalization, and reopenable file verified on a physical iPhone; simulator reports `supported:false` with no fabricated camera                                                                                                                                  | CameraX `PreviewView`/`VideoCapture` on the shared session — emulator-verified                                                            | `different` (macOS AppKit: `AVCaptureMovieFileOutput` app-private MOV — adapter + honest-unavailable verified; WKWebView: host `camera` service, real TCC + storage verified; capture unverified on camera-less host) | post-0.9.x·ios          |
| `CameraView` `onTap`                                   | `click` on the `<video>` — normalized preview-space point                                                                                               | `tap` gesture observer on the preview host — pure notification, composes with layered pan/double-tap                                                                                                                                                                                                                                              | same as iOS                                                                                                                               | `different` (macOS/Windows runtimes do not dispatch `tap` on preview views)                                                                                                                                           | post-0.14.0·desk        |
| `focusAtPoint`                                         | reports `focusPointOfInterest:false` — no metering                                                                                                      | single-shot `autoFocus`/`autoExpose` at `captureDevicePointOfInterestForPoint` — layer conversion covers aspect-fill crop and the mirrored front-camera preview                                                                                                                                                                                   | `FocusMeteringAction` (AF+AE, 3s auto-cancel) via the PreviewView metering factory                                                        | `different` (macOS: same AVFoundation path through the Swift host; Windows/Linux: `false` + no-op)                                                                                                                    | post-0.14.0·desk        |
| `Lottie` (`@octane-xplat/lottie`)                      | `lottie-web` svg renderer in a plain div                                                                                                                | `CompatibleAnimationView` via vendored `@nativescript-community/ui-lottie` (`src/vendor/ui-lottie` — submodule of `octane-xplat/ui-lottie` @ `xplat-vendored`; lottie-ios pinned to commit fd75f8a)                                                                                                                                               | `LottieAnimationView` via the same vendored source (lottie-android 5.2.0)                                                                 | `different`                                                                                                                                                                                                           | post-0.6.0              |
| `Lottie` `duration`/`progress` units                   | ms and 0..1 everywhere                                                                                                                                  | plugin reports `duration` in seconds — leaf ×1000; progress already 0..1                                                                                                                                                                                                                                                                          | plugin reports ms; progress 0..1                                                                                                          | `different`                                                                                                                                                                                                           | post-0.6.0              |
| `Lottie` vendored plugin                               | —                                                                                                                                                       | fixes unreleased upstream ship in the leaf — dead sync-src, missing `compositionLoaded`/`loadFailed` on iOS, URL src, `.lottie` zip, async autoPlay, completion dedupe, `declare` fields (modern-bundler compat); staged as PR branches on `octane-xplat/ui-lottie` (fixes on `xplat-fixes`; `xplat-vendored` adds only vendoring-compat markers) | same as iOS                                                                                                                               | `different`                                                                                                                                                                                                           | post-0.6.0              |

On iOS and Android, component-owned `Dialog`, `BottomSheet`, `Overlay`,
`Popover`, `Lightbox`, and declarative `UIModal`/`MaterialDialog` content
portal from their declaring tree and preserve `useContext`. The optional
platform sheet/context-menu leaves do the same on Android and iOS; AppKitSheet
does so on macOS, and iOS ShaderEffect portals its child subtree. Native hosts
still need their own theme classes. Android `BottomNavigationView` panes and
recycled Pager cells and iOS `UITabBar` panes also portal; the Android tab/Pager
and iOS tab/Pager probes verify context inheritance and live updates. Changing
the iOS Pager page also verifies the current provider value in the next cell;
OS swipe and hit-testing behavior remain unqualified by these probes.
Independent roots remain for imperative modal/sheet services, routed Pages,
AppKit `tabviewitem` content, and platform list cells (including iOS UITableView,
Android RecyclerView, and AppKit listview); pass values through
props/params or shared state there. Runtime probes cover context inheritance,
live updates, and supported close/reopen cleanup for the migrated boundaries.

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

AppKit macOS embeds the shared `WebView` using WKWebView. Content sizing runs
after load or measurement-prop changes, not continuously as page content changes.
The viewport can impose a minimum measured height. Scroll disabling sets hidden document overflow; page scripts can still scroll.
`sandbox` remains browser-only. See [content sizing](../app/primitives.md#webview-content-sizing)
for the embedded component and its separate app-shell boundary.

## Navigation

The canonical client uses typed destinations and structured screen props. The
hard cutover is in progress; previous legacy-adapter runtime results do not
qualify the changed implementation. Use the [navigation guide](../app/navigation.md)
and [maintained checks](../../.agents/docs/navigation-checks.md) for current contracts and commands.

```ts
import { router } from '@octane-xplat/ui/routing'

// In an app declaring this route:
const result = await router.push({ to: '/items/:id', params: { id: 'coat' } })
if (result.status === 'committed') await result.finished
```

| Boundary | Current contract and evidence limit |
| --- | --- |
| Web history | One linear browser history. Reset returns unsupported; inactive named flows cannot independently edit document history. |
| Guarded history | Canonical Back prepares retained targets. Cross-stack redirects replace the receiver while preserving source history. Canonical native dismiss prepares its presenter. iOS Frame leading-edge Back prepares after release, without an interactive preview; full-content pop is disabled. Rendered panes have no iOS swipe adapter. Native routed modals disable direct SDK cancellation and close through canonical dismiss or claimed Android Back; forced host closure only reconciles cleanup. |
| Unsaved edits | [Entry-owned client confirmation](../app/navigation.md#confirm-before-leaving-unsaved-edits) supports proceed/reset. It cannot intercept document unload, raw host closure or process exit; redirects retain the approved attempt's scope. |
| Native shared Tabs | Retained rendered panes own independent histories and providers. Activity Back follows visible ownership. Canonical iOS/Android release checks passed, including visible-pane Android Back. |
| Native iOS tab bar | Declared named Frames retain their native history. Its lifecycle churn needs the maintained iOS release checks. |
| Android bottom navigation | Rendered panes avoid NativeScript's nested TabView Frame bookkeeping limitation. Real OS Back needs the release fixture. |
| AppKit | Rendered panes and fullscreen in-window routed modals retain history, providers and state. Modal Escape/outside callbacks use guarded dismissal; raw window closure is cleanup. Custom modal/pane effects and native keyboard/pointer input remain unqualified. |
| Inputs | Path and search are separate. External values are validated; unknown patterns and malformed input do not become invented routes. |
| Errors | Guard/loader failure returns a structured result and keeps committed content. Render errors use a route boundary. Dedicated loader-error screen policy remains in the refinement plan. |
| Scroll and head | Browser per-entry scroll, fragments, modal preservation, title and named metadata have current jsdom coverage. Native Page titles are applied; AppKit window metadata remains unfinished. |
| Motion | Navigation commitment and transition completion are distinct. Browser View Transitions support presets and registered CSS types, with reduced-motion/unsupported skips and separate completion. Registered NativeScript Frame effects execute through native instances and reverse on Back. Custom native modal/pane effects remain unsupported by that adapter. |
| SSR | The installed renderer has feasibility evidence; Xplat has no qualified HTTP/hydration host. Default client state must never hold request-local accounts. |
| Windows | No Windows VM is available for this task. Type/build checks cannot establish Windows runtime behavior. |
| Linux | The actual WebKitGTK host passed 16 handler-driven checks under Xvfb with a production bundle, including unsaved-edit confirmation, refusal and approval. OS input and the separate native GTK renderer remain unqualified. |

macOS AppKit secure storage uses Keychain through the
[`@octane-xplat/secure-storage` native leaf](../../packages/secure-storage/README.md#macos-appkit).
Availability does not guarantee access to a locked or policy-restricted Keychain;
reads can reject and writes/removal can return `false`.


## Platform services

AppKit `openSettings` now resolves and launches System Settings through
NSWorkspace when the native methods are available. It does not select an
app-specific permission page. A launch request can fail and does not prove
presentation, activation or a permission change. Native runtime and packaged/
sandbox checks remain pending; see [opening settings](../platform/platform-services.md#open-settings).



| Seam                                        | Web                                                                                                                                                                                                    | iOS                                                                                                                | Android                                                                                                                       | Kind                                                                                                                                                                                                              | Verified              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `appInfo`                                   | unsupported — no trustworthy bundle identity                                                                                                                                                           | `NSBundle` metadata                                                                                                | package metadata                                                                                                              | `unsupported`                                                                                                                                                                                                     | 0.5.0                 |
| `openSettings`                              | unsupported                                                                                                                                                                                            | app Settings URL                                                                                                   | app-details intent                                                                                                            | `unsupported`                                                                                                                                                                                                     | 0.5.0·desk            |
| `biometrics`                                | unsupported — local-presence only; auth ceremonies use `webAuthn`/`authSession`                                                                                                                        | FaceID/TouchID                                                                                                     | Keystore biometric                                                                                                            | `unsupported`                                                                                                                                                                                                     | 0.6.0·desk            |
| `webAuthn`                                  | `navigator.credentials` over the RP's JSON options                                                                                                                                                     | unsupported — hosted ceremony via `authSession` (native passkey sheet needs associated domains)                    | same as iOS                                                                                                                   | `unsupported`                                                                                                                                                                                                     | 0.6.0·desk            |
| `authSession`                               | unsupported — plain navigation; use `webAuthn`/routes directly                                                                                                                                         | ASWebAuthenticationSession (intercepted callback scheme, no URL-type needed)                                       | Chrome Custom Tab + deep-link return — the app must declare `callbackScheme`'s intent-filter like any incoming link           | `unsupported`                                                                                                                                                                                                     | 0.6.0·desk            |
| `secureStorage`                             | unsupported — no enclave                                                                                                                                                                               | Keychain                                                                                                           | Keystore                                                                                                                      | `unsupported`                                                                                                                                                                                                     | 0.5.0                 |
| `haptics`                                   | `navigator.vibrate` — Android Chrome only; unsupported elsewhere                                                                                                                                       | Taptic Engine                                                                                                      | Vibrator                                                                                                                      | `degraded` — `NSHapticFeedbackManager` discrete trackpad feedback; presets only (patterns/realtime report unsupported) | 0.5.0                 |
| `share`                                     | `navigator.share`, else clipboard copy (`'copied'`); `share.file` unsupported — browsers can't share a file by path                                                                                    | share sheet — `share.file` presents `UIActivityViewController`, reports `shared`/`cancelled`                       | share sheet — `share.file` sends via the package FileProvider (`ACTION_SEND` reports no outcome, resolves `shared` on launch) | `degraded`                                                                                                                                                                                                        | 0.5.0                 |
| `systemBars.setStatusBarStyle`              | no-op — `setColor` writes `theme-color` meta instead                                                                                                                                                   | works                                                                                                              | works                                                                                                                         | `unsupported`                                                                                                                                                                                                     | 0.5.0                 |
| `notifications`                             | local `Notification` only                                                                                                                                                                              | local + push (APNs)                                                                                                | local + push (FCM)                                                                                                            | `degraded`                                                                                                                                                                                                        | 0.5.0·desk            |
| `media.ensure('camera')` / `capturePhoto()` | `requestPermissions('camera')` reports `granted` via the file-input path — no Permissions API query; `capturePhoto()` uses `<input capture>` (mobile camera UI, desktop file picker)                               | native camera permission request + still capture in OS camera UI                                                   | same as iOS                                                                                                                   | `different` (AppKit: app-owned preview/Capture/Cancel sheet; camera-only authorization after Capture, app-private JPEG, gallery saving rejects; deterministic lifecycle tests, real camera qualification pending) | 0.6.0·desk            |
| `@octane-xplat/lingui`                      | catalogs load via `import.meta.glob` loaders; `navigator.language` detection; unit-tested                                                                                                              | `Device.language` detection; glob catalog loading and `Intl.PluralRules` on the NS runtime not yet device-verified | same as iOS                                                                                                                   | `different`                                                                                                                                                                                                       | post-0.7.3·desk       |
| `files`                                     | `pick` → blob URL; `writeText` triggers a download                                                                                                                                                     | real file paths                                                                                                    | real paths; SAF `content://` reads                                                                                            | `different`                                                                                                                                                                                                       | 0.5.0·desk            |
| `@octane-xplat/sqlite`                      | sqlite-wasm in a Worker; persists via OPFS sync-access-handle pool (no COOP/COEP needed), `persistent: false` and transient where OPFS is denied; `each` materializes the full result before iterating | `@nativescript-community/sqlite` (FMDB) — `threading` on by default                                                | same plugin (`com.akylas.sqlite`)                                                                                             | system libsqlite3 via metadata C-interop — real file db, same durability as mobile; requires the regenerated `metadata.nsmd` (sqlite3/dlfcn sweep)                                                                | post-0.7.0·web, macos |

The table above lists web, iOS, and Android. On macOS, `share.text()`,
`share.url()`, and `share.file()` open the AppKit share picker; the
picker reports no outcome, so macOS resolves `shared` once it presents.
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
- **Host `on*` props re-commit every render; hand-bound listeners don't.**
  An `onTap`/`onPan`/… prop on a native element re-commits its handler each
  render through a stable listener id, so a re-rendered callback always reads
  current state on iOS, Android, and macOS — inline closures are safe. A
  listener you attach yourself (`view.on('pan', fn)` in an effect or ref
  callback) binds once at mount and keeps the mount-render closure: read
  live state through a ref, or wrap the handler in octane's `useEffectEvent`
  so the stable binding dispatches the latest function. — post-0.14.0·desk.
- **A dropped prop restores its documented default; `null` is not a distinct
  contract.** Removing an attribute between renders — or passing
  `prop={undefined}` / `prop={null}` — returns the host property to the same
  value it holds when never supplied, key-by-key inside `style` objects too.
  `null` cannot stand in for an explicit neutral value: pass `''`, `0`, or
  `false` where the default differs. — post-0.14.0·desk.
- **Literal `@{` in JSX text** parses as a code block: evaluated and
  discarded on web, a compile error on native. Write `{'@'}{expr}` —
  `<Text>{'@'}{user.handle}</Text>` renders `@handle`. Upstream fix
  intentionally not pursued. — 0.5.0.
- **`.tsrx` files reject `async` top-level functions** — the compiler
  treats them as async components, and an `async` function that never
  awaits still breaks `ns build`. Drop the keyword. — 0.5.0.
- **Module-level objects with JSX render arrows fail native compilation**,
  first seen on patched Octane 0.11.0 and still present through Octane 0.14.3.
  The native build reports “JSX in an unsupported module declaration requires
  universal plan lowering.” Upstream intentionally rejects JSX outside
  recognized components rather than falling back to DOM code, and has not said
  whether module-level callbacks will be supported. Use named functions as
  `render` values in identity-stable module-level tab arrays; these compiled and
  ran in the maintained iOS/Android and AppKit fixtures. Recheck this compiler
  restriction when upgrading Octane.


- **`Grid` `gap` was removed** — use child margins. The leaves keep a
  one-time console warning as a migration hint for one release. — 0.5.0.
- **`SafeArea` gained `edges`; `ignoreSafeArea` is deprecated** — `edges`
  selects which sides pad (`edges={[]}` is the old `ignoreSafeArea`), and a
  nested `SafeArea` pads only the edges its ancestors left unconsumed.
  `KeyboardAvoiding` subtracts a consumed bottom inset from the keyboard
  inset, and `enabled={false}`/`useKeyboardInset({ enabled: false })` keeps
  the wrapper inactive with no subscription or Android resize lease. —
  post-0.14.0·desk.
- **`Grid` `rows`/`columns` are a bounded grammar** — `auto`, dip lengths,
  star weights (`*`/`2*`), comma/whitespace strings or `GridTrack` arrays;
  `'48px'`/`'2fr'` spellings normalize. CSS-only tokens (`minmax`,
  `repeat`, `%`, line names) warn once and lay out as `auto` on every host.
  `row`/`col` are zero-based track indices; spans count tracks. —
  post-0.14.0·desk.
- **Retained nested Screens need separate width qualification on iOS.** In
  the bounded same-cell regression, the inner stage can report zero width
  after settling while the height checks pass. Observed with Mason core
  1.0.0-beta.5 (unchanged iOS payload from beta.4); native frame correctness
  and the cause remain unverified. Android passes height and width resizing.
  See the maintained [regression fixture](../../apps/mobile/src/tests/foreign-screen-height.spec.tsrx).
- **`useMeasure` `x`/`y` is app-surface-relative on every target** — the
  native leaf subtracts the root layout surface's screen position, matching
  the web viewport space; `bounds === null` is the readiness signal. —
  post-0.14.0·desk.
- **Outline discovery is target-specific** — `useOutlineFromDOM` under
  `@octane-xplat/ui/web` observes live DOM headings; NativeScript's
  `useOutlineFromView` under `@octane-xplat/ui/nativescript` takes a snapshot.
  The macOS `useOutlineFromView` path currently returns no items because the
  AppKit bridge does not expose Heading role/level metadata. Check
  `getOutlineFromViewCapabilities().isSupported`; use `useOutlineFromMarkdown`,
  `useOutlineFromDoc`, or explicit `items` when it is false. The portable
  derivations are unchanged. — post-0.14.0·desk.

  ```tsx
  import { Outline } from '@octane-xplat/ui'
  import { useOutlineFromDoc } from '@octane-xplat/ui/markdown'
  import { getOutlineFromViewCapabilities } from '@octane-xplat/ui/macos'

  export function canDiscoverOutlineFromView() {
  	const { isSupported, mode } = getOutlineFromViewCapabilities()
  	return isSupported && mode === 'snapshot'
  }

  export function ArticleOutline(props: { doc: Parameters<typeof useOutlineFromDoc>[0] }) {
  	const items = useOutlineFromDoc(props.doc)
  	return <Outline items={items} />
  }
  ```

- **Target-only names moved off the `@octane-xplat/ui` root** — the root now
  exports the same names on every target. `useOutlineFromView` moved to
  `@octane-xplat/ui/nativescript` (iOS/Android) and `@octane-xplat/ui/macos`;
  macOS-only `bottomSheetHost` and the unsupported `CameraView` leaf moved to
  `@octane-xplat/ui/macos`; `LinuxWindowHandle` moved to
  `@octane-xplat/ui/linux`. The published CSS paths are unchanged:
  `@octane-xplat/ui/theme/tokens.css` and `chrome.css` are now the only
  `ui/theme/*` specifiers, matching the published export map. — post-0.14.0·desk.
- **Imperative overlay services return typed handles** — `showToast`/`useToast`
  now return `ToastHandle | null` (`{ id, dismiss(), update(options) }`) instead
  of a bare dismiss function — call `toast?.dismiss()`, and note `null` when a
  `collisionBehavior: 'ignore'` duplicate suppresses the toast. `openBottomSheet`
  and the platform `openModal` now return `BottomSheetHandle`/`ModalHandle` —
  the same result promise as before plus `close(result)` scoped to that
  instance — so `await` call sites are unchanged. `openWindow` returns
  `WindowHandle | null` (`id`, `closed`, `isClosed`, `close()`, optional
  `setTitle`/`setSize`/`onCloseRequested`) on every target instead of `void` or
  a raw `Window`; `OpenWindowOptions` also gained `kind`, `title`, `size`, and
  `parent` hints. — post-0.14.0·desk.
- **Routing, data, Markdown, and chat moved to purpose entrypoints** — the
  root keeps general UI only. Router APIs (`router`, `useRouter`,
  `defineRoutes`, `useBackInterceptor`, route types like `RouteSpec` and
  `RouteManifest`) moved to `@octane-xplat/ui/routing`; stores and data
  hooks (`createStore`, `useStore`, `useListData`, `useTreeData`,
  `useAsyncList`, `defineQuery`, `useQuery$`, `createQueryClient`,
  `createMemoryQueryStorage`, `platformQueryStorage`, and their types like
  `Store`, `Selection`, `QueryKey`) moved to `@octane-xplat/ui/data`;
  Markdown (`Markdown`, `MarkdownScreen`, `parseMdDoc`, the incremental
  streaming helpers, `useOutlineFromMarkdown`/`useOutlineFromDoc`, the
  outline-derivation utilities, `tokenize` and the syntax token types) moved
  to `@octane-xplat/ui/markdown`; the whole Chat family (`ChatLayout`,
  `ChatComposer`, `ChatMessage*`, `ChatToolCalls`, the `useChat*` hooks,
  `useSpeechRecognition`, `useChatDictation`) moved to
  `@octane-xplat/ui/chat`. `xplat routes` codegen emits the new paths; rerun
  `xplat routes --dir src/app` after upgrading. — post-0.14.0·desk.
- **`SearchSource`/`ChatComposerSearchSource` cancellation is request-scoped**
  — `search(query)` and `bootstrap()` now take an optional second argument
  `request` whose `signal` aborts when the call is superseded or abandoned.
  The source-level `cancel()` method is gone: each call gets a fresh signal,
  so sharing one source across components or triggers can never cancel a
  sibling's in-flight request. Move `cancel()` bodies into the request
  signal (e.g. pass `request?.signal` to `fetch`). — post-0.14.0·desk.
- **`ScrollableArea`'s `ref` is a typed handle** — it now receives a
  `ScrollableAreaHandle` (`scrollToOffset({ inline, block }, { animated })`
  plus `native`) instead of the raw scroll element/view. Move existing host
  calls to `ref.current?.native` (e.g. `handle.native.scrollTop` on web).
  `VirtualListHandle` also gained `native` for the platform scroll view.
  — post-0.14.0·desk.
- **Focus APIs report their supported subset** — `getFocusScopeCapabilities()`
  reports web containment/autofocus/restoration and `nestedScopes: false`;
  the default mobile leaf reports all four false. AppKit now implements native
  containment/autofocus/restoration and per-window nested ownership when its
  renderer/input bridge is available; real OS behavior remains unqualified.
  `useGridList().isSupported` remains false for custom native/macOS integrations.
  The AppKit GridList component now owns native row registration, arrow/Home/End
  navigation, roving Tab stops and Enter/Space selection; its actual key delivery,
  scrolling and accessibility remain unqualified. Shift+click ranges remain
  unavailable. See [AppKit GridList](../app/components.md#gridlist-on-appkit).
  `useFocusWithin().isSubtreeTrackingSupported` is false on mobile; AppKit
  reports native observer availability for raw container attachments. Shared
  View does not forward the handlers. It tracks per-window first-responder
  containment, including shared field editors, without transitions between
  descendants. Separate windows, activation and real OS delivery remain
  unqualified; see [focus behavior](../app/primitives.md#focus-behavior).
  `useFocusVisible()` reports typed `inputModality` (`keyboard`, `pointer`, or
  `unknown`) plus `isSupported`; the default mobile leaf returns false and
  `unknown`. AppKit now has a shared native keyboard/mouse observer, with
  bridge-availability reporting, app-deactivation reset and subscriber cleanup.
  Actual OS input, focus callbacks/rings and VoiceOver remain unqualified.
  Focus callbacks use `FocusEventPayload` on web and may omit the event on
  native/macOS. Check capabilities before depending on those behaviors. — post-0.14.0·desk.

  ```tsx
  import {
  	FocusScope,
  	Text,
  	getFocusScopeCapabilities,
  	useFocusVisible,
  	useGridList,
  } from '@octane-xplat/ui'

  export function FocusSupport() {
  	const scope = getFocusScopeCapabilities()
  	const modality = useFocusVisible()
  	const canTrackGridKeys = useGridList().isSupported
  	return (
  		<FocusScope
  			contain={scope.contain}
  			autoFocus={scope.autoFocus}
  			restoreFocus={scope.restoreFocus}
  		>
  			<Text>{`Grid keys: ${canTrackGridKeys}; modality: ${modality.inputModality}; nested scopes: ${scope.nestedScopes}`}</Text>
  		</FocusScope>
  	)
  }
  ```

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
labels resolve locally; child timing applies to animate runs. Layout animation
(`layout`, `layoutDependency`, `transition.layout`, and the layout callbacks)
is supported on web, iOS, Android, and the experimental macOS host — a `layout` host animates whenever its
measured box changes after any commit, including keyed reorders of unchanged
children; nested `layout` children keep their size inside a scaling parent.
Verified 2026-10-27 by the maintained probe
`examples/probes/motion-layout.mobile.tsrx` (iOS 27.0 simulator, Android 15 emulator;
probe-driven geometry evidence, not visual capture or OS input).
`layoutId`/`LayoutGroup` shared handoffs and retained crossfades are supported.
`layoutScroll`, `whileHover`/`whileInView`, keyframe arrays, and arbitrary
CSS/SVG properties are excluded. Border-radius and
box-shadow use scale correction; native corners and scalar blur/spread are approximate under nonuniform scale. Multiple web or Mason core shadows are not corrected. Fixed-position web containers exclude outside scroll; fixed descendants of transformed containers remain unqualified. Browser overflow scroll offsets are detected automatically. On
native, `rotate` with a non-uniform parent scale is approximate.
Existing CSS transforms need an outer container.

```tsx
import { LayoutGroup, motion } from '@octane-xplat/motion'

export function LayoutSelection({ selected }: { selected: number }) {
	return <LayoutGroup id="tabs">
		<motion.View key={selected} layoutId="underline" style={{ marginLeft: selected * 100, width: 80, height: 4 }} />
	</LayoutGroup>
}
```

Declarative tweens delegate to `UIViewPropertyAnimator` (iOS),
`ViewPropertyAnimator` (Android), and WAAPI `element.animate` (web and
webview targets); springs, reduced-motion runs, and gesture-driven values
stay on the JS engine. A delegated web run still samples `getComputedStyle`
per frame for MotionValue tracking, and the matrix decomposition reports
rotate wrapped to ±180° and folded scale signs — visual output is unaffected,
but multi-winding rotations and negative scales read back in canonical form.
See
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
[optional-service qualification](../../.agents/docs/notes/optional-service-qualification.md) for the fresh
Web/iOS/Android results, historical camera/pod corrections, and feature-specific
credential, signing, physical-output and runtime gaps. Optional service gaps
apply to apps relying on those capabilities; they are not blanket core-release
blockers.

## Rich text leaf

`@octane-xplat/richtext` (the `RichTextEditor` component) edits real rich text
through WordPress Aztec's `AztecText` on Android — a `Spannable`-backed
`EditText` — AztecEditor-iOS through the `XplatAztecEditor` Swift facade
on iOS — and a bundled local WKWebView on macOS. Web returns `supported: false`
and renders nothing; Windows returns `false` and renders an unsupported
placeholder (the tiptap facade below covers web). Content in/out is HTML via
Aztec `fromHtml`/`toPlainHtml`; Kotlin default parameters are not bridged, so
the leaf passes explicit arguments. On both phones, Aztec carries ordinary rich
text only — the editor is a linear/flat block model: `<p>` boundaries flatten
to `<br>`, stray breaks accumulate across reopen round-trips, and hidden-block
markup (e.g. `data-type="toggle-item"` divs) cannot be split, indented, or
outdented as nodes ([nested-tree device
evidence](../../.agents/docs/parity/nested-tree-editor.md)). Recursive or
custom-schema editing belongs to the hosted-engine path
([decision #104](../../.agents/design/decisions.md)). AppKit uses StarterKit and
asynchronous snapshots. Real OS keyboard input, selection, and hit-testing
remain unverified; see [AppKit editing](../app/rich-text.md#macos-appkit-editing).

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
macOS runs the bundled live Tiptap engine in WKWebView, and iOS/Android render
`RichTextEditor` (AztecEditor-iOS / Aztec `AztecText`) and add tiptap document
JSON interchange through DOM-free ProseMirror slices (`@tiptap/pm` model/state,
`@tiptap/static-renderer`) with a `zeed-dom` `DOMParser` shim for
`generateJSON`. The bridge loads lazily; `onJSONReady(false)` or a null
`getJSON()` means the runtime can't host it. Document models diverge:
Aztec's flat span list is not ProseMirror's tree, so `getJSON` output is a
best-effort mapping and HTML is the reliable interchange. Formatting parity
is bounded to the shared `TiptapFormat` vocabulary; `taskList`, `highlight`,
`subscript`/`superscript`, and `align*` are unavailable in StarterKit. Web rejects those calls;
AppKit reports errors asynchronously. iOS has no task-list or alignment
formatting and rejects those calls before mutation. Both mobile facades
require `linkTo` for links. See the [format subset](../app/rich-text.md#format-subset).

For a real Tiptap/ProseMirror editor inside a mobile app (recursive schemas,
custom node views, live collaboration), the architecture is the hosted engine:
mount the shared `WebView` leaf and run the app's bundled editor document —
device-verified on iOS and Android simulators/emulators with a Foxtrot-shaped
recursive schema ([decision #104](../../.agents/design/decisions.md),
[evidence](../../.agents/docs/parity/hosted-engine-editor.md)). That run was
handler-level — `evaluateJavaScript` calls and in-page transactions — not OS
keyboard input, IME, selection handles, or VoiceOver.

```tsx
import { TiptapEditor } from '@octane-xplat/tiptap'
import { useSignal$ } from 'octane/signals/client'

export function Notes() {
	const html$ = useSignal$('<p>Packing list</p>')

	return <TiptapEditor value={html$.get()} onChange={(html) => html$.set(html)} />
}
```

`@octane-xplat/lexical` (the `LexicalEditor` component) is the same facade
over lexical: web and macOS run a `LexicalComposer` with built-in defaults via
`@octanejs/lexical@0.2.0`; only the web DOM component accepts custom node and
plugin options. iOS/Android delegate editing to `RichTextEditor` and
round-trips serialized editor state through a headless `createEditor` +
`@lexical/html` over `zeed-dom`. Web callers can add node classes and plugin
components through `LexicalEditor`'s `web` prop; native renderers ignore that
web-only option bag and keep their existing engine boundaries. No live
`LexicalEditor` exists on iOS/Android — `dispatchCommand` and node transforms
are unavailable there. `@lexical/link`'s
URL-matcher literal is a parse error without ICU — compiled away by the
`xplatNative` unicode-regex transform; `lexical` core's `new RegExp('\p{Emoji}')` already degrades safely.
`@lexical/*` pins to `0.51.0`; `@octanejs/lexical` pins to `0.2.0` for the
`octane ^0.6.0` peer.

That ICU gap is platform-wide, not lexical-specific: the NativeScript iOS and
Android runtimes embed V8 built without ICU, so `Intl` is undefined and every
`\p{…}` regex escape is a `SyntaxError` — a literal anywhere in a file fails
the whole module at parse time, even inside a function that never runs. Build
property-escape regexes lazily with an ASCII fallback:

```ts
let letterRe: RegExp
try {
	letterRe = new RegExp('\\p{L}', 'u') // full Unicode where ICU exists
} catch {
	letterRe = /[A-Za-z]/ // iOS/Android fallback
}
```

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

## iOS glass child controls

`LiquidGlass` defaults glass touch tracking off and supplies system material
blur on iOS 13–25. Explicit interactive glass with child controls has reported
touch interception on iOS 26+; real OS input acceptance remains unqualified.
Use the default for toolbars and follow the [device checks](../app/liquid-glass.md#acceptance-on-a-device).

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function Toolbar() {
	return (
		<LiquidGlass>
			<Pressable onPress={() => console.log('Pressed')}>
				<Text>Action</Text>
			</Pressable>
		</LiquidGlass>
	)
}
```
