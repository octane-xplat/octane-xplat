# Charts (`@octane-xplat/charts`)

> Design record for a leaf package that renders the same charts on every
> target from one DOM-free core. Web, NativeScript, and AppKit leaves are
> implemented; verification is target-specific. Prior art surveyed in
> [`prior-art/charts.md`](../../prior-art/charts.md).

## Architecture

One artifact crosses the platform boundary: an **SVG markup string** produced
by a pure-TS core. The web leaf inlines it in a real `<svg>`; the native leaf
hands it to `<svgview>` (vendored ui-svg → SVGKit/androidsvg); the AppKit
leaf encodes it as a base64 SVG data URI for `<image>` / `NSImage`. Linux/Windows
desktop webviews and macOS webview apps inherit the web leaf. `Meter`
(decision #60) already proves src-string regeneration is the accepted update
path on `svgview`.

This shape is independently proven four ways (prior-art survey): Vega's
scenegraph + `toSVG()` string renderer, ECharts SSR `renderToSVGString()` +
`ssrClient` hydration, LayerCake's headless scales → interchangeable
`Svg`/`Html`/`Canvas` layers, and gifted-charts-core (one DOM-free core
feeding both RN and web leaves). Victory Native's react-native-svg → Skia
rewrite is the cautionary counter-proof for per-element native SVG.

```
props → core (scales/marks/layout) → Mark[] scene → svg.ts → <svg> string
                                                      ↘ hit.ts (interaction)
                                     label specs → leaf renders real elements
```

## Package shape

`packages/charts` → `@octane-xplat/charts`, lockstep `0.8.0`. Deps: the d3
DOM-free subset as real `dependencies` (decision #51 pattern — vetted list
per `@mui/x-charts-vendor`: `d3-scale`, `d3-shape`, `d3-array`, `d3-format`,
`d3-time-format`, `d3-path`), pinned exact after the JSC-safety check used
for `@lisse/core`/`@tanstack/table-core`. Peers: `octane`,
`@nativescript-community/octane`, `@nativescript/core`, and
`@octane-xplat/ui` (`>=0.6.0 <1`, the `video` precedent — the leaf renders
`View`/`Text`/`Absolute` and consumes `svgview`).

```text
src/
  props.ts            ChartProps, SeriesSpec, AxisSpec, InteractionProps
  core/
    scales.ts         band/linear/time/point wrappers over d3-scale
    marks.ts          line/area/bar/pie/scatter → Mark[] (positioned, datum refs)
    axes.ts           ticks, gridlines, label specs {x,y,anchor,text}
    svg.ts            Mark[] → <svg> markup string; emits only the
                      androidsvg ∩ SVGKit subset (paths/shapes/linear
                      gradients — no filters, no <text>)
    hit.ts            pointer coords → nearest datum (invert scales,
                      snap-to-x, touch slop)
  Chart.web.tsrx      <div> + <svg> (markup via innerHTML) + overlay
  Chart.tsrx          native: <View> + <svgview src> + <Absolute> overlay
  Chart.macos.tsrx    AppKit: <image> + native overlays
  index.ts / index.web.ts / index.macos.ts
tests/                golden markup per chart type; hit-math; scale mapping
```

`Mark[]` is the intermediate representation — each mark carries geometry
plus an optional `{series, index}` datum ref so `hit.ts` and the overlay can
map back to data. A future canvas leaf (`@octane-xplat/canvas` 2d, Skia on
both targets) consumes the same `Mark[]` — that is the documented escape
valve if src-swap redraws can't sustain live/animated charts
(victory-native XL made the same move).

## Rendering contract

| Concern                                 | Web (`Chart.web.tsrx`)                                                                                                                                                | Native (`Chart.tsrx`)                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Marks                                   | `<svg viewBox>` + `innerHTML = markup` (Icon.web precedent — shares the serializer byte-for-byte)                                                                     | `<svgview src={markup} stretch="aspectFit">`                              |
| Sizing                                  | `useMeasure` on wrapper → width/height feed the core                                                                                                                  | same hook, native leaf                                                    |
| Axis labels, legend, tooltip, crosshair | absolutely-positioned elements in an overlay `View` — **never** `<text>` in markup (androidsvg/SVGKit text is degraded; element labels also pick up theme typography) | same overlay via `Absolute` + `Text`                                      |
| Interaction                             | `onPan`/pointer handlers on overlay → `hit.ts` → cursor state → crosshair/tooltip elements                                                                            | `View.onPan` (`PanEvent` carries `x/y`/`state`) + `onTap` → same `hit.ts` |
| a11y                                    | `role="img"` + `accessibilityLabel` on the chart root; per-point labels on overlay hits                                                                               | `accessibilityLabel` on root                                              |

`svgview` registration reaches the leaf for free — the `ui` native entry
transitively imports `svg.mobile` via `Icon`/`Meter`. Verify the `svgview`
intrinsic typing resolves through ui's published native `.d.ts` chain at
scaffold time (the `declare module` augmentation is designed to propagate);
fallback is a local `declare module` block in the leaf.

## API sketch

Two tiers, MUI X / Swift Charts style — a self-contained prop-driven chart
covers the common cases; composable children are the escape hatch later,
not v1.

```tsx
// Proposed prop-driven usage at the time of this design, not runtime evidence.
import type { ChartProps } from '@octane-xplat/charts'
declare function ProposedChart(props: ChartProps): unknown

export function ProposedTripsChart() {
	return (
		<ProposedChart
			type="bar"
			height={200}
			accessibilityLabel="Items packed per trip"
			data={[
				{
					name: 'Packed',
					values: [
						{ x: 'Summer', y: 5 },
						{ x: 'Autumn', y: 8 },
					],
				},
			]}
		/>
	)
}
```

Axis model follows Swift Charts' decomposition — gridline, tick, and label
are independently toggleable (`AxisMarks` triple) — with `.value()`-style
semantic labels feeding `accessibilityLabel`.

```tsx
// Proposed axis usage; continue with ProposedChart declared above.
export function ProposedAxes() {
	return (
		<ProposedChart
			type="line"
			height={200}
			data={[
				{
					name: 'Trips',
					values: [
						{ x: 1, y: 2 },
						{ x: 2, y: 4 },
					],
				},
			]}
			xAxis={{ grid: true, ticks: false, labels: true }}
			yAxis={{ format: (value) => String(value), tickCount: 4 }}
		/>
	)
}
```

## Explicit scope cuts (v1)

- No animation. Data updates re-serialize and swap `src`/innerHTML
  (Meter precedent). If 60fps scrub animation or live streaming becomes a
  requirement, the canvas leaf is the planned answer — `Mark[]` already
  decouples geometry from the serializer.
- No zoom/pan viewport — fixed plot area, full domain.
- Chart types: line, area, bar (grouped + stacked), pie/donut, scatter.
  No candlestick, radar, heatmap, gauge — `Mark[]` + props extend cleanly.
- No per-point screen-reader rotor — chart-level `accessibilityLabel` only.
- Windows native stays parked; desktop webview apps use the web leaf.

## AppKit charts

In an existing AppKit app with `@octane-xplat/charts` installed, import `Chart`
from the package root. The `macos` export condition selects the AppKit leaf;
the public props and types match the web and mobile leaves.

```tsx
import { Chart } from '@octane-xplat/charts'

export function Visits() {
	return (
		<Chart
			type="bar"
			width={320}
			height={200}
			data={[
				{
					name: 'Visits',
					values: [
						{ x: 'Mon', y: 2 },
						{ x: 'Tue', y: 5 },
					],
				},
			]}
			legend
			tooltip
			crosshair
			accessibilityLabel="Visits by day"
		/>
	)
}
```

This produces SVG marks in one native image, with real labels for axes,
legend, and tooltip. Explicit dimensions work immediately; otherwise the
macOS `useMeasure` hook observes AppKit frame and bounds notifications.
Source changes regenerate the image. The SVG decoder has the same
[OS compatibility limits as AppKit icons](icon-svg-notes.md#evidence-and-limits).

AppKit click recognizers currently call `onTap` without coordinates. Both real
clicks and synthetic probe presses therefore select the datum nearest the
chart center, rather than the clicked position. A center miss (for example,
inside a donut hole) does not call `onPress`. Tooltip and crosshair update on
a successful tap. `onTouch` is not delivered, so `onScrub` and continuous touch
scrubbing are unavailable in this leaf. The handler accepts view-relative
`getX()` / `getY()` if a future renderer supplies them.

Run the maintained nonvisual probe from the repository root:

```sh
pnpm probe run examples/probes/charts.macos.tsrx --target macos --deps @octane-xplat/charts
```

It checks native image decoding, mounting, center-fallback handler dispatch,
and tooltip creation. It does not prove OS hit-testing or visual parity.

Verified on macOS 27.0.1 with AppKit/JavaScriptCore: a 320 × 200 SVG decoded
as an `NSImage`, the overlay filled that frame, and action dispatch selected
`Visits: 5` and created its tooltip. Charts' native, web, and macOS typecheck
lanes, all three library builds, and 18 core tests passed. iOS/Android and web
runtime rendering were not exercised for this change.

## Risks / verification gates

1. **JSC-safety of d3 deps** — same check as `@lisse/core`/`@tanstack/
table-core`: DOM-free ESM dist, exact pins. Gate at scaffold.
2. **`svgview` intrinsic typing in a leaf** — augmentation should arrive via
   ui's native types; verify before writing markup paths, stub locally if
   not.
3. **`svgview` re-parse cost** under rapid updates — Meter-scale updates are
   proven; a large-doc probe (`charts` case under `research/`) should measure
   a worst-case v1 chart (grouped bar + gridlines ≈ a few hundred nodes)
   before we promise anything beyond discrete updates.
4. **Label space** — margins must reserve room for axis labels rendered as
   elements; use fixed `margin` v1 + measured auto-margins only if cheap
   (visx's `xMax`/`yMax` pattern; Vega's "text bounds without a measurer are
   approximate" is the caution).
5. **Android SVGKit/androidsvg divergence** — serializer stays inside the
   verified subset; the probe sweep asserts rendered pixel bounds per target.
