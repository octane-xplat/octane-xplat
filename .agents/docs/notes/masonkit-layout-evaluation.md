# MasonKit layout-engine evaluation

Evaluation of [`@triniwiz/nativescript-masonkit`](https://github.com/triniwiz/nativescript-mason)
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
  devDependency (chosen over beta.118: ≥7-day publish-age rule).
- `packages/cli/patches/@nativescript-community__octane@0.2.5.patch`:
  container capability hunk (see above).

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

**Workaround.** `packages/ui/src/image-sizing.ts` registers
`imageSourceChange` on the image view and calls `view.requestLayout()`
itself — unconditional, since a same-size rebind with a different aspect
needs the re-measure too. With it, every case in
`gh36-ios-after.json` resolves its intrinsic axis with no nudge.
Removal condition: upstream re-measures a foreign child when NS core
requests layout from an image load.

**Android companion gap** (`gh36-android-after.json`, emulator-5556,
API 35 @160dpi): Android `isLayoutValid` is
`!nativeView.isLayoutRequested()` — a 0×0 image's first layout flips it
true with no `layoutChanged` at all (bounds unchanged) — and `loaded`
fires before the binding's listener attaches, so nothing re-runs the
src gate. The same file therefore also retries a held issue on deferred
ticks (`setTimeout`, capped at 10) while the view is already attached,
which lands the issue on `img-a` (loads at 400×300, then re-decodes at
the laid-out size on the real layout). A width-only image (`img-b`) and
the srcset width-only case (`img-e`) both came out at 214×240 there —
not the intrinsic 160.5 height iOS produces — a separate, unisolated
platform divergence recorded alongside the D observation below. 240 is
the emulator's 320 px width × the bitmap's 0.75 aspect, so the hypothesis
is that the Android intrinsic measure derives height from the available
width rather than the authored 214; unverified. The binding only follows
that measure — decode dims match the laid-out 214×240.

**Separate unresolved observation.** In the same probe, an `Image` with
`style={{ width: '100%', height: '100%' }}` inside a `flexGrow: 1` child
of a 107×200 box laid out on iOS at 107×80.5 — the bitmap's aspect —
and on Android at 400×300, the bitmap's own size (`gh36-*-after.json`,
`img-d`). Either way the
percentage height resolved as auto rather than filling the parent.
Cause unisolated; recorded as evidence for a future issue.
