# Chart libraries (SVG-leaning survey)

> What to reference for a future `@octane-xplat/charts` leaf: DOM-free core
> serializing geometry to SVG markup — `<svg>` inline on web, `<svgview>`
> (vendored ui-svg → SVGKit/androidsvg) on native, webview desktops get the
> web leaf. Surveyed for "how do others split computation from rendering" and
> "where do labels and interaction live". All findings are `desk-source`
> (docs/source reading); nothing measured on a running target.

No surveyed library is adoptable — Recharts/visx/MUI-X are React-bound,
victory-native is React Native, ECharts is imperative and DOM-coupled for
interaction. What transfers is *shape*: four independent implementations have
converged on our proposed architecture (headless core → interchangeable
renderers, markup string as a first-class output, labels/tooltips as a
separate element layer).

## Architecture references (same problem shape)

### Vega / `vega-scenegraph` — the canonical scene graph

Spec → dataflow → scenegraph (alternating mark definitions and item sets) →
pluggable renderers: DOM-SVG, Canvas, and a **fast SVG *string* renderer**
used for SSR/export (`view.toSVG()` on a headless `renderer:'none'` View —
microsoft/flint-chart does exactly this in-process, then rasterizes with
resvg). An experimental **hybrid renderer** (vega PR #3810) layers SVG over
Canvas and routes mark *types* to each: motivating use is `<text>` → SVG,
marks → Canvas — i.e., "text is the special mark" is acknowledged upstream.
Caveat noted in their README: bounds calculation without a canvas-backed
text measurer is approximate. The serializer escape/defs/whitespace handling
in `vega-scenegraph` is the best scene→string reference implementation.

### ECharts / zrender — markup string + thin hydration

`ssr: true` mode (5.3+) renders a chart to a **dependency-free SVG string**
(`renderToSVGString()`, no container, animation/event modules disabled).
5.5 added `ssrClient` — a ~4KB runtime that *hydrates* the static SVG with
hover highlighting, click events, and legend toggles. This is the closest
existing proof of "static markup + a separate interaction layer" — our
equivalent is `svgview` + a transparent gesture overlay doing shared
hit-math (we can't reach into the parsed document, so the overlay maps
coordinates back to data instead of binding element ids).

### LayerCake — headless scales, interchangeable layers

Svelte framework where `LayerCake` computes scales/extents/measurement and
`Svg`, `Html`, `Canvas`, `WebGL` layout wrappers share **one coordinate
space**. Labels and annotations canonically go in the `Html` layer, not in
SVG. Charts are copy-from-gallery components living in the app. This is our
design almost exactly: shared coordinate math, marks in the vector layer,
labels/tooltips as real positioned elements.

### unovis — core/leaf at framework granularity

`@unovis/ts` carries all components/scales/containers; thin wrappers adapt it
to React/Angular/Svelte/Vue/Solid. The monorepo split (`packages/ts` +
`packages/<framework>`) is our leaf-package shape, except our "frameworks"
are render targets.

### gifted-charts-core — the closest living precedent

`react-native-gifted-charts` extracted `gifted-charts-core` (all math/logic)
so the same charts serve React Native (`react-native-svg` elements) and web
(`react-gifted-charts`). Their stated design: "a refined fusion of native UI
elements and SVG" — interaction chrome as platform elements, marks as SVG.
That's our svgview-marks + element-overlay plan, shipped and popular.
Its `pointerConfig` prop list (pointer strip, label component,
shiftPointerLabelX/Y, activate-on-long-press, persist-on-release) is a
complete interaction-prop taxonomy in one place.

## API-shape references (declarative surface)

| Library | What its API teaches |
| --- | --- |
| **Swift Charts** (iOS 16+) | Marks grammar — `Chart { LineMark/BarMark/AreaMark/PointMark/RuleMark/SectorMark }` composes instead of chart-type components. `.value("Day", d.day)` semantic labels feed axes, legend, and VoiceOver for free; `.foregroundStyle(by:)` generates legend + a11y from one channel. `AxisMarks` decomposes the axis into independently-composable `AxisGridLine`/`AxisTick`/`AxisValueLabel` with separate value lists. `chartOverlay`/`chartGesture` + `ChartProxy` = overlay hit-testing with coordinate↔data conversion — our interaction seam, blessed by Apple. |
| **Observable Plot** | `Plot.plot({ marks: [...] })` returns an SVG element (or `figure` when legend/caption attached). Channels (`x: "letter"`, accessors or column names) are the terse idiom. A mark may be a function returning arbitrary SVG — the escape hatch. `Plot.ruleY([0])` baseline idiom. |
| **Recharts** | The de-facto React chart API: `<LineChart data={…}><CartesianGrid/><Line dataKey="uv"/><XAxis dataKey="name"/><Tooltip/></LineChart>` — compound children under a data-owning root; `dataKey` strings; "lightweight dependency on D3 submodules." Reference for prop ergonomics only. |
| **MUI X Charts** | Two-tier API: self-contained `<LineChart …/>` vs composable primitives for mixed charts — worth copying (props cover the terse 90%, composition is the escape hatch). **`@mui/x-charts-vendor` is a vetted DOM-free d3 allowlist**: d3-array, d3-color, d3-format, d3-interpolate, d3-path, d3-scale, d3-shape, d3-time, d3-time-format, d3-timer (+internmap, flatqueue). |
| **visx** | "Not a charting library" — per-concern packages (`scale`/`shape`/`axis`/`event`/`tooltip`) over d3 with unopinionated state/animation. Our `core/` layer is exactly this job description, minus React. `@visx/chart` later added shared margin/xMax/yMax layout helpers — the reusable boilerplate every consumer rebuilds; fold those into our core from the start. |

## Native implementations (substrate reality checks)

- **react-native-svg** — the *alternative* substrate: every SVG element is a
  native shadow node. Software Mansion's own guidance (cited in
  `docs/notes/primitive-notes.md`): for static artwork prefer platform decoders —
  i.e., our whole-doc `svgview` approach over per-element nodes.
