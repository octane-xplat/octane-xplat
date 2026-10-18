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
  containers.
- **iOS/Android (+Windows runtime)**: `@nativescript-community/octane` patch
  maps `masonview` to MasonKit `View` and `scrollview` to MasonKit `Scroll`
  in `elements.js`. `driver.js` forwards CSS-shaped props to `view.style`
  and translates LayoutChildProps sugar (`row`/`col`/`span` → grid lines,
  `dock`/edges → absolute insets, attached alignment → cross-axis
  self-align) on the child, replayed at `attach` via `Style.fromView` for
  foreign leaves — see upstream-limitation rows in `feedback_observations`
  (no mason style buffer on plain views; no view-level CssProperties on
  mason's ViewBase).
- **Web**: unchanged — DOM CSS implements the same model; Mason never runs.

Runtime evidence: `research/mason/mason-cutover.macos.tsrx` — 10/10
assertions across stack/flex/grid/absolute/dock/wrap/liquidglass/scroll.
