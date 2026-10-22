# MasonKit layout-engine evaluation

Evaluation of upstream [`@triniwiz/nativescript-masonkit`](https://github.com/triniwiz/nativescript-mason)
(Osei Fortune; Taffy-family Rust layout engine) as an alternative to
NativeScript's layout containers on native targets. Source clone:
`research/nativescript-mason` (gitignored). Evaluation case:
`research/mason/mason.tsrx` (gitignored probe).

## Model — combine, not replace (desk-source)

MasonKit is a family of `CustomLayoutView` subclasses (`View`, `Text`,
`Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br`, `Ul`/`Ol`/`Li`, plus
HTML-shaped aliases under `/web`). Inside a mason subtree the Rust engine
computes frames — real `display: flex|grid|block`, `gap`, `position`,
`box-sizing`, `aspect-ratio`, `overflow` scroll — instead of NS's layout
classes.

What does **not** get replaced:

- **NS CSS stays the input surface.** Mason's properties are registered
  `CssProperty`/`ShorthandProperty` on core's global `Style`
  (`properties.ts` calls `.register(Style)`), so `className` → NS cascade →
  mason setters, and `style` objects assign onto `view.style` the same way.
  The tokens.css pipeline is unchanged in shape; mason widens the honored
  property set.
- **Non-mason `NSView`s embed as foreign children** — measured via core's
  `measureChild`, placed by the mason node (`_masonMeasureForeign` /
  `_masonLayoutForeignDescendants` in `common.ts`). A mason view inside a
  `Page` also works. Mixed trees are the designed path.
- Page/Frame navigation, gestures, modals, ListView, plugin widgets — all
  still NS.

## Driver seam (verified iOS + Android, lab-experiment)

Mason containers mount through the universal driver only with the octane
0.2.5 patch hunk added in commit `0d3a1214`: `addViewChild`/`removeViewChild`
now fall through to a `insertChild`/`removeChild`/`getChildrenCount`
capability check after the `LayoutBase` branch. Mason's `ViewBase` is
`CustomLayoutView → ContainerView`, not `LayoutBase`, so it threw
"cannot host a child" before the patch. Plain NS views lack `insertChild`,
so the cannot-host guard still holds. `dropWhen`: upstream accepts a
non-LayoutBase container capability branch.

## Probe results (lab-experiment: iOS simulator, Android physical)

`pnpm probe run research/mason/mason.tsrx --target ios|android --deps
@triniwiz/nativescript-masonkit` — all assertions passed on both:

- `masonview` as Page content: full-screen layout.
- `style={{ display:'flex', flexDirection:'column' }}` → column stacking.
- `className="gap-4"` → 16dip gap on both targets (NS cascade → mason
  shorthand).
- `style={{ columnGap: 12 }}` → 12dip row gap.
- `style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}` → two
  side-by-side equal-width columns.
- Foreign `<label>` child: intrinsically measured, placed after the grid.

Observed quirks:

- **Layout props must flow through `style`/`className`, not direct props.**
  `flexDirection="column"` as a view prop is a silent no-op — mason has
  view-level accessors for `display`/`position`/`padding`/grid tracks but
  not flex props; they live only as `CssProperty`s on `style`. Any leaf
  emitting `flexDirection="column"` on a `flexboxlayout` intrinsic would
  need `style={{ flexDirection: 'column' }}` under mason.
- `display:grid` + `1fr` columns sized to content, not the container row
  (grid container shrink-wrapped; needs a width or grid-specific handling —
  worth a dedicated probe before drawing conclusions).
- Driver `#text` folding only targets NS `TextBase`; mason `Text` is a
  different class — text children need `textContent` props or mason
  `TextNode`s, not bare JSX strings.

## Nested Grid intrinsic-width investigation (2026-10-19)

**Status: Screen root/frame mismatch confirmed by the consumer task; native
Screen root-fill correction prepared here. Grid retains its existing intrinsic
minimum semantics.** Relay:
`upstream-xplat-016-android-capture-grid-width-overflow`. Do not change the
shared star-track contract on this evidence alone.

The consumer reported a 343.38dp Screen containing a 438.77dp stage Grid and
same-cell layers on Android before a camera mounted. These are relayed device
measurements; this investigation did not use a device, desktop, or images.
The framework revision examined is `14952bb0` (v0.16.0), with the canonical
renderer 0.2.5 patches and MasonKit `1.0.0-beta.110`.

### Pinned source findings

- Native `Grid.tsrx` and `Grid.web.tsrx` both use `gridTrackListToCss`:
  `*` becomes `1fr`. A zero-minimum track would change the current intrinsic
  sizing contract on both platforms. `minmax(...)` is outside the public
  `rows`/`columns` grammar.
- Native `Screen.tsrx` puts an auto-sized Mason flex column inside a
  NativeScript RootLayout. The class/style props apply to the inner column.
  Its native frame fitting the RootLayout does not establish the width the
  engine used to compute descendants.
- MasonKit beta.110's published `gitHead` is
  `bcb27d01f89231223e2f527533ff5b8981101e0a`; its
  [Cargo manifest](https://github.com/triniwiz/nativescript-mason/blob/bcb27d01f89231223e2f527533ff5b8981101e0a/Cargo.toml)
  pins Taffy `c806bc36`. Verify the actual archive: the source-fetch tool
  returned beta.119 content even when asked for beta.110 or its gitHead.
- Android
  [View.onMeasure](https://github.com/triniwiz/nativescript-mason/blob/bcb27d01f89231223e2f527533ff5b8981101e0a/packages/nativescript-masonkit/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/View.kt#L274)
  passes both EXACTLY and AT_MOST sizes as definite **available space** to
  the engine. This is not a known/style width. Its `onLayout` applies the
  cached computed descendant frames rather than recomputing against the
  final native frame. This boundary merits testing; the mapping alone does
  not prove that it caused the consumer's overflow.
- Android's foreign-view
  [Node.measureFunc](https://github.com/triniwiz/nativescript-mason/blob/bcb27d01f89231223e2f527533ff5b8981101e0a/packages/nativescript-masonkit/src-native/mason-android/masonkit/src/main/java/org/nativescript/mason/masonkit/Node.kt#L334)
  maps both negative intrinsic available widths (MinContent `-1` and
  MaxContent `-2`) to UNSPECIFIED for MATCH_PARENT layout params when width
  is unknown; WRAP_CONTENT also uses UNSPECIFIED. Foreign NativeScript
  Labels can therefore report the same unwrapped width for both requests.
  Wrapping at a later definite width does not establish a correct intrinsic
  minimum. The consumer's actual label layout params and intrinsic return
  values still need runtime verification.

### Host-engine evidence

A temporary Rust probe in `research/grid-width/probe/` runs the exact Taffy
fork without Android, NativeScript, or a renderer mock. It models the inner
column → stage Grid → same-cell home/sheet → flex shell → camera Grid →
80%-wide centered panel with 24dp padding and a measured text leaf. The
synthetic text callback reports 390.77dp max-content and either 390.77dp or
85dp min-content, and wraps when given a definite width. **390.77dp is an
input derived from the reported overflow hypothesis, not an independently
measured text width.** Height is synthetic too; this is not a consumer replay.

At available width 343.38dp, with rounding disabled:

| Root style width | Text min-content | Columns at both Grids | Computed root/stage | Home/sheet/camera |
| --- | --- | --- | --- | --- |
| auto | 390.77 or 85 | `1fr` or `minmax(0,1fr)` | 438.77 / 438.77 | 438.77 |
| 343.38 | 390.77 | `1fr` | 343.38 / 343.38 | 438.77 |
| 343.38 | 85 | `1fr` | 343.38 / 343.38 | 343.38 |
| 343.38 | 390.77 or 85 | `minmax(0,1fr)` | 343.38 / 343.38 | 343.38 |

Adding stage `width:100%` or `min-width:0` did not alter these results.
All 32 combinations asserted the expected root and layer widths and passed
on the host. The corrected min-content callback was exercised in the trace;
correcting text alone did not constrain the auto root in this model.

### Relayed native causal evidence and correction scope

The owning Android task reported a repeated UI-timer matrix on CPH2551:

| Control | Native root frame | Measured/computed root | Stage | Home/sheet | Permission panel |
| --- | --- | --- | --- | --- | --- |
| Baseline | 343.3846 | 438.7692 | 438.7692 | 438.7692 | 350.7692 |
| Root width 100% | 343.3846 | 343.3846 | 343.3846 | 438.7692 | 350.7692 |
| Root width 100%, zero-min columns at both Grids | 343.3846 | 343.3846 | 343.3846 | 343.3846 | 274.4615 |

Restoring original styles restored the overflow. With the collapsed note's
Mason `display:none` and the permission panel's Mason `display:none`, the
auto root computed 200dp; keeping permission while removing home kept
438.7692dp. Removing permission as well reduced it to the 136dp grab pill.
This isolates the permission subtree's intrinsic contribution independently
of home. These are relayed runtime results, not executions of this branch's
new test or a measurement of the label callbacks.

A second framework correction omits undeclared native Grid track style
entries, matching web. Previously an omitted `columns` emitted
`gridTemplateColumns:undefined`; the canonical renderer stashed and replayed
it into the Mason helper after attachment, potentially clearing a class's
template. The nested-driver regression failed before this correction and
passed afterward. Declared stars still emit `1fr`; no global track semantics
changed. The stash/replay mechanism has since been replaced by the
resolved-style foreign-leaf binding (see issue #31 below): removal restores
the NativeScript CSS cascade and the binding re-syncs the effective value —
or writes an explicit `auto` reset for foreign `gridRow`/`gridColumn`, whose
Mason setters ignore `undefined` — so attaching a later sibling cannot
resurrect or clear removed tracks. Host-driver regressions cover removing
both a `columns` prop and an inline track style, then inserting a sibling;
both failed before the cleanup and passed afterward. These recording-mock
tests do not verify device CSS cascade behavior.

The framework correction gives Screen's inner Mason root a low-priority
`width:100%` CSS default through `vx-screen-content`. This makes its computed
width follow the RootLayout frame; authored class/style widths still take
precedence. It is scoped to native Screen and does not change Grid tracks,
user minimum widths, or all Mason roots. Keep it while the Mason Android root
bridge distinguishes available space from the exact native frame; reassess
against a dependency update that honors that boundary itself.

The remaining Grid-cell overflow is an intrinsic-minimum constraint: `1fr`
can grow to its contents' minimum. Native foreign-label measurement may
inflate that minimum; its MinContent/MaxContent callbacks are not yet traced.
Consumers needing bounded layers can use `grid-template-columns:
minmax(0,1fr)` through a class, omitting `columns` so the class owns that axis.
Use it at both nested Grids.

The consumer investigation subsequently verified the compiled consumer source on
physical Android after a normal `pnpm build:android`. The consumer carried
this Grid omitted-track correction, set `captureScreen` width to 100% in its
static `.style.ts` class, and supplied `minmax(0,1fr)` through static classes
at both Grids with their `columns` props omitted. No inspector style mutation
was used for this pass. Root/stage/home/sheet measured 343.3846dp, the panel
274.4615dp, and both text labels 226.7692dp. Native helper getters confirmed
the bounded columns at both Grids. Two coordinate camera-open/swipe-dismiss
cycles passed, with home remaining 343.3846dp; the original installed app
code was restored afterward.

This is a relayed consumer-source device pass of the Grid correction and
consumer constraints. The consumer's explicit Screen width differs from
this branch's `vx-screen-content` default. It is not a device execution of
the maintained regression fixture or of the upstream Screen class change.
Foreign-label callbacks remain untraced.

[`screen-grid-width.spec.tsrx`](../../../../apps/mobile/src/tests/screen-grid-width.spec.tsrx)
adds Android regression coverage for root computed/frame equality and nested
bounded layers. Device execution remains owned by the consumer task. The
existing `shared-layout` recipe now covers the documented bounded-track
option; the existing LayoutDemo's ordinary content does not require a change.

For diagnostics, compare cached engine width
`nativeViewProtected.getNode().getComputedWidth()` with native `getWidth()`
and `getMeasuredWidth()` (physical pixels). Avoid `computedWidthSafe()`, which
prefers content width and fallbacks, and `layoutFlat()`, which refreshes state.

### Separate visibility limitation

The consumer task also verified that NativeScript `visibility=collapse`
produced a zero native frame while the note's Mason node still computed
438.7692dp. Setting the Mason helper's `display:none` made its computed width
zero. This is a separate renderer/engine visibility issue; the Screen width
correction does not resolve it. Do not use collapse as evidence that an
intrinsic contributor was removed from the engine tree.

## Harness changes made for the evaluation

- `scripts/probe/mobile-host.mobile.mjs`: `modules` map gained
  `@nativescript/core/css/parser`, `ui/editable-text-base`,
  `ui/layouts/flexbox-layout`, `ui/styling/css-shadow` — plugin deep
  imports survive as external requires in case.cjs and need host entries.
- `scripts/probe/native-case.config.mjs`: `__WINDOWS__: false` define —
  masonkit guards on it.
- `apps/mobile/package.json`: `@triniwiz/nativescript-masonkit@1.0.0-beta.110`
  runtime dependency (originally a devDependency; corrected during the
  recycling comparison below). beta.110 was chosen over beta.118 under the
  ≥7-day publish-age rule.
- `packages/cli/patches/@nativescript-community__octane@0.2.5.patch`:
  container capability hunk (see above).

## Native host integration correction (2026-10-19)

The local `@nativescript-community/octane@0.2.5` patch imports MasonKit from
`elements.js` and `driver.js` for container layout. This is Xplat's patched
behavior, not an undeclared import in the published upstream renderer. Native
hosts must declare MasonKit as a runtime dependency so NativeScript includes its
binaries and metadata; resolving its JavaScript from a devDependency is
insufficient. The mobile app and isolated probe host now declare
`@octane-xplat/nativescript-masonkit@1.0.0-beta.120` in `dependencies` — the
octane-xplat fork carrying the scroll API, the iOS `MasonListDelegate` guard,
and the package rename — and the probe fingerprints the plugin's native
artifacts. octane-xplat no longer carries a MasonKit patch; the
`MasonListDelegate` module-scope guard moved into the fork at
1.0.0-beta.120.

MasonKit beta.110 also reads `__WINDOWS__`. The standalone case config already
folded this flag, but the separately built host did not. `xplatNative()` now
sets it to `false` for iOS/Android host bundles. This supplies a compile-time
target flag; it does not mock a native protocol or class. Keep this integration
contract when upgrading the renderer patch or MasonKit.

MasonKit beta.110 aliases `tap` to a native `click` event and registers the
callback with core's Observable as `click`; it does not populate
`getGestureObservers(1)`. The isolated probe now dispatches either core tap
observers or that registered click listener, while rejecting unloaded and
handler-free views. This is handler evidence, not native hit-testing.

The follow-through executed four ABBA trials on an iPad Air M4 simulator and
CPH2551 Android device. Both targets passed 16 row-action/content/disposal
assertions and failed the aggregate completion assertion: every trial stalled
on the second forward seek. Runtime inspection showed MasonKit `Scroll` without
`verticalOffset`, `scrollToVerticalOffset`, or native
`setContentOffsetAnimated`. These are the methods `VirtualList` currently
expects; Xplat's `scrollview` remapping did not supply an equivalent port.
The first seek only found an already mounted row, so it does not prove movement.
Both variants need a compatible scroll-host contract before native recycling
benefits can be measured. See the [versioned evidence](../evidence/recycling-list-2026-10-19.json).
This finding does not qualify gestures, screen readers, or release performance.

Upstream capability request: [triniwiz/nativescript-mason#132](https://github.com/triniwiz/nativescript-mason/issues/132)
was closed by upstream PR
[triniwiz/nativescript-mason#134](https://github.com/triniwiz/nativescript-mason/pull/134),
which gives every element a browser-shaped scroll surface — `scrollTop`/
`scrollLeft`/`scrollHeight`/`clientHeight`, `scrollTo({ top, left, behavior })`,
and non-bubbling `scroll`/`scrollend` events, with pre-layout seeks queued and
clamped after layout. It shipped in our fork `@octane-xplat/nativescript-masonkit`
1.0.0-beta.120, and the native `VirtualList` now uses it (commit c07e34dd7).
On 2026-10-21 the maintained fixture `packages/ui/tests/virtual-list-seek.mobile.tsrx`
passed on a CPH2551 Android phone: row 120 was unmounted initially,
`scrollToIndex(120)` aligned its frame with the list top, and `scrollToOffset(0)`
realigned row 0. These are programmatic seeks, not touch input; iOS is not yet
qualified. At the time of the
request, main `7acf7b4174ab8b10a3d74f1a76e0292197562e08` still exposed no
public offset/seek API in `Scroll`'s JS/type surface (source evidence only).
An integration check must seek outside the initial window and verify
that the destination's actual frame aligns with the viewport; finding a mounted
row alone is insufficient.

### Contract differences from NativeScript views (CPH2551, 2026-10-21)

Four local NativeScript or browser assumptions failed on MasonKit 1.0.0-beta.120. Each was
verified with programmatic dispatch on a CPH2551 phone, unfolded; iOS is not
yet qualified.

- **View-level padding is an expando.** MasonKit views are not core `View`s, so
  `view.paddingBottom = 200` only adds a JS property and layout ignores it
  (content stayed 500 tall). `view.style.paddingBottom = 200` and static style
  both laid out at 700 (`research/probes/mason-scroll-padding.tsrx`). The chat,
  keyboard-avoidance and sheet-detent padding leases now write `style`.
- **Grid has no implicit overlay.** NativeScript `GridLayout` stacked unplaced
  children in cell 0/0; CSS grid auto-places them into separate rows. Native
  `ChatLayout`'s dock took a row and shrank the scroller by its own height
  (client height 712 − dock height in every state). Overlays need explicit
  `gridRow`/`gridColumn`.
- **The Android scroller is not a `ScrollView`.** `Scroll` extends
  `TwoDScrollView`, a `FrameLayout` whose children are not wrapped in one
  content view. Scroll-ancestor detection must recognise it and read the range
  from `computeVerticalScrollRange()`; the keyboard focus source does.
- **A stretched scroller is not a definite percentage basis.** A horizontal
  `scrollview` is a flex row, so its track sizes to max-content unless it has a
  definite width. `width: '100%'` on the track resolved only when the scroller
  itself had a style width; when its width came only from grid stretch, the
  track stayed 147 wide in a 698 viewport (`research/probes/mason-carousel-track.tsrx`).
  CSS treats stretched grid items as definite, so this differs from the browser.
  Native Carousel now sets `width: '100%'` on both, and places its scroller,
  fades and buttons in grid cell 1/1.

With these corrections the chat (12/12), keyboard scroll (6/6), overlay
keyboard (14/14) and `packages/ui/tests/carousel-paging.mobile.tsrx` (5/5)
fixtures passed. MasonKit counts descendants that overflow the track in
`scrollWidth`, so Carousel paging needs no fork change.

On an iPhone 18 Pro simulator, the app booted on 1.0.0-beta.120, and
`virtual-list-seek.mobile.tsrx` (3/3), `scroll-contract.tsrx` (3/3) and
`carousel-paging.mobile.tsrx` (5/5) passed.

### iOS contract differences (iPhone 18 Pro simulator, 2026-10-21)

- **Nested Mason views always report an invalid layout.** Core's iOS
  `isLayoutValid` clears only in core's own `layout()`. A Mason view inside a
  Mason parent is framed natively and never runs it, so `isLayoutValid` stayed
  `false` and the chat keyboard binding never applied. Fork commit `8ec7caa9`
  (unreleased; 1.0.0-beta.122 lacks it) reads `MasonNode.isLayoutValid` for
  those views. `VirtualList`'s cell-measurement guard depends on the same flag.
- **The iOS scroller is not a `UIScrollView`.** `Scroll` is a `MasonUIView` with
  its own scrolling (`scroll/index.ios.ts`), so `instanceof UIScrollView` and
  `setContentOffsetAnimated` miss it. The keyboard focus source mirrors
  MasonKit's vertical-scroll rule (`overflowY`, `isScrollContainer`,
  `contentSize` vs `bounds`) and moves it with `mason_scrollTo`.
- **Padding reads back as a float32 `Length`.** `style.paddingBottom` returns
  `{ value, unit: 'px' }`, so `Number()` read every baseline as 0. Padding
  leases parse it and treat a readback within 0.01 of their own write as that
  write.

With the fork commit linked, `scroll.ios.tsrx` (6/6) and
`overlay-keyboard.ios.tsrx` (14/14) passed. `chat.ios.tsrx` passed 9 of 11,
then stalled at panel mount. A panel as tall as the keyboard inset (328, which
includes the 34-point home-indicator area) sits above that area, inside a root
that ends 34 points above the window bottom, while the keyboard reaches the
window bottom. The composer therefore rises 34 points. ChatLayout's
`safeBottom` comes from consumed insets and was 0 there, and an ancestor clips
its bounds, so translating the dock into that area is not a fix.

## MasonKit beta.126 upgrade (2026-10-22)

The workspace and generated starter compatibility catalog now pin
`@octane-xplat/nativescript-masonkit@1.0.0-beta.126` explicitly. The
[release](https://github.com/octane-xplat/nativescript-mason/releases/tag/v1.0.0-beta.126)
syncs upstream through `2324b8ee`, replaces the JavaScript iOS root-measurement
path with native root measurement and foreign invalidation, and retains the
fork's iOS final-frame sizing correction and pending Android foreign-child
flex/stretch fix (upstream PR #157). No local MasonKit patch is added.

Release-source evidence: a foreign iOS measurement with zero available space
now follows upstream intrinsic sizing and overflow behavior. Zero available
space must not be interpreted as a guarantee of zero measured size. This
supersedes assumptions about the removed JavaScript measurement path; it does
not by itself qualify Xplat's image-load, keyboard, or scrolling workarounds.
The earlier version-specific findings above remain historical evidence.

Consumer validation passed: 48 Turbo typecheck tasks (including mobile and
Windows), 923 UI web tests, 55 Node native-adapter tests, 420 UI native-host
tests, and 337 CLI tests. Initial parallel runs had timeouts and a watcher
failure; the complete UI suites and CLI suite passed on rerun. Frozen pnpm
installation, compatibility generation, patch sync, and recipe structure checks
passed. No recipe criteria or app-building workflow changed; the Octane skill's
styling, driver, and evidence guidance remains applicable.

On iOS 27 (iPhone 18 Pro simulator) and Android API 35 arm64, the isolated
beta.126 host built and ran. Each target passed 14 assertions covering foreign
label column flex/row stretch heights at first layout, after child layout
requests and a text change, Carousel paging, and VirtualList seeks to an
initially unmounted row and back. These are numeric frame and programmatic
scroll checks, not OS input or visual parity. Windows runtime remains unverified.

The probes each failed an additional intrinsic text-growth assertion. A foreign
NativeScript label inside a 120-dip Mason column retained its one-line height
after replacing short text with a long string, despite `textWrap` reading true.
The beta.125 controls reproduced the same sizes before and after: 120 × 20.33
dips on iOS and 120 × 16 dips on Android, with the same other 14 assertions
passing. This limitation predates the upgrade on both targets; no integration
regression was found in these checks. No workaround is added by this dependency
change. Local evidence lives in
`research/mason-beta126/{ios,android}-diagnostic.log` and
`research/mason-beta126/control-{ios,android}.log`; the original expectation is preserved
in Silo observation `10857de2-c089-42d4-bad5-0acab5da0eb4`.

## Native macOS bridge (verified — lab-experiment)

`packages/macos-renderer` is a custom AppKit/JSC host, not NativeScript, so
MasonKit's `@nativescript/core`-entangled element layer can't be installed.
Instead the renderer binds the engine itself: `mason-c` (the crate's C ABI)
is statically linked into a small ObjC facade dylib
(`packages/macos-renderer/native/xplatmason/`, built by `build.sh` from the
`research/nativescript-mason` checkout — not committed; the probe path is
`XPLAT_MASON_LIB`).

Bridge constraints discovered at runtime:

- The objc bridge only exposes typegen'd members — a `dlopen`'d class's
  custom selectors are invisible (`objc_getClass` finds the class, member
  lookup fails, `NSInvocation` marshals bridged class objects as `NSObject`,
  `objc_msgSend` lacks signature info). Working channel: the dylib publishes
  a host instance via `NSThread.mainThread.threadDictionary` at `+load`, and
  JS drives it through `performSelectorWithObjectWithObject('invoke:args:')`.
- JS functions cannot cross as ObjC blocks (SIGBUS) — no measure callback in
  v1. Foreign leaves push their AppKit intrinsic/fitting size as min-width/
  min-height, which clamps content-sized children without blocking grid
  stretch.
- `mason_node_destroy` takes the node only (not engine+node); wrong
  signature crashed in `drop_glue`.
- Mason's margin fields use `dimension_with_auto` where type 0 is auto —
  absent margins must be sent as `[length, 0]` or auto margins center
  children and consume free space.
- AppKit anchor constraints solve on alignment rects; textfield frames sit
  ~2pt outside them — probe spacing is measured on `alignmentRect`.
- `masonview` needed an `applyProps` case (props were silently dropped),
  `classSpacing` (`gap-*` classes) and `dockInsets` (`padding` style)
  entries in the class/style handlers.

`pnpm probe run research/mason/mason.macos.tsrx --target macos` — all 7
assertions pass: flex column stacking, `className="gap-4"` → 16pt, style
`columnGap:12`, `display:grid` + `1fr 1fr` equal-width columns, foreign
`<label>` intrinsic measure + placement. Nested `masonview` subtrees recurse
correctly (records are preorder DFS, 22 floats/node). `mason-ffi.macos.ts`
is a standalone engine smoke covering dlopen → node/style/compute/layout
round-trip.

## Unresolved

- `masontext` vs `<label>`: mason `Text` has its own run/inline model;
  nested `Text`→`Span` mapping is untested.
- ListView embedding, gestures/accessibility props on mason views — unmeasured.
- Package maturity: beta, single-maintainer, ~daily releases. Version pins
  only; the `platforms/` payload is ~200MB unpacked.
- Windows: masonkit ships a `windows` platform block (9.1.0 floor) — aligns
  with the windows spike but untested there.

## Cutover (hard, pre-alpha)

Mason is the only native layout engine. The vocabulary collapsed to the CSS
core — `masonview` is the single layout intrinsic on every native target,
with `scrollview`/`liquidglass` as the chrome-wrapped hosts:

- **macOS**: `packages/macos-renderer/src/mason.ts` registers Mason-backed
  behaviors for `masonview`/`scrollview`/`liquidglass` only. `scrollview`
  keeps `NSScrollView` chrome with a mason document host; `orientation`
  stays on the builtin scrollview path (`configureScrollAxes`), styleDict
  re-reads it for flexDirection. The classic NSStackView/manual engines are
  deleted; `AccessibleHostView` preserves the tap/AX surface on mason
  containers. styleDict reads ALL CSS layout keys from the style bag only —
  every former layout-prop name warns-and-drops, matching the mobile driver.
- **iOS/Android (+Windows runtime)**: `@nativescript-community/octane` patch
  maps `masonview` to MasonKit `View` and `scrollview` to MasonKit `Scroll`
  in `elements.js`. `driver.js` has no layout-prop channel at all: every
  former prop name (contract props, LayoutChildProps sugar, raw CSS keys)
  warns-and-drops, and all CSS semantics arrive through the `style` bag.
  Resolved layout longhands on foreign native children route to their Mason
  leaf via `Style.fromView`, synchronized after attach and on style changes — see
  upstream-limitation rows in `feedback_observations` (no mason style buffer
  on plain views; no view-level CssProperties on mason's ViewBase).
  Component-level sugar (`row`/`col`/`span`, `dock`, edges, alignment, flex
  props) is translated to CSS in `packages/ui/src/layout-child.ts`, identical
  in spirit to `layout-child.web.ts`.
- **Web**: unchanged — DOM CSS implements the same model; Mason never runs.

Runtime evidence: `research/mason/mason-cutover.macos.tsrx` — 10/10
assertions across stack/flex/grid/absolute/dock/wrap/liquidglass/scroll.

## Foreign-leaf layout regression (issue #31)

MasonKit **1.0.0-beta.110** only forwards property changes to its own views:
`properties.ts:getViewStyle` reads `_styleHelper`, which plain NativeScript
views (including the vendored SVGView) do not expose. Its native foreign-leaf
node therefore misses class-authored layout dimensions. Source evidence:
[MasonKit properties](https://github.com/triniwiz/nativescript-mason/blob/1.0.0-beta.110/packages/nativescript-masonkit/properties.ts),
[reported UIKit frames](https://github.com/octane-xplat/octane-xplat/issues/31).
The issue's runtime measurements establish the original iOS regression;
they do not qualify this patch.

The canonical Octane **0.2.5** patch bridges the resolved NativeScript style
to foreign Mason leaves after attachment. It observes dimension, constraint,
margin, self-alignment, flex and grid placement longhands; `loaded` replays
them if the native view is created late or replaced. Style writes flush in a
synchronous Mason batch before requesting the parent layout; otherwise a
later class change can leave the native frame at its old dimensions.
Detach, disposal and
view re-registration release the subscriptions. Parsed physical-pixel lengths
convert to DIP at this boundary because Mason's object-length setter scales
`px` as DIP. Removed inline keys trigger CSS re-evaluation so classes become
effective again. Mason-owned views retain their own property handlers.

```tsx
<masonview style={{ display: 'flex' }} className="centered-cell">
  <svgview src={markup} className="tall-icon" />
</masonview>
```

```css
.centered-cell { align-items: center; justify-content: center; }
.tall-icon { width: 31; height: 36; }
```

`applyMasonDefaults` no longer writes local `alignItems: stretch`: the core
CssProperty already defaults to stretch, and a local write defeats class
centering. The SVG fork separately corrects width-constrained measurement
from `width * ratio` to `width / ratio`, where ratio is intrinsic width /
height. Both explicit dimensions and height-only measurement remain exact.

Coverage: `packages/cli/test/mason-layout.test.mjs` exercises resolved style
changes, override removal, unit conversion, deferred native creation and
subscription teardown. `packages/ui/tests/svg-measure.ios.test.mjs` invokes
the vendored iOS measurement with non-square dimensions and 3× density.
These are host tests; native geometry qualification is reported separately.
Keep the bridge until upstream forwards effective styles to foreign leaves
through attachment and native recreation, including resets.


On Android, ordinary native widgets have no `Element.syncStyleParts` method.
The MasonKit **1.0.0-beta.110** JavaScript patch forwards the bridge's layout
dirty word through `Style.setStateFromHalves$masonkit_release`, the same
Kotlin operation used by `Element.syncStyle`. All forwarded layout flags fit
in the first unsigned 32-bit word; other words reject explicitly instead of
losing precision or marking unrelated fields dirty. Mason-owned Elements
retain their existing path. The helper is covered with a native-Style stub;
Android device rendering remains unqualified.


The iOS `UIView.mason_syncStyleParts` implementation returns for a view that
is not a `MasonElement` ([upstream source](https://github.com/triniwiz/nativescript-mason/blob/1.0.0-beta.110/packages/nativescript-masonkit/src-native/mason-ios/Mason/Mason/Extensions.swift)).
A foreign leaf can therefore use the initial buffer values while retaining
cached geometry after later class changes. The JavaScript patch explicitly
calls `NSCMason.shared.nodeForView(view, true).markDirty()` for foreign
leaves, followed by the driver's parent layout request. It preserves the
existing sync path for Mason-owned views.


### iOS qualification

The nonvisual probe `research/issue-31/layout.mobile.tsrx` passed **12/12**
assertions on the iPhone 18 Pro / iOS 27 simulator (run
`88a310be-c222-4b7e-863b-7bb7704bb90a`, 2026-10-20, on the ported patch). It
measured native host sizes and relative positions in a 330×82 three-column
grid:

| Host | Measured size (pt) |
| --- | --- |
| Class-sized non-square SVG | 31×36 |
| Class-sized square SVG host | 54×54 |
| Class-sized native label | 43×43 |
| Width-only non-square SVG | 31×36 |

Both centering axes passed. Changing the SVG class while applying an inline
width produced 30×43; removing that override restored the class's 43×43.
The fixture places the grid 100 pt below the window top. At the top safe
area, foreign native frames can be clipped even when Mason's style dimensions
are correct; that separate observation is recorded in Silo feedback
`3cb2e7bf-283e-4823-824d-bf09db9f4e1c`. This run does not qualify safe-area
parity, Android rendering, OS input, or hit-testing.

### Android qualification

The same probe ran on CPH2551 / Android (run
`e606bdb7-f1e2-4953-881d-61141ca8ad03`, 2026-10-20, after the reflective
`setStateFromHalves` dispatch fix). Class-authored explicit sizes reach
foreign leaves: non-square SVG 31×36, square SVG 54×54 (53.85 measured),
native label 43×43 — 6 of 8 size assertions passed before the case timed
out. The width-only SVG (class `width: 31`, `height: auto`) measured 31×0.

Diagnosis: the vendored Android `onMeasure` read `getDocumentViewBox()` per
measure, but the fixture SVG has `width`/`height` and no `viewBox`, so the
call returned null and the ratio-inference branch was skipped — the raw
UNSPECIFIED height (0) was emitted. It also computed height-from-width as
`width * ratio` instead of `width / ratio`. The vendored fix (`9ca8f44`,
branch `fix/android-svg-intrinsic-measure`) captures the intrinsic size in
`setSvg` — `getDocumentViewBox()`, else `getDocumentWidth/Height()` when both
are positive (verified on-device: 31×36 for the fixture) — before the `100%`
document overrides erase it, then measures with `width / ratio` like iOS.

Re-run `3a179de1-542f-46eb-b19a-27fb87b0ec80` (2026-10-20, same probe) then
passed all 10 size and centering assertions, including width-only at 31×36.
The remaining override gap is fixed. `Style.updateNativeStyle` invalidates
via `Element.invalidateLayout()` only when `node.getView()` is an Element;
a foreign view got a bare `View.invalidate()` — redraw, no relayout — so the
dirty words landed but compute never reran (measured: the leaf node stayed
`isDirty` with a stale 31×36 computed layout). The patch now mirrors
upstream's `invalidateForeignHost`: after the style write it calls
`view.forceLayout()`, `Mason.nodeForView(view).dirty()`, then the parent
Element's `invalidateLayout()` — all public. Run
`a89bc6da-35d5-4c5a-a6cc-563a16ae65e1` (2026-10-20) passes **12/12**,
including the inline override to 30×43 and its removal restoring 43×43.

Foreign leaves now receive only the longhands listed in the bridge. Under the
replaced stash/replay path, inline `inset`, `gridArea` and `display` on a
foreign leaf were also forwarded. No framework component sets them there, but
an app's inline value for those keys no longer reaches the leaf.

The change restores existing class/inline layout behavior without changing a
public API or app-building workflow. No recipe criteria or examples require
migration; `pnpm check:recipes` remains a structure/link check rather than
runtime qualification.

## Scroll commands after the cutover

Routing-retention qualification exposed a missing integration in
`ScrollableArea`: its handle called NativeScript ScrollView methods, but the
patched driver instantiates Mason `Scroll`. An actual release iOS run reported
no `scrollToVerticalOffset`, `verticalOffset` or `scrollableHeight` on that
wrapper. An object-driver test that checked only ref identity passed and did
not establish this SDK contract.

Exact-version source evidence: installed `@triniwiz/nativescript-masonkit`
`1.0.0-beta.110`, fetched through opensrc, has `Scroll extends ViewBase` in
`scroll/index.{ios,android,windows}.ts`; it does not add those NativeScript
ScrollView methods. The local `@nativescript-community/octane@0.2.5` patch's
`elements.js` hunk selects that class for `scrollview`.

The local `scrollable-area-offset` leaves adapt `ScrollableAreaHandle` writes:
iOS uses `MasonUIView.contentOffset` (native clamping, instant writes), Android
uses `TwoDScrollView.scrollTo`/`smoothScrollTo` with dip-to-pixel conversion, and
Windows targets the outer `nativeViewProtected` ScrollViewer's `ChangeView`.
The Windows `windows` property identifies its inner Mason content view, so it
is not the scroll target. These helpers add no dependency or renderer patch.
The nullable axes and animation flag follow the
[WinUI method contract](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.scrollviewer.changeview?view=windows-app-sdk-1.8);
bridge execution still requires a Windows VM.

```ts
// Shared application code uses the portable handle, not ScrollView methods.
import type { ScrollableAreaHandle } from '@octane-xplat/ui'
function revealStart(area: ScrollableAreaHandle) {
	area.scrollToOffset({ block: 0 })
}
```

Source evidence: `src-native/mason-ios/Mason/Mason/MasonUIView.swift` defines
`contentOffset` and clamps it through bounds; the setter explicitly disables
implicit animation. Android `TwoDScrollView.kt` accepts physical pixels.
The maintained adapter tests check units, omitted axes and invalid input;
[routing qualification](../navigation-checks.md) records actual
target execution separately. Windows has no VM and remains source/mock evidence.

This command adapter does not provide a NativeScript-shaped event/metric facade.
Other helpers that still read `verticalOffset`/`scrollableHeight` or subscribe to
NativeScript `scroll` need a separate Mason integration audit, including
`useScrollableArea`, chat scrolling and outline reveal. Do not infer their
behavior from imperative commands or from retained-view routing checks.

## Foreign `Image` children are not re-measured after the bitmap loads

Upstream: `@nativescript/core` 9.1.3 (`ui/image` `onMeasure` /
`_imageSourceAffectsLayout`), `@triniwiz/nativescript-masonkit`
1.0.0-beta.110 (`_masonMeasureForeign` foreign-child measure blocks).

**Condition.** An NS `Image` embedded as a foreign (non-Mason) child of a
Mason container whose size depends on the bitmap — an unsized image, or
one with only a width whose height is intrinsic. Runtime evidence: iOS
simulator (`research/probes/image-intrinsic.tsrx`, GH#36), saved at
`research/probes/results/gh36-ios-after.json` and
`research/probes/results/gh36-ios-control.json`.

**Limitation.** When the bitmap arrives the view is not re-measured: the
intrinsic axis stays 0 and no `layoutChanged` refires, even though the
image decoded and `imageSource` is set. In the control run (workaround
disabled) the unsized case `img-a` recorded
`_imageSourceAffectsLayout: false` and needed a manual `requestLayout` —
Mason's foreign-child measure spec had passed both axes EXACTLY on the
last `onMeasure`, so NS `Image._setNativeImage` never called
`requestLayout` after the load. The other cases recorded
`_imageSourceAffectsLayout: true` and resolved without a nudge — the
single manual `requestLayout` on `img-a` climbs to the Page and
re-measures the whole tree, so per-case isolation is impossible within
one probe run.

**Workaround (iOS).** `packages/ui/src/image-sizing.ts` registers
`imageSourceChange` on the image view and calls `view.requestLayout()`
itself (`relayoutOnImageSource`, enabled on iOS only — see the Android
paragraph below) — unconditional, since a same-size rebind with a different aspect
needs the re-measure too. With it, every case in
`gh36-ios-after.json` resolves its intrinsic axis with no nudge.
The #31 foreign-leaf style bridge does not cover this: on top of it
(`gh36-ios-main-control.json`, iPhone 18 Pro simulator, workaround
disabled) `img-a` still recorded `_imageSourceAffectsLayout: false` and
needed the nudge. Removal condition: upstream re-measures a foreign child
when NS core requests layout from an image load.

**Android first layout** (`gh36-android-after.json`, emulator API 35
@160dpi): Android `isLayoutValid` is
`!nativeView.isLayoutRequested()` — a 0×0 image's first layout flips it
true with no `layoutChanged` at all (bounds unchanged) — and `loaded`
can fire before the binding's listener attaches, so nothing re-runs the
src gate. The same file therefore also retries a held issue on deferred
ticks (`setTimeout`, capped at 10) while the view is attached, which
lands the issue on `img-a` (loads at 400×300, then re-decodes at the
laid-out size on the real layout).

**Resolved by the #31 bridge: width-only height and percentage sizes**
(#40, #41). Before the bridge, Android laid a width-only `img-b`/`img-e`
out at 214×240 instead of 214×160.5, and an `Image` with
`style={{ width: '100%', height: '100%' }}` inside a `flexGrow: 1` child
of a 107×200 box came out at its bitmap's aspect on iOS (107×80.5) and its
bitmap size on Android (400×300) (`gh36-*-after.json`). Mason's Android
default measure (`Node.kt` `measureFunc`) passes a known dimension as
`EXACTLY`; without one it falls back to the view's `layoutParams`. An
`AT_MOST 320` width spec (the available width, as for a `MATCH_PARENT`
leaf) reproduces the 240 through NS `ImageView.onMeasure` (320 × 0.75);
that the leaf took this path is inferred from the numbers, not traced.
With the bridge forwarding the leaf's
resolved `width`/`height`, the same probe on main
(`gh36-ios-main.json`, `gh36-android-main.json`) measures `img-b` at
214×160.67 / 214×161 and fills 107×200 for percentages both inside a
`flexGrow` parent (`img-d`) and in a fixed box (`img-f`).

**Android: an extra leaf `requestLayout` collapses flex-grown auto
heights.** In a fixed 107×200 box, an `Image` with
`style={{ flexGrow: 1, alignSelf: 'stretch' }}` filled on iOS but stayed
at its bitmap aspect (107×80) on Android while the workaround above also
ran there (`img-g`, `gh36-android-stretch-diag.json`). Mason's computed
layout for the leaf was 107×200; the native frame and measured size were
107×80. MasonKit's Android `applyLayoutFlat` (`Element.kt`, foreign-leaf
block) re-measures a foreign leaf whose `isLayoutRequested` is set and
whose style height is `auto` with an `UNSPECIFIED` height, then applies
that content height in place of Taffy's — 107 × 0.75 = 80 through NS
`ImageView.onMeasure`. With the workaround disabled on Android
(`gh36-android-stretch-control.json`) every case passed, including
`img-g` at 107×200 and the unsized `img-a` without a nudge: Android's
Mason already re-measures a leaf that has a pending request. The
workaround is therefore iOS-only (`relayoutOnImageSource: isIOS` in
`Image.tsrx`). The Mason path itself remains and is not specific to images; see the
next section.

## Android: a foreign leaf with a pending layout request loses its flex height

Upstream: `@triniwiz/nativescript-masonkit` 1.0.0-beta.110,
`Element.kt` `applyLayoutFlat`, foreign-leaf block:
`freeHeight = fallbackHeight || (leafChanged && autoHeight)` where
`leafChanged = view.isLayoutRequested` and `autoHeight` is the leaf's
style height being `auto`. When true, the leaf is re-measured with an
`UNSPECIFIED` height and `height = view.measuredHeight` replaces Taffy's
height for the frame. A height that Taffy derived from `flexGrow` or
`align-items/align-self: stretch` is therefore replaced by the content
height whenever the leaf itself has requested layout.

Runtime evidence: `research/probes/leaf-remeasure.mobile.tsrx` on the
API 35 emulator (`research/probes/results/gh36-android-leaf2.json`), raw NS
intrinsics in 107×200 `masonview` boxes, no `@octane-xplat/ui` bindings.
Mason's computed layout was 107×200 for every leaf at every step:

| Leaf | First layout | Parent-only `requestLayout` | Leaf `requestLayout` / text change |
| --- | --- | --- | --- |
| `label`, `flexGrow: 1` + `alignSelf: stretch`, column | 107×16 | 107×200 | 107×16 |
| `label`, `flexGrow: 1`, row (height from stretch only) | 107×16 | 107×200 | 107×16 |
| `label`, same as first, `text` changed | 107×16 | 107×200 | 107×16 |
| `image`, `flexGrow: 1` + `alignSelf: stretch`, column | 107×80 | 107×200 | 107×80 |
| `label`, explicit `width: 107; height: 200` (control) | 107×200 | 107×200 | 107×200 |

A parent-only request heals every leaf; a leaf's own request collapses it
again. iOS is unaffected: the same probe on an iPhone 18 Pro / iOS 27
simulator (`gh36-ios-leaf.json`) measured 107×200 for every leaf at every
step. Tracked as #42. The first layout already collapses, so a new foreign leaf reaches
its first Mason pass with a pending request; a likely source is the #31
bridge's Android `syncAndroidForeignLayout`, which calls
`view.forceLayout()` after each style sync (not isolated). A text change
or image load raises one naturally.
Explicit heights are unaffected (`autoHeight` is false), and widths are
unaffected (only an empty width falls back to the measure).

Expected upstream fix: for `leafChanged` alone, re-measure only to dirty
the node and recompute — keep Taffy's assigned height instead of
`view.measuredHeight`; reserve the measured-height fallback for an empty
axis (`fallbackHeight`). The path lives in the Kotlin AAR, which the JS
patch set cannot change.

## iOS collapsed Text investigation (#45)

**Status: reproduced and corrected on the iOS 27 iPhone 18 Pro simulator.** The
consumer reports a main-thread freeze with one collapsed `Text` inside
`Screen > Grid(rows="*", columns="*,*")` on iOS 27, with MasonKit beta.110
and `@octane-xplat/nativescript-masonkit` beta.126. Hidden Text and a collapsed
View containing visible Text keep timers running. See
[issue #45](https://github.com/octane-xplat/octane-xplat/issues/45).

Source inspection of beta.126 and NativeScript core 9.1.3 identifies an
inconsistent layout contract. Xplat Text hosts a core Label. Core's
`ViewHelper.measureChild` skips collapsed children, leaving the foreign
measurement at zero. Mason still includes the leaf in its layout tree because
the renderer bridge previously copied neither `display` nor `visibility`.
In `MasonElement.swift`, `MasonElementHelpers.applyBox` treats an empty
auto-sized axis as a reason to call UIKit's `sizeThatFits`. The label returns
its nonzero text size. Mason marks the node dirty and requests another root
layout, which measures the collapsed label as zero again. This continually
repeats through `MasonUIView.layoutSubviews` and `autoComputeIfRoot`.

The original renderer reproduced the stall with the isolated single-label
probe. A native sample captured repeated Taffy flexbox computation and
`applyBox → requestLayout`; an LLDB breakpoint on `MasonElement.requestLayout`
confirmed the caller chain `applyBox → applyToView → computeWithSize →
autoComputeIfRoot → layoutSubviews`. The process used approximately one CPU
core and delivered no heartbeat result; it was terminated after collecting
the trace. This is runtime evidence of the invalidation edge, not an inference
from the sampled Taffy frame alone.

The canonical renderer patch forwards effective `display` and
observes `visibilityChange`: collapse selects Mason `display: none`, while
hidden/visible restore the effective display. It leaves the authored
NativeScript style intact, batches the write before requesting parent layout,
and avoids another request for an unchanged effective value. Mason's
`applyToView` skips `display: none`, so the collapsed leaf never reaches the
nonzero-size fallback. Existing leaf binding teardown and native-view
recreation apply to these properties too.
The patch can be removed when the adopted upstream foreign-child bridge
implements the same layout omission and restoration semantics.

The temporary reproduction is `research/issue45/collapsed-text.tsrx`.
Maintained host regressions live in `packages/cli/test/mason-layout.test.mjs`;
the device regression in `apps/mobile/src/tests/collapsed-text.spec.tsrx`
checks timer liveness with the exact single-leaf structure and grid-slot
restoration through collapse/hidden/visible transitions.

The patched probe passed on 2026-10-23 with MasonKit beta.126 and core 9.1.3:
five 200 ms heartbeats each for collapsed Text, hidden Text, and a collapsed
View containing visible Text. A fixed-width two-item grid placed the following
item at x=0 when collapsed, x=80 when hidden, x=0 when collapsed again, and
x=80 when visible. Evidence is in `research/issue45/controls-retry.log`,
`layout-loop-sample.txt`, and `baseline-lldb.log`. The maintained device spec
was typechecked; runtime verification used the probe runner. Focused host
regressions, affected-package/dependent typechecks, lint, patch synchronization,
and recipe structure checks passed. Android and desktop runtimes were not run.
No public workflow or recipe contract changes; the Octane skill's styling
guidance remains applicable. No visual analysis was performed.

## Core extraction: C interface boundaries (2026-10-22)

Source examined: the `octane-xplat/nativescript-mason` fork at
`623114b070896a21315fcff9a3a6349bdd091cc4` (beta.126), including upstream
`2324b8ee52a1f22cf18dc684aa053e92b64a6451`. These findings concern the
independent core prototype; Xplat's existing MasonKit integration is unchanged.

- **Android foreign measurement is not exposed through the generic C callback
  API.** The constructors and context setters in
  [`crates/mason-c/src/node.rs`](https://github.com/octane-xplat/nativescript-mason/blob/623114b070896a21315fcff9a3a6349bdd091cc4/crates/mason-c/src/node.rs)
  are guarded by `cfg(not(target_os = "android"))`. Android uses the JNI path.
  Core leaves that C callback interface unsupported on Android; a successful
  host callback test or Android engine archive compilation does not qualify
  foreign-view measurement. An extracted JNI host or a deliberately supported
  Android C callback boundary must be proved before adopting core there.
- **The checked-in generated Apple header overstates the non-Apple surface.**
  [`mason_native.h`](https://github.com/octane-xplat/nativescript-mason/blob/623114b070896a21315fcff9a3a6349bdd091cc4/packages/nativescript-masonkit/src-native/mason-ios/Mason/Mason/include/mason_native.h)
  declares Apple-only buffer/node functions without guards matching Rust's
  `cfg(target_vendor = "apple")`. Its non-Android callback guards also depend
  on `TARGET_OS_ANDROID`, rather than deriving it from the C compiler target.
  Core's build stages a header with explicit guards and verifies declarations
  against archive symbols for each target. It does not edit MasonKit's header
  or claim that the existing package supports those declarations on Android.
  Replace this staging adapter when canonical C header generation emits the
  matching platform guards.

Evidence is source inspection and the prototype's isolated engine checks,
not NativeScript application or OS-input qualification. The extraction design
and its remaining host/artifact gates are in
[Mason core extraction](../../design/mason-core-extraction.md).

## Core extraction: Android style synchronization (2026-10-22)

The first core-only Android instrumentation run executed 17 tests: 15 passed,
including all 12 unchanged foreign-view regressions. Two new cases failed.
The source baseline is fork beta.126 (`623114b070896a21315fcff9a3a6349bdd091cc4`);
the host projection is in Mason fork commit `70a1fbba`.

- **A standalone grid-template write can miss native synchronization.** In
  `Style.kt`, `isSlowDirty` invokes `updateNativeStyle()` before assigning its
  backing field. The sync therefore reads the old flag; assigning it afterward
  can also undo `resetState()`. A two-column grid put its second child at x=0
  instead of x=100. The full native source contains the same setter, and
  `NodeHelper.setGridTemplateColumns` delegates directly to it; full-package
  runtime reproduction remains pending. Core's temporary projection moves the
  field assignment before the sync. The direct-setter regression remains in
  the suite; batching the test would conceal the affected path. Offer this
  narrow fix upstream separately from extraction and remove the projection
  adaptation when the shared source is fixed.
- **The foreign-view percent helper omits root-cache invalidation.** Directly
  writing `mason.nodeForView(label).style` left the label at intrinsic width
  rather than the requested percentage. Mason already provides
  `setPercentWidth(view, fraction)` (NaN clears) and `syncStyleParts(view, ...)`
  for this purpose. A second run using `setPercentWidth` still left the label at
  intrinsic width. Source inspection found that this helper dirties the leaf,
  while the root's `computeStale` only checks its own cache and constraints;
  `syncStyleParts` already explicitly invalidates that root cache. Core's
  projection adds the same root-cache invalidation to `setPercent`, retaining
  the public-API percent/resize/reset regression. The qualified test sets
  definite parent dimensions and engine scale explicitly: a 200-wide parent
  gives a 100-wide leaf at 50%; resizing the parent to 300 gives 150; clearing
  restores intrinsic width. A control build removing only the root-cache
  correction fails that same test with an intrinsic-width leaf. Full-package
  runtime reproduction remains pending. Xplat's existing consumer is unchanged.

The run evidence is `tmp/mason-core-android-tests/1792697068284/instrumentation.log`
in the Mason worktree. Subsequent fixes must pass the same geometry assertions
before Android core runtime qualification is claimed.

The second run also exposed a fixture unit mismatch: `100px` grid tracks scale
with Android density, while native point dimensions and frame assertions use
physical pixels. The grid test now explicitly sets engine device scale to 1;
its direct-setter x=100 assertion remains. The first run's x=0 was still a
synchronization failure; after the flag-order fix it became the correctly
density-scaled x=262 on the default emulator.

After the grid correction (`f002b702` in the Mason fork), both an API 35 emulator
and an API 36 physical phone passed 16 of 17 tests, including every unchanged
foreign-view regression. The percentage case still returned intrinsic width
at that stage. That physical run is recorded in
`tmp/mason-core-android-device-tests/1792698937501/instrumentation.log`. Native
instrumentation does not qualify NativeScript lifecycle or OS input.

After the percent correction and fixture qualification (`de56b5ca` in the Mason
fork), all 17 tests pass on the API 36 arm64 phone without skips. The control
build fails one of 17 with the same test and containing block; restoring the
correction restores all 17 passes. Evidence lives in the Mason worktree at
`tmp/mason-core-baseline/android-percent-control-physical.log` and
`tmp/mason-core-baseline/android-percent-final-verification.log`. The API 35
emulator has not been rerun after this final correction.

## Core extraction: NativeScript consumers and types (2026-10-22)

The isolated core-only NativeScript apps pass bridge, native geometry and
ownership assertions on an arm64 iOS 27 simulator and API 36 arm64 Android
phone. They install only core and NativeScript core as runtime dependencies.
The Android APK contains only the supported arm64-v8a slice. These checks do
not qualify the Xplat renderer or OS input. Source and commands live in the
Mason fork's `tools/mason-core/plugin-README.md`.

Three build boundaries needed explicit treatment:

- NativeScript webpack 5.0.38 does not define MasonKit's `__WINDOWS__` flag;
  the first mobile app failed with an undefined identifier. Core's generated
  iOS/Android JavaScript resolves it to `false`, preserving the tracked shared
  source and full-package emission.
- The iOS 27 SDK requires the scene lifecycle. The fixture declares the scene
  manifest and uses NativeScript core 9.1.2's default scene delegate. Without
  that declaration, UIKit aborts after successful core imports. This is app
  setup evidence, not a Mason native-host defect.
- NativeScript Android 9.1.1's declaration generator emits invalid TypeScript
  for the extracted Kotlin AAR: invalid parameter names, broken ignored
  generic types and nested namespace braces. The prototype applies a pinned,
  hash-checked patch to the generator in an ignored staging directory; it does
  not modify the installed SDK or ship generator code. Provenance and removal
  conditions live in `tools/mason-core/native-types-README.md` in the Mason fork.

Core generates its bridge declarations directly from its own native artifacts.
Direct iOS generation matches the working app's core/dependency declarations
byte for byte. Compilation records its input files and rejects full MasonKit
native declarations. Packed-consumer checks cover native host factories as
well as HTML API exclusions; standard SDK ambient types and `skipLibCheck`
remain required. A Windows-only rich-text copying method is omitted from
generated mobile style code; the tracked shared module and full package retain
it. Native compatibility, iOS device packaging and matched release application
sizes remain separate gates.

### Queued foreign-style release

The first renderer runs exposed a separate lifetime problem: reparenting and
destroying a foreign label in one turn can leave adoption-time style work in
the shared queue after NativeScript clears its native view. iOS then calls a
missing native target; Android can enter JNI with a pending null-view exception.
Phase/native-target diagnostics identify the released label. Plain consumers
using the same current SDK pins and dependency graph pass on both platforms.

The shared release helper removes its binding and restores the original style
prototype, but does not cancel already queued style work. Mason fork commit
`8eeeafe7` adds cancellation only to the generated core projection. A regression
using the real style queue fails without the adaptation, then passes with it;
it also verifies that a replacement native view still receives its writes.
The moved module and full package remain unchanged. Reproduce this separately
in full MasonKit before offering the narrow source fix upstream.

The corrected renderer scenario passes on arm64 iOS 27 Simulator and the API 35
arm64 Android emulator. It uses Octane 0.14.0, renderer 0.2.5 and NativeScript
core 9.1.3 with canonical Xplat patches; only the renderer's two Mason imports
are retargeted. Assertions cover native geometry, style updates, reparenting,
disposal and an Octane host-plan component mounting, updating without recreating
its label, and unmounting. NativeScript controls with the identical dependency
graph also pass. Evidence lives in the Mason worktree at
`tmp/mason-core-baseline/test-renderer-foreign-release-fix-ios.log` and
`tmp/mason-core-baseline/test-renderer-foreign-release-fix-android.log`.
Actual OS input and a physical Android renderer run remain unverified.

### Compiled TSRX, hooks and scroll hosting

Mason fork commit `1c33d454` adds an authored TSRX consumer compiled with Octane
0.14.0 and its declared optional parser peer, `@tsrx/oxc` 0.20.0. The parser is
fixture development tooling, with no core dependency change. Generated hooks
import the native renderer runtime, and the fixture records source/emission
hashes. Its Page/Frame bootstrap matches Xplat's mobile application.

Both arm64 iOS 27 Simulator and the API 35 Android emulator pass static class
geometry, a synthesized button handler updating native label text and width
from 90 to 130 without replacement, one mount effect, one disposal, a native
90-unit scroll seek, ref clearing and host release. Evidence lives in the
Mason worktree at `tmp/mason-core-baseline/test-compiled-consumer-ios.log` and
`tmp/mason-core-baseline/test-compiled-consumer-android.log`. This is compiled
component and native-runtime evidence; notification dispatch does not establish
OS hit-testing or touch scrolling. These debug builds do not establish release
application-size savings.

## Core extraction OS input qualification (2026-10-22)

The compiled TSRX core consumer passes actual OS taps and touch scrolling on
arm64 iOS 27 Simulator and an API 35 Android emulator. The iOS runner uses HID
coordinate input through its own private idb companion socket; Android uses
adb input after verifying the app has focus. Coordinates come from native view
geometry. Neither mode synthesizes a handler notification or programmatic seek.

Both targets update the hook-backed count and label width without replacing
the label, then dispose effects and clear refs on unmount. A native row moves
by the reported scroll offset: 137.3 points on iOS and 94.9 logical pixels on
Android. These are OS-input and geometry assertions; no screenshots or visual
analysis were used. Physical-device input remains unqualified. Reproduction
targets are `test.consumer.ios.input` and
`test.consumer.android.input.emulator` in the Mason fork.

## Core extraction iOS device artifact (2026-10-22)

The separate core projection builds an unsigned arm64 `iphoneos` framework.
Isolated Swift and Objective-C device clients link against it; all 99 C
declarations are exported and optional HTML/text/widget classes stay excluded.
The full tracked native project and sources remain unchanged.

The device and simulator slices have matching source hashes, public headers and
dependency locks. An XCFramework embeds each platform's SDWebImage privacy bundle
in its matching framework. The compiled simulator app discovers that resource
at runtime and passes actual HID input again. A separately prepared unsigned
NativeScript device app selects the IOS framework slice, embeds a bundle marked
`iPhoneOS`, and generates the core bridge classes. No certificates, provisioning
updates or device installation are used. These are build/metadata checks, not
physical iOS device runtime qualification or release-size measurements.

## Core extraction full Android baseline (2026-10-22)

All 72 tests in seven selected unchanged full-package instrumentation classes
pass on the API 35 arm64 emulator with no skips. They cover HTML input parsing,
input widgets, lists, rich-text line-height/inline layout/defaults, and viewport
unit parsing. The full main source/resource tree is copied byte-identically into
isolated staging; build wiring uses core's same unchanged JNI binary and fixed
FontManager version. The tracked full native sources and project stay unchanged.
No screenshot/image assertions are run. Full iOS native qualification is pending.

The final core-only native suite also passes all 17 tests on the same emulator,
including the percentage cache regression previously verified on the phone.

The full/core AARs measure 2,332,626 / 1,780,097 bytes. Their classes.jar entries
measure 1,886,358 / 1,321,673 bytes with 758 / 600 class files. Both arm64 JNI
entries are byte-identical and measure 1,146,832 bytes. These are library
artifact measurements; matching release APK savings remain unmeasured.
Reproduction and limits live in `tools/mason-core/full-baseline-README.md`
in the Mason fork.

## Core extraction full iOS baseline (2026-10-22)

The full native sources at the beta.126 extraction baseline
`623114b070896a21315fcff9a3a6349bdd091cc4` compile in an isolated simulator
project with byte-identical Swift/test bodies and the qualified unchanged C
engine archive. The original Xcode target omits `MasonTextNodeTests.swift` and
`AnonymousContainerRemovalTests.swift`; selecting their classes initially
executes only 25 tests. The maintained expected-count check rejects that result.

Registering those existing files only in temporary build wiring executes all 28
on arm64 iOS 27 Simulator: 27 pass and
`MasonTextNodeTests.test_text_node_processing_uppercase_and_whitespace` fails
its `HELLO WORLD` substring assertion at line 19. HTML parsing, input appearance,
author/anonymous child ownership and all 11 foreign-layout tests pass. No native
source relocation or full implementation change has occurred. This is runtime
evidence of a failing full-source test, not an established diagnosis of its
text-processing cause. Core excludes the full text renderer.

The original project, native implementation and test bodies remain unchanged.
The baseline stays nonzero; no assertion or expected count is weakened. Upstream
test-target registration and resolution or clarification of that text assertion
are needed for an entirely green full baseline. Recheck on the next upstream
update. Evidence: `tools/mason-core/full-baseline-README.md`,
`tmp/mason-core-baseline/test-ios-full-and-core-final.log` and the corresponding
`tmp/mason-full-ios-tests` result bundle in the Mason fork. No screenshots or
image assertions are used.

The complete rerun with verbose diagnostics disabled repeats the same 27/28
full result and separately passes all 15 core native tests through the updated
runner. The full result summary preserves one failure and zero skips.

## Core extraction native source moves (2026-10-22)

Twenty-five Swift and 86 Kotlin/Java modules move into core with `git mv`, all
with 100% source similarity. The native path manifest records original and new
roots plus baseline hashes. Full Xcode edits change only those source references;
full Gradle adds their shared source set. Neither full package acquires a core
runtime dependency. The remaining adapted source files stay in the full tree,
with core transformations outside their bodies. Rust/JNI implementations and
full native implementation bytes remain unchanged.

All four full/core native source inventories exactly match saved pre-move
controls. Both hosts and full native baselines rebuild. The actual original
full Gradle project also compiles its relocated Kotlin/Java source set, excluding
the separately qualified Rust build. iOS bridge declarations retain their
contents; their provenance is refreshed to the rebuilt simulator binary hash.

Core native tests pass 15/15 on iOS Simulator and 17/17 on Android emulator.
Full Android passes 72/72. Full iOS retains exactly its pre-move 27-pass, one-fail
result, including the same text-node test identifier and zero skips. Core's six
runtime regression tests also pass. The compiled core consumer builds on both
platforms and passes actual HID input on iOS Simulator and adb input on the
Android emulator. No screenshot/image
analysis is used. Commands and source mapping are recorded in
`tools/mason-core/README.md` and `native-relocations.json` in the Mason fork.
