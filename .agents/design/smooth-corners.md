# Smooth corners (`@octane-xplat/smooth-corners`)

> Design record for a leaf package that renders the same smooth-corner curve on
> every target, parameterized by the caller. The package separates surface painting from optional descendant clipping.
> Native seams require platform qualification; source is not runtime evidence.

Two tiers coexist:

- **Tier 1 (shipped, decision #38):** `corner-shape: squircle` on the
  `--radius-*` scale — free, zero components, but the rendered curve is
  whatever the engine picks: `CALayer.cornerCurve` on iOS, superellipse(n=4)
  on patched non-uniform iOS paths, CSS `corner-shape` on Chromium, plain
  round on Android/other browsers. "Smooth-ish," not cross-target identical.
- **Tier 2 (this package):** one JS-generated curve shapes the surface on every target, with
  optional clipping of descendants. Required when pixels must match iOS (sheets, cards, hero
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
  SmoothCorners.tsrx          explicit unsupported default
  SmoothCorners.mobile.tsrx   shared mobile leaf; isIOS dispatches the native adapters
  SmoothCorners.windows.tsrx  explicit unsupported WinUI boundary
  SmoothCorners.gtk.tsrx      explicit unsupported GTK boundary
  apply.ios.ts                Mason CSS clipPath ownership + CGMutablePath border stroke/shadowPath
  apply.android.ts            Mason CSS clipPath + foreground border; outline only for explicit elevation
  layout-child.ts             layout-prop split: parent metadata → outer, flex props → inner
  layout-child.web.ts         same split folded into element style objects
  SmoothCorners.web.tsrx      clip-path: path(d) + SVG stroke overlay + shadow-only SVG filter
  SmoothCorners.macos.tsrx    AppKit surface/content layout and overflow
  apply.macos.ts              Core Graphics commands → CAShapeLayer masks and shadowPath
  surface.ts                  shared decorative-surface layout and overflow predicate
```

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

The outer wrapper owns parent layout metadata and inline box geometry. The content host owns descendants and authored overflow; an absolute surface owns painting. Inline percentage dimensions, transforms and opacity belong to the outer wrapper once. Use an inner shared layout for row/column arrangements: the partial web/AppKit flex convenience props were removed rather than retained as silent mobile no-ops. Dynamic styles are property objects; static CSS belongs in `className`.

`path.ts` emits a `PathCommand[]` (`M/L/C/A/Z`, absolute) — parse `@lisse/core`'s
`generatePath()` `d` (emitters only produce `M l c a z`, circular arcs only)
and stitch `continuous` corners from the Rosenfeld table. The command list is
the single cross-platform artifact: web stringifies it, native leaves build
native path objects from it. Dependency is `@lisse/core` — leaf package, so a
real `dependencies` entry is allowed (decision #51); import only `/path` on
native so DOM-touching modules never bundle.

## Per-platform rendering

Overflow defaults to `visible`. The decorative background/border surface owns
its own smooth clip; only `overflow: hidden` requests a matching clip on the
content host. Removing hidden overflow removes the owned content mask. Shadows
belong to the outer host (SVG shadow-only filter on web, native shadow path or
elevation on native) so content clipping does not cut them off. Keep the
painting surface out of layout, accessibility, and input. The generated curve
remains shared; native overflow/hit-testing still needs target qualification.

The visible default is the platform initial value — the package ships no
stylesheet rule for it. An earlier unlayered `.vx-smooth-corners { overflow:
visible }` outranked every layered authored utility on web and the desktop
cascade, and settled only by registration order once the native transform
flattened layers (issue #204). Authored classes — layered or not — must always
decide the content clip; explicit authored `visible` still suppresses it.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { View } from '@octane-xplat/ui'

export function ClippedCard() {
  return (
    <SmoothCorners corners={24} className="bg-primary" style={{ overflow: 'hidden' }}>
      <View className="p-4" />
    </SmoothCorners>
  )
}
```

| Target | Surface painting | Child clipping and shadow |
| --- | --- | --- |
| Web | Background and inside SVG border on a decorative path-clipped surface | Computed hidden overflow enables a matching content clip; a shadow-only SVG filter sits outside it |
| iOS | Mason-owned path() clip on the decorative surface; a native inside-border stroke | Hidden content receives the same Mason clipPath; visible clears only the owned CSS value; outer shadowPath stays unclipped |
| Android | Mason paints the path-clipped background; a foreground Drawable paints the inside border | Mason CSS path() owns optional child clipping and curved-region touch exclusion; outer android.elevation uses an outline |
| macOS (AppKit) | Core Graphics/CAShapeLayer masks the decorative surface | Resolved hidden overflow enables the content mask; the outer shadowPath stays unclipped |
| Linux / Windows webview | Uses the web leaf | Same browser implementation; native desktop renderer support is separate |

Android outline paths are usable for elevation but do not imply arbitrary child clipping: Outline.canClip supports every shape only on API 33+, whereas setPath was added in API 30. Mason core 1.0.0-beta.8 implements CSS path clipping in ClipPath.kt/Mask.kt with an antialiased layer and native touch exclusion. Use that existing owner on every supported Android version; do not add an outline or rectangular fallback for content. The foreground border converts the entire logical path to device pixels once, preserving radius ratios at non-unit density. Restore component-owned CSS values, foregrounds and elevation outlines on detachment without clearing another owner's replacement.

`shadow` is explicitly supported on web/iOS/AppKit and throws on Android. `android.elevation` is native elevation in DIPs, with OS-controlled appearance. Web spread regenerates the larger/smaller silhouette, matching the native shadow-path approach. Portable border/shadow color syntax is CSS hex (alpha last), comma-separated rgb()/rgba(), or transparent; reject unsupported syntax rather than substituting black. Numeric validation rejects non-finite/negative radii and widths, smoothing outside [0,1], exponents below 2, and invalid shadow values before native drawing.

The AppKit bridge does not expose NSBezierPath.CGPath: on the actual macos-node-api host that property is undefined, leaving CAShapeLayer.path null. Build the shared commands directly with CGPathCreateMutable/CGPathAdd* instead, following the renderer's existing Core Graphics path convention. The maintained AppKit fixture checks real mask/shadow paths; source mocks alone did not catch this seam.

Native Windows/GTK have explicit throwing leaves until their path adapters are implemented and qualified. Do not treat a package import or the previous ordinary-corner Windows shell as smooth-corner support.

On iOS, the generated curve goes through Mason’s CSS clip ownership. Do not
substitute a direct CALayer mask or a redraw wrapper: overflow layout is a
separate owner that can clear those masks. Native corner-shape styling remains
the separate Tier 1 option described above.

## Explicit scope cuts (v1)

- Shaped background + optional child clipping and optional `border`/`shadow` props. Lisse's
  auto-effects (scraping computed CSS into SVG) stay web-only — native leaves
  read `view.style` instead, or the caller passes props.
- No animation between corner configs (Lisse web animates via `d` interpolation;
  native would need `CADisplayLink` path swaps — separate seam).
- `border-radius` CSS on a `SmoothCorners` element is ignored — the `corners`
  prop is the single source of truth on all leaves.

## Qualification boundaries

Run the maintained [qualification commands](../../docs/testing/smooth-corners.md). The package owns uncached device/browser tasks; pass existing device IDs and reserve host resources.

`packages/smooth-corners/tests/clipping.ios.tsrx` exercises the actual iOS
component: default visible content, a Mason-owned decorative clip, background
updates and layout, resizing, hidden content, and returning to visible. Run it
through the probe runner on an existing reserved simulator. Host regressions
verify exact CSS path forwarding and owned-value removal; they do not execute
Mason’s Swift layout or establish native rendering.

Web browser coverage checks DOM styles, geometry, browser hit-testing, class
removal, and shadow separation. Neither that evidence nor native mask reads
establishes pixel parity, OS input, or accessibility. Pixel comparison needs
separate visual-analysis authorization. Operational results belong in Silo.