- **react-native-svg-charts** (JesperLekland) — thinnest d3→SVG mapping in
  the wild (d3-shape/d3-scale produce `d` strings, react-native-svg renders).
  Unmaintained since ~v5.4.0 (2022); "looking for maintainers." Readable in
  an afternoon; the decorator/`extras` pattern (children rendered below/above
  the marks) is a usable layering-API reference.
- **react-native-wagmi-charts** (coinjar) — d3-{array,scale,shape} +
  react-native-svg + Reanimated/RNGH. `LineChart.Provider` owns data +
  cursor state; subcomponents (`Path`, `CursorCrosshair`, `Tooltip`,
  `HoverTrap`) compose interaction. Long-press → snap-to-nearest-x →
  positioned crosshair/tooltip is the gesture→hit-math loop we need.
- **victory-native (classic)** — react-native-svg backend **deprecated**;
  Formidable rewrote native as **victory-native-xl** on Skia + Reanimated
  ("design decisions … not ideal for Native development"), and users report
  broken renders with several SVG charts on screen. Cautionary evidence for
  per-element SVG on native *and* for our escape valve: if `svgview`
  re-parsing bites on animated/live data, a `@octane-xplat/canvas` 2d leaf
  (Skia on both targets) is the same move XL made.
- **MPAndroidChart** (38k★, upstream dormant — AppDevNext/AndroidChart is the
  maintained fork) and its iOS port **Charts** (danielgindi) — canvas-drawn,
  but the interaction model is the reference: tap/drag highlight with slop,
  pinch-zoom viewport, per-entry markers.
- **Vico** — actively maintained Compose Multiplatform charts (3.x now
  targets iOS/desktop/web too); canvas-drawn; `DrawingModel` interpolators
  own per-layer animation — a clean seam for "which mark interpolates how."
- **AAChartKit / AAChartCore / AAInfographics** — popular "native" chart
  libs that are Highcharts running in an embedded WKWebView/Android
  WebView. The dominant xplat-native-chart pattern in the wild; not our path
  (we have real native SVG rendering), but it documents the fallback shape.

## What transfers

| Reference idea | Our adaptation |
| --- | --- |
| Vega scenegraph + `toSVG()` string renderer | `core/spec → marks → <svg> markup string` — the whole-doc string *is* our serialization; leaves are ~20 lines each |
| ECharts `ssrClient` hydration | `svgview` + transparent overlay (`usePan`/`onTap`) doing shared hit-math; tooltips/crosshair render as real elements |
| LayerCake `Html` layer / Vega hybrid text→SVG | Axis labels, titles, legends, tooltips as positioned elements in an `Absolute` overlay — never `<text>` in markup (androidsvg/SVGKit text is degraded; see `docs/notes/primitive-notes.md`) |
| gifted-charts-core split | DOM-free `core/` module inside `@octane-xplat/charts`; leaves contain only the element wiring |
| `@mui/x-charts-vendor` d3 list | Dependency allowlist for the core: `d3-scale`, `d3-shape`, `d3-array`, `d3-format`, `d3-time-format`, `d3-path`, `d3-interpolate`, `d3-color` — all DOM-free/JSC-safe candidates (verify like `@lisse/core`/`@tanstack/table-core` were) |
| Swift Charts marks + `AxisMarks` triple + `.value()` semantics | Composable marks over chart-type components; axis = gridline/tick/label as independent pieces; semantic value labels flow to `accessibilityLabel` |
| wagmi `Provider` + cursor components | Shared cursor state via module-scope store (cross-root rule); `pointerConfig`-style props for strip/label/long-press behavior |
| victory-native XL rewrite | `@octane-xplat/canvas` 2d leaf is the planned fallback if markup re-parse can't sustain live/animated charts — build the core's marks layer so both serializers can consume it |
| AAChartKit webview embedding | Explicitly rejected path — svgview already renders real SVG natively |
| MPAndroidChart highlight slop | Hit-testing constants (touch slop, nearest-x snapping) belong in shared `hit.ts`, not per-platform |

## Constraints our serializer must respect

The output contract is the **androidsvg ∩ SVGKit subset** (full table in
`docs/notes/primitive-notes.md`, topic `svg-icon-fidelity`): paths, basic shapes,
and linear gradients are safe; **no filters**; radial gradients and `<text>`
are degraded; `currentColor` needs explicit `color`/`fill` on the root. This
subset is why labels move to elements — and it means our serializer should
emit a deliberately restricted SVG dialect, enforced by tests, rather than
"any SVG."
