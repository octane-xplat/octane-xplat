# Smooth corners (`@octane-xplat/smooth-corners`)

> Design record for a leaf package that renders the same smooth-corner curve on
> every target, parameterized by the caller. Status: desk-source design —
> implementation not built; iOS/Android/macOS seams unverified in lab.

Two tiers coexist:

- **Tier 1 (shipped, decision #38):** `corner-shape: squircle` on the
  `--radius-*` scale — free, zero components, but the rendered curve is
  whatever the engine picks: `CALayer.cornerCurve` on iOS, superellipse(n=4)
  on patched non-uniform iOS paths, CSS `corner-shape` on Chromium, plain
  round on Android/other browsers. "Smooth-ish," not cross-target identical.
- **Tier 2 (this package):** one JS-generated curve applied as a real clip on
  every target. Required when pixels must match iOS (sheets, cards, hero
  surfaces) or when the caller wants exact smoothing control.

## Why Lisse

[Lisse](https://github.com/JaceThings/Lisse) (`@lisse/core`, MIT, zero deps)
generates smooth-corner paths as SVG `d` strings: Figma's corner-smoothing
algorithm (`squircle`, cubic shoulders + central arc, `smoothing` 0–1) plus
`arc`, `superellipse` (`exponent`), and `clothoid`. The `./path` subpath is
DOM-free — it runs under the NativeScript JS runtimes unchanged.

Two findings from its own tooling
(`tools/apple-continuous-export`, JaceThings/Lisse issue #103) shape the port:

1. **Apple's continuous corner has no smoothing parameter** — it is one fixed
   cubic-bezier construction per corner radius.
2. Figma squircle at `smoothing ≈ 0.65` (`APPLE_SMOOTHING`) approximates it to
   ~0.5 px at R=100/400×400 — close, not exact. The Rosenfeld constants below
   are the _actual_ `UIBezierPath(roundedRect:cornerRadius:)` shape, ≲0.25 px
   from live SwiftUI `.continuous`. To "match iOS almost exactly," ship these
   as a first-class curve.

```text
// Rosenfeld constants — per-corner shoulder extent p/R = 1.528665, then
// three cubics (offsets multiply by R, mirrored per corner). From
// UIBezierPath reverse-engineering; see Lisse tools/apple-continuous-export.
1.528665  (tangent point)
1.08849296, 0.0 / 0.86840694, 0.0 → 0.63149379, 0.07491139
0.37282383, 0.16905956 / 0.16905956, 0.37282383 → 0.07491139, 0.63149379
0.0, 0.86840694 / 0.0, 1.08849296 → 0.0, 1.52866498
```

## Package shape

`packages/smooth-corners` → `@octane-xplat/smooth-corners`. Same-props
component resolved by suffix (the `packages/canvas` pattern, not subpaths):

```text
src/
  props.ts                    shared props + CornerConfig types
  path.ts                     shared: generateCommands → PathCommand[]; 'continuous' (Rosenfeld)
                              builder + stitcher; delegates other curves to @lisse/core/path
  SmoothCorners.tsrx          shared native leaf — isIOS dispatches to apply.ios/apply.android
                              (dist/native is a single generic bundle, so per-OS *files* can't
                              be selected by suffix there — runtime dispatch keeps both OSes right)
  apply.ios.ts                CGMutablePath → CAShapeLayer mask + border stroke + shadowPath
  apply.android.ts            android.graphics.Path → Drawable + ViewOutlineProvider + elevation
  layout-child.ts             layout-prop split: parent metadata → outer, flex props → inner
  layout-child.web.ts         same split folded into element style objects
  SmoothCorners.web.tsrx      clip-path: path(d) + SVG stroke overlay + drop-shadow wrapper
  SmoothCorners.macos.tsrx    NSBezierPath → CAShapeLayer mask (y-flip for AppKit)
```

Built 2026-10-02: `pnpm build` emits dist/web + dist/native (check-native-dist
clean), typegen passes, `node --test tests/` covers the Rosenfeld constants,
arc conversion, per-corner mixing, and degenerate inputs (8/8). The native
mask/outline seams remain lab-unverified — see the queued experiment.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { Text } from '@octane-xplat/ui'

export function Card() {
	return (
		<SmoothCorners corners={24}>
			<Text>Packing list</Text>
		</SmoothCorners>
	)
}
```

Default `curve: 'continuous'` — the package exists for iOS parity; Figma
hand-off uses `curve: 'squircle', smoothing: 0.6` (`FIGMA_SMOOTHING`), and the
whole Lisse matrix stays available.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { Text } from '@octane-xplat/ui'

export function FigmaCard() {
	return (
		<SmoothCorners corners={{ radius: 24, curve: 'squircle', smoothing: 0.6 }}>
			<Text>Trip details</Text>
		</SmoothCorners>
	)
}
```

Layout props follow the shared leaf contract. `SmoothCornersProps` extends
`LayoutChildProps` (row/col/rowSpan/colSpan/dock, left/top/right/bottom,
horizontalAlignment/verticalAlignment, flexGrow/flexShrink/alignSelf/order)
and `FlexContainerProps` (flexDirection, justifyContent, alignItems,
flexWrap, gap/rowGap/columnGap). Parent-layout metadata lands on the outer
wrapper — the node the parent reads as its child — while flex-container
props style the inner host that owns the children. On web both fold into
CSS; the flex props also imply `display: flex` on the inner box. On the
native leaf the inner host is a gridlayout, so the flex-container props are
web/macOS-only there (documented API subset, not silent divergence).

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { Text } from '@octane-xplat/ui'

export function BadgedRow() {
	return (
		<SmoothCorners
			corners={16}
			left={12}
			top={8}
			flexDirection="row"
			alignItems="center"
			gap={8}
		>
			<Text>Badge</Text>
			<Text>Details</Text>
		</SmoothCorners>
	)
}
```

`path.ts` emits a `PathCommand[]` (`M/L/C/A/Z`, absolute) — parse `@lisse/core`'s
`generatePath()` `d` (emitters only produce `M l c a z`, circular arcs only)
and stitch `continuous` corners from the Rosenfeld table. The command list is
the single cross-platform artifact: web stringifies it, native leaves build
native path objects from it. Dependency is `@lisse/core` — leaf package, so a
real `dependencies` entry is allowed (decision #51); import only `/path` on
native so DOM-touching modules never bundle.

## Per-platform rendering

Semantics = CSS `clip-path`: the mask clips background **and** children. This
matches what the web leaf does natively and is the only honest cross-target
semantic.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { View } from '@octane-xplat/ui'

export function ClippedCard() {
	return (
		<SmoothCorners corners={24} className="bg-primary">
			<View className="p-4" />
		</SmoothCorners>
	)
}
```

| Target                  | Mechanism                                                                                                                                                                                                                                                                                                                             | Confidence                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Web                     | `clip-path: path(d)` + `ResizeObserver`; `d` used verbatim                                                                                                                                                                                                                                                                            | Chrome/FF/Safari all support `path()` clip-path; high                                                           |
| iOS                     | `CAShapeLayer` (from generated `CGMutablePath`) as `view.ios.layer.mask`, re-applied on `layoutChanged`; stroke layer added for `border`; shadow via sibling shape layer (mask clips `layer.shadow*`)                                                                                                                                 | NS core already runs `CGPathCreateMutable`/`CGPathAddCurveToPoint` in the squircle patch — interop proven. High |
| Android                 | `Drawable` subclass (JS `extend`) paints fill/stroke into `android.graphics.Path`, set via `view.android.setBackground`; children clip via `ViewOutlineProvider`: `Outline.setPath` API 33+, `Outline.setConvexPath` API 21–32 (squircle/continuous are convex — covers the main curves), concave curves fall back unclipped below 33 | desk-source; `Drawable.extend`/`setClipToOutline` are standard NS. Medium                                       |
| macOS (AppKit)          | `NSBezierPath` (ObjC — the renderer already drives `view.layer.*` but never CoreGraphics C fns) → `.CGPath` → `CAShapeLayer` mask on `view.layer`. If `CAShapeLayer` isn't in the runtime metadata, ship a ~30-line ObjC leaf via `platforms/macos/` (macos-native.md seam)                                                           | experimental target; medium                                                                                     |
| Linux / Windows webview | web leaf runs inside GTK WebKit / WebView2 — inherits web row                                                                                                                                                                                                                                                                         | medium-high                                                                                                     |
| Windows native (WinUI)  | parked with Q32–Q34 — host unproven                                                                                                                                                                                                                                                                                                   | n/a                                                                                                             |

Android gets a bonus: `Outline.setPath`/`setConvexPath` makes `elevation`
shadows follow the curve for free. If an app needs exact child-clipping on
API <33 with concave curves, the escape hatch is a Compose leaf
(`@nativescript/jetpack-compose` — `clip(GenericShape)` clips arbitrary paths
in software on all API levels); keep it out of v1 — a compose host per rounded
element is heavy.

```ts
// NativeScript Android contributor example: caller supplies the generated native Path.
export function curveOutline(path: unknown) {
	const android = (globalThis as any).android
	const outline = new android.graphics.Outline()
	if (android.os.Build.VERSION.SDK_INT >= 30) outline.setPath(path)
	else outline.setConvexPath(path) // the supplied path must be convex on older Android
	return outline
}
```

On iOS, uniform-radius `continuous` corners could instead set
`layer.cornerCurve = .continuous` — the literal Apple curve, zero path cost.
Keep it as a fast path only when `border`/per-corner mixing isn't in play;
otherwise the mask keeps uniform/non-uniform identical.

## Explicit scope cuts (v1)

- Background + child clipping and optional `border`/`shadow` props. Lisse's
  auto-effects (scraping computed CSS into SVG) stay web-only — native leaves
  read `view.style` instead, or the caller passes props.
- No animation between corner configs (Lisse web animates via `d` interpolation;
  native would need `CADisplayLink` path swaps — separate seam).
- `border-radius` CSS on a `SmoothCorners` element is ignored — the `corners`
  prop is the single source of truth on all leaves.

## Verification plan (lab, when built)

- `examples/probes` case rendering the same `corners` config on all targets;
  assert `layer.mask.path` present + `cornerCurve` unset on iOS, outline
  provider set on Android, `clip-path` computed on web.
- iOS: screenshot-diff the masked path against a `cornerCurve` reference view —
  should be ≲0.25 px (Rosenfeld residual).
- Android: API 33+ emulator for `setPath`; an API 30 emulator for the
  `setConvexPath` path.

## Open follow-ups

- Q24 is superseded by this design: Android parity does **not** require a
  ui-mobile-base AAR rebuild — a JS-level `Drawable` + outline provider covers
  it (lab pending).
- Whether `SmoothCorners` should also accept `corner-shape`/`border-radius`
  style values (so `.rounded-*` classes flow through) — likely v1.1; keeping
  props-only in v1 avoids a CSS-parse seam on native.
