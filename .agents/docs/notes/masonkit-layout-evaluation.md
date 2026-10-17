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

## Unresolved

- Where mason belongs long-term: opt-in leaf package (`@octane-xplat/mason`,
  decision #51 shape) vs. swapping shared `View`/`ScrollView` native leaves.
  Foreign-child hosting makes the opt-in path safe to land first.
- `masontext` vs `<label>`: mason `Text` has its own run/inline model;
  nested `Text`→`Span` mapping is untested.
- Scroll containers (`masonscroll` vs `scrollview`), ListView embedding,
  gestures/accessibility props on mason views — unmeasured.
- Package maturity: beta, single-maintainer, ~daily releases. Version pins
  only; the `platforms/` payload is ~200MB unpacked.
- Windows: masonkit ships a `windows` platform block (9.1.0 floor) — aligns
  with the windows spike but untested there.
